# RD Integration Middleware

Este projeto é um middleware desenvolvido para integrar a plataforma de atendimento **Huggy** com o **RD Station CRM**, automatizando a criação de leads e o envio de eventos personalizados conforme regras específicas da empresa.

## 🔧 Funcionalidades

- Recebe eventos enviados via Webhook pelo Huggy.
- Transforma dados do atendimento em payloads compatíveis com a API do RD Station.
- Registra eventos personalizados e cria/atualiza leads automaticamente.
- Realiza validações e mapeamentos de dados com base em regras internas da empresa.
- Armazena logs das integrações bem-sucedidas com nome, telefone e data.
- Dashboard web `/logs` para visualização dos registros, com paginação e estilo responsivo.

## 🛠️ Tecnologias Utilizadas

- **Node.js**
- **Supabase** – utilizado para armazenar os logs das integrações.
- **RD Station API** – para envio dos eventos e manipulação dos leads.
- **Huggy Webhooks** – para disparo dos dados de atendimento.
- **Vercel** – ambiente de deploy e execução das funções serverless.

## 🔒 Regras de Negócio

- Apenas leads com número de telefone válido (com DDD) são processados.

## 📂 Estrutura do Projeto

```
rd-integration/
├── .gitignore
├── api
    ├── lead.js
    └── logs.js
├── lib
    └── rate-limit.js
├── package-lock.json
├── package.json
├── public
    ├── favicon.svg
    └── logs.html
└── vercel.json
```

## 📈 Interface `/logs`

Acesse `/logs` no navegador para visualizar os registros das integrações realizadas. A interface inclui:

- Tabela com **nome**, **telefone** e **data da importação**
- Filtro de quantidade de registros por página: 20, 50 ou 100
- Estilo zebrado e responsivo

## ▶️ Como executar localmente

1. Instale as dependências:

```bash
npm install
```

2. Configure as variáveis de ambiente no arquivo `.env`:

```env
RD_ACCESS_TOKEN=...
SUPABASE_URL=...
SUPABASE_API_KEY=...
```

3. Rode localmente com o Vercel:

```bash
npx vercel dev
```

## 📤 Deploy

Para deploy, use:

```bash
vercel --prod
```

Certifique-se de configurar corretamente as variáveis de ambiente no painel da Vercel.

## 🧪 Testes

Você pode simular eventos do Huggy usando ferramentas como Postman ou Insomnia, enviando JSONs para o endpoint `/api/lead`.
