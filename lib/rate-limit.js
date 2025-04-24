import { LRUCache } from 'lru-cache'; // Altere para a importação nomeada

const rateLimitOptions = {
  max: 50, // até 50 IPs únicos
  ttl: 60 * 1000, // 1 minuto
};

const tokenCache = new LRUCache(rateLimitOptions); // Use LRUCache em vez de LRU

export function rateLimit(req, limit = 10) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const tokenCount = tokenCache.get(ip) || 0;

  if (tokenCount >= limit) {
    return false;
  }

  tokenCache.set(ip, tokenCount + 1);
  return true;
}
