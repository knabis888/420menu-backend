const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = 'menu.json';

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Hilfsfunktion zum Laden der Produkte
const loadData = () => {
    if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE));
    }
    return [];
};

// Produkte abrufen
app.get('/products', (req, res) => {
    res.json(loadData());
});

// Neues Produkt hinzufügen
app.post('/products', (req, res) => {
    let products = loadData();
    const newProduct = { id: Date.now(), ...req.body };
    products.push(newProduct);
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
    res.status(201).json(newProduct);
});

// Produkt bearbeiten
app.put('/products/:id', (req, res) => {
    let products = loadData();
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products[index] = { ...products[index], ...req.body };
        fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
        res.json(products[index]);
    } else {
        res.status(404).json({ message: 'Produkt nicht gefunden' });
    }
});

// Produkt löschen
app.delete('/products/:id', (req, res) => {
    let products = loadData();
    const id = parseInt(req.params.id);
    const filteredProducts = products.filter(p => p.id !== id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(filteredProducts, null, 2));
    res.json({ message: 'Produkt gelöscht' });
});

app.listen(PORT, () => {
    console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
