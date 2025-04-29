import express from 'express';
import logsApi from './api/logs.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve arquivos estáticos, como logs.html
app.use(express.static('public'));

// API
app.use('/api', logsApi);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
