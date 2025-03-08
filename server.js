const express = require('express');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer'); // Für Datei-Uploads
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = 'menu.json';

// Middleware für JSON und CORS
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.static('public')); // Statische Dateien (z. B. Bilder)

// Hilfsfunktion zum Laden von Produkten
const loadData = () => fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE)) : [];

// **🔄 Multer-Konfiguration für Bild-Uploads**
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// **📌 API-Routen**

// 🔹 GET: Alle Produkte abrufen
app.get('/products', (req, res) => res.json(loadData()));

// 🔹 POST: Neues Produkt hinzufügen (mit optionalem Bild-Upload)
app.post('/products', upload.single('image'), (req, res) => {
    let products = loadData();
    const { name, price, description, category } = req.body;
    if (!name || !price || !description || !category) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const newProduct = {
        id: Date.now(),
        name,
        price,
        description,
        category,
        image: req.file ? `/uploads/${req.file.filename}` : null
    };

    products.push(newProduct);
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
    res.status(201).json(newProduct);
});

// 🔹 PUT: Produkt bearbeiten
app.put('/products/:id', upload.single('image'), (req, res) => {
    let products = loadData();
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
        return res.status(404).json({ message: 'Producto no encontrado' });
    }

    products[index] = {
        ...products[index],
        ...req.body,
        image: req.file ? `/uploads/${req.file.filename}` : products[index].image
    };

    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
    res.json(products[index]);
});

// 🔹 DELETE: Produkt löschen
app.delete('/products/:id', (req, res) => {
    let products = loadData();
    const id = parseInt(req.params.id);
    const filteredProducts = products.filter(p => p.id !== id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(filteredProducts, null, 2));
    res.json({ message: 'Producto eliminado' });
});

// **📌 Statische Bilder für Kategorien**
app.use('/uploads', express.static('public/uploads'));

app.listen(PORT, () => console.log(`✅ Servidor corriendo en el puerto ${PORT}`));
