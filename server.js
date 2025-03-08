const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = 'menu.json';

app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.static('public'));

// Lade Produkte
const loadData = () => fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE)) : [];

// API Routen
app.get('/products', (req, res) => res.json(loadData()));

app.post('/products', (req, res) => {
    let products = loadData();
    const { name, price, description, category } = req.body;

    if (!name || !price || !description || !category) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const newProduct = { id: Date.now(), name, price, description, category };
    products.push(newProduct);
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
    res.status(201).json(newProduct);
});

app.delete('/products/:id', (req, res) => {
    let products = loadData();
    const id = parseInt(req.params.id);
    const filteredProducts = products.filter(p => p.id !== id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(filteredProducts, null, 2));
    res.json({ message: 'Producto eliminado' });
});

app.listen(PORT, () => console.log(`✅ Servidor corriendo en el puerto ${PORT}`));
