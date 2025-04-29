import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const LOG_PATH = path.resolve('data', 'logs.json');

// Cria diretório e arquivo se não existirem
if (!fs.existsSync(LOG_PATH)) {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.writeFileSync(LOG_PATH, '[]', 'utf-8');
}

router.get('/logs', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  try {
    const raw = fs.readFileSync(LOG_PATH, 'utf-8');
    const allLogs = JSON.parse(raw);

    // Filtra logs com menos de 30 dias
    const filtered = allLogs.filter(log => now - new Date(log.date).getTime() <= THIRTY_DAYS);

    // Sobrescreve apenas com logs válidos
    if (filtered.length !== allLogs.length) {
      fs.writeFileSync(LOG_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
    }

    // Paginação
    const start = (pageInt - 1) * limitInt;
    const paginated = filtered.slice(start, start + limitInt);

    res.json(paginated);
  } catch (err) {
    console.error('Erro ao ler logs:', err);
    res.status(500).json({ message: 'Erro ao ler os logs.' });
  }
});

export default router;
