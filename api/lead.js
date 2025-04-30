import axios from 'axios';
import 'dotenv/config.js';
import { rateLimit } from '../lib/rate-limit.js';
import { createClient } from '@supabase/supabase-js';

const RD_API_BASE = 'https://crm.rdstation.com/api/v1/contacts';

// Inicializa o cliente Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function sanitizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 13) return digits;
  if (digits.length === 12) return digits.slice(0, 4) + '9' + digits.slice(4);
  return null;
}

function sanitizeName(name) {
  if (typeof name !== 'string') return null;
  let clean = name.replace(/:[^:\s]+:/g, ''); // Remove :emoji:
  clean = clean.replace(/[^\p{L}\s]/gu, '').trim(); // Remove números e símbolos, mas mantém acentos e letras Unicode
  return clean.length >= 3 ? clean : null;
}

export default async function handler(req, res) {
  if (!rateLimit(req, 5)) {
    return res.status(429).json({ message: 'Muitas requisições. Tente novamente em breve.' });
  }

  const { method } = req;

  if (method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  let { name, phone } = req.body;

  name = sanitizeName(name);
  phone = sanitizePhone(phone);

  if (!name || !phone) {
    return res.status(400).json({ message: 'Nome ou telefone inválido após formatação' });
  }

  try {
    const getUrl = `${RD_API_BASE}?phone=${encodeURIComponent(phone)}&token=${process.env.RD_TOKEN}`;

    const getResponse = await axios.get(getUrl, {
      headers: { Accept: 'application/json' }
    });

    if (getResponse.data?.contacts?.length > 0) {
      return res.status(200).json({ message: 'Lead já existe. Nenhuma ação feita.' });
    }

    const postUrl = `${RD_API_BASE}?token=${process.env.RD_TOKEN}`;
    const postData = {
      contact: {
        name,
        phones: [{ phone }],
        legal_bases: [
          {
            category: 'data_processing',
            status: 'granted',
            type: 'consent'
          }
        ]
      }
    };

    const postResponse = await axios.post(postUrl, postData, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });

    // Salvar no Supabase
    const { error: supabaseError } = await supabase
      .from('logs')
      .insert([{ name, phone }]);

    if (supabaseError) {
      console.error('Erro ao salvar log no Supabase:', supabaseError.message);
    }

    return res.status(201).json({ message: 'Lead criado com sucesso.', data: postResponse.data });

  } catch (error) {
    console.error('Erro na integração:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Erro interno ao processar a requisição.' });
  }
}
