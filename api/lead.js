import axios from 'axios';
import 'dotenv/config.js';
import { rateLimit } from '../lib/rate-limit.js';
import fs from 'fs/promises';
import path from 'path';

const LOGS_PATH = path.resolve('./data/logs.json');
const RD_API_BASE = 'https://crm.rdstation.com/api/v1/contacts';

function sanitizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 13) return digits;
  if (digits.length === 12) return digits.slice(0, 4) + '9' + digits.slice(4);
  return null;
}

function sanitizeName(name) {
  let clean = name.replace(/:[^:\s]+:/g, ''); // Remove :emoji:
  clean = clean.replace(/[^a-zA-Z\s]/g, '').trim(); // Remove caracteres especiais e números
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

    // Salvar dados no JSON local
    try {
      const logsRaw = await fs.readFile(LOGS_PATH, 'utf-8');
      const logs = JSON.parse(logsRaw);
      const lastId = logs.length > 0 ? logs[logs.length - 1].id || 0 : 0;
      
      logs.push({
        id: lastId + 1,
        name,
        phone,
        date: new Date().toISOString()
      });
      await fs.writeFile(LOGS_PATH, JSON.stringify(logs, null, 2));
    } catch (writeErr) {
      console.error('Erro ao salvar no logs.json:', writeErr);
    }

    return res.status(201).json({ message: 'Lead criado com sucesso.', data: postResponse.data });

  } catch (error) {
    console.error('Erro na integração:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Erro interno ao processar a requisição.' });
  }
}
