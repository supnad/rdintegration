import axios from 'axios';
import dotenv from 'dotenv';
import { rateLimit } from '../lib/rate-limit';

dotenv.config();

const RD_API_BASE = 'https://crm.rdstation.com/api/v1/contacts';

export default async function handler(req, res) {
  if (!rateLimit(req, 5)) {
    return res.status(429).json({ message: 'Muitas requisições. Tente novamente em breve.' });
  }

  const { method } = req;

  if (method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ message: 'Campos obrigatórios: name e phone' });
  }

  try {
    // 1. Verifica se o lead já existe
    const getUrl = `${RD_API_BASE}?phone=${encodeURIComponent(phone)}&token=${process.env.RD_TOKEN}`;

    const getResponse = await axios.get(getUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (getResponse.data?.contacts?.length > 0) {
      return res.status(200).json({ message: 'Lead já existe. Nenhuma ação feita.' });
    }

    // 2. Se não existir, cria o lead
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
        'Accept': 'application/json'
      }
    });

    return res.status(201).json({ message: 'Lead criado com sucesso.', data: postResponse.data });

  } catch (error) {
    console.error('Erro na integração:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Erro interno ao processar a requisição.'
    });
  }
}
