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

// **📂 Sicherstellen, dass das Upload-Verzeichnis existiert**
const uploadDir = 'public/uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// **🔄 Multer-Konfiguration für Bild-Uploads**
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// **📌 API-Routen**
const loadData = () => {
    if (!fs.existsSync(DATA_FILE)) return [];
    let products = JSON.parse(fs.readFileSync(DATA_FILE));

    // IDs automatisch hinzufügen, falls sie fehlen
    products = products.map((product, index) => ({
        id: product.id || index + 1, // Falls kein ID existiert, generiere eine
        ...product
    }));

    return products;
};

const saveData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

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
    saveData(products);
    res.status(201).json(newProduct);
});

// 🔹 PUT: Produkt bearbeiten (mit optionalem Bild)
app.put('/products/:id', upload.single('image'), (req, res) => {
    let products = loadData();
    const id = parseInt(req.params.id); 

    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
        return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Produkt-Daten aktualisieren
    products[index] = {
        ...products[index],
        name: req.body.name || products[index].name,
        price: req.body.price || products[index].price,
        description: req.body.description || products[index].description,
        category: req.body.category || products[index].category,
        image: req.file ? `/uploads/${req.file.filename}` : products[index].image
    };

    saveData(products);
    res.json(products[index]);
});

// 🔹 DELETE: Produkt löschen
app.delete('/products/:id', (req, res) => {
    let products = loadData();
    const id = parseInt(req.params.id);
    const filteredProducts = products.filter(p => p.id !== id);

    if (products.length === filteredProducts.length) {
        return res.status(404).json({ message: 'Producto no encontrado' });
    }

    saveData(filteredProducts);
    res.json({ message: 'Producto eliminado' });
});

// **📌 Statische Bilder für Kategorien**
app.use('/uploads', express.static(uploadDir));

app.listen(PORT, () => console.log(`✅ Servidor corriendo en el puerto ${PORT}`));
0