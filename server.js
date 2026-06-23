const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Função para adicionar centavos se necessário
function formatPrice(price) {
    if (!price) return price;
    // Remove R$ and any other currency symbols
    price = price.replace(/[^0-9,.]/g, '');
    // Convert US format (.) to BR (,) if needed
    price = price.replace('.', ',');
    if (!price.includes(',')) {
        return price + ',00';
    }
    return price;
}

// Função para scraping do Mercado Livre
async function scrapeMercadoLivre(url) {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    let productName = '';
    let oldPrice = '';
    let currentPrice = '';

    // Tentar pegar nome da meta tag
    productName = $('meta[name="title"]').attr('content') || $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim();
    
    // Pegar preços com centavos
    const oldPriceContainer = $('.andes-money-amount--previous').first();
    const currentPriceContainer = $('.andes-money-amount--cents-superscript').first();
    
    if (oldPriceContainer.length) {
        oldPrice = oldPriceContainer.text().trim().replace(/R\$\s?/g, '');
    } else {
        const priceElements = $('.andes-money-amount__fraction');
        if (priceElements.length >= 2) {
            oldPrice = $(priceElements[0]).text().trim();
            currentPrice = $(priceElements[1]).text().trim();
        }
    }
    
    if (currentPriceContainer.length) {
        currentPrice = currentPriceContainer.text().trim().replace(/R\$\s?/g, '');
    }

    return { productName, oldPrice, currentPrice };
}

// Função para scraping da Amazon
async function scrapeAmazon(url) {
    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9'
        }
    });
    const $ = cheerio.load(response.data);

    let productName = '';
    let oldPrice = '';
    let currentPrice = '';

    // Tentar pegar nome do produto
    const titleSelectors = [
        '#productTitle',
        'h1#title',
        'meta[name="title"]',
        'meta[property="og:title"]'
    ];
    for (const selector of titleSelectors) {
        const el = $(selector);
        if (el.length > 0) {
            productName = el.text().trim() || el.attr('content');
            if (productName) break;
        }
    }

    // Tentar pegar preço antigo (priorizar basisPrice)
    const oldPriceSelectors = [
        '.basisPrice .a-offscreen',
        '.priceBlockStrikePriceString',
        '.a-price.a-text-price .a-offscreen'
    ];
    for (const selector of oldPriceSelectors) {
        const el = $(selector).first();
        if (el.length > 0) {
            oldPrice = el.text().trim();
            if (oldPrice) break;
        }
    }

    // Tentar pegar preço atual - usar o hidden input field
    const priceInput = $('input[name="items[0.base][customerVisiblePrice][amount]"]').first();
    if (priceInput.length > 0) {
        const priceValue = priceInput.val();
        if (priceValue) {
            currentPrice = 'R$' + priceValue.replace('.', ',');
        }
    }

    // Fallback para preço atual caso o input não exista
    if (!currentPrice) {
        const currentPriceSelectors = [
            '.apex-pricetopay-value .a-offscreen',
            '.reinventPricePriceToPayMargin .a-offscreen',
            '.a-price .a-offscreen'
        ];
        for (const selector of currentPriceSelectors) {
            const el = $(selector).first();
            if (el.length > 0) {
                currentPrice = el.text().trim();
                if (currentPrice) break;
            }
        }
    }

    return { productName, oldPrice, currentPrice };
}

app.post('/scrape', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL é obrigatória' });
        }

        let result;

        // Detectar plataforma
        if (url.includes('mercadolivre') || url.includes('meli')) {
            result = await scrapeMercadoLivre(url);
        } else if (url.includes('amazon') || url.includes('link.amazon')) {
            result = await scrapeAmazon(url);
        } else {
            return res.status(400).json({ error: 'URL não suportada. Use links do Mercado Livre ou Amazon.' });
        }

        // Formatar os preços para adicionar ,00 se necessário
        result.oldPrice = formatPrice(result.oldPrice);
        result.currentPrice = formatPrice(result.currentPrice);

        res.json(result);
    } catch (error) {
        console.error('Erro ao fazer scraping:', error);
        res.status(500).json({ error: 'Erro ao processar a URL' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
