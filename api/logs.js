import fs from 'fs/promises';
import path from 'path';

const LOGS_PATH = path.resolve('./data/logs.json');
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { page = 1, limit = 20 } = req.query;
  const now = Date.now();

  try {
    const raw = await fs.readFile(LOGS_PATH, 'utf-8');
    const allLogs = JSON.parse(raw);

    // Filtrar logs até 30 dias
    const recentLogs = allLogs.filter(log =>
      now - new Date(log.date).getTime() <= THIRTY_DAYS
    );

    // Reescreve o JSON com logs válidos
    if (recentLogs.length !== allLogs.length) {
      await fs.writeFile(LOGS_PATH, JSON.stringify(recentLogs, null, 2));
    }

    // Paginação
    const p = parseInt(page);
    const l = parseInt(limit);
    const start = (p - 1) * l;
    const paginated = recentLogs.slice(start, start + l);

    return res.status(200).json(paginated);
  } catch (err) {
    console.error('Erro ao ler logs:', err);
    return res.status(500).json({ message: 'Erro ao ler os logs.' });
  }
}
