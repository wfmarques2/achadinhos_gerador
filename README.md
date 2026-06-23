# Gerador de Achadinhos - Júh Indica

Aplicativo para gerar textos de indicação de produtos para Mercado Livre, Amazon, Shopee, Magalu e SHEIN!

## 🚀 Deploy na KingHost

### Opção 1: Hospedagem Node.js (Recomendado)
Se sua KingHost tem suporte a Node.js:

1. **Acesse o painel da KingHost**:
   - Vá para [kinghost.com.br](https://www.kinghost.com.br)
   - Acesse o painel de controle

2. **Envie os arquivos**:
   - Use FTP ou o Gerenciador de Arquivos da KingHost para enviar:
     - `package.json`
     - `server.js`
     - `public/` (pasta inteira)

3. **Instale as dependências**:
   - Acesse o terminal SSH da KingHost
   - Vá para a pasta do projeto
   - Execute:
     ```bash
     npm install
     ```

4. **Inicie o servidor**:
   - Use PM2 para manter o servidor rodando:
     ```bash
     npm install -g pm2
     pm2 start server.js --name "gerador-achadinhos"
     pm2 save
     pm2 startup
     ```

5. **Configure o proxy reverso**:
   - No painel da KingHost, crie um proxy reverso para a porta que o servidor está usando (padrão: 3002)

---

### Opção 2: Somente Frontend (Sem scraping automático)
Se sua KingHost não tem suporte a Node.js, use a versão com inputs manuais:

1. **Modifique o index.html** para remover a parte de scraping automático (opcional)
2. **Envie a pasta `public/`** para a pasta `public_html` da KingHost

---

## 📦 Arquivos Necessários para Deploy
- `package.json`
- `server.js`
- `public/` (incluindo assets/)

## 🛠️ Funcionalidades
- Mercado Livre: Scraping automático
- Amazon: Scraping automático
- Shopee: Inputs manuais com máscara
- Magalu: Inputs manuais com máscara
- SHEIN: Inputs manuais com máscara
