const express = require('express');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer'); // Für Datei-Uploads
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // UUID für sichere IDs

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'menu.json'); // Absoluter Pfad für Stabilität
const UPLOAD_DIR = path.join(__dirname, 'public/uploads'); // Absolute Pfade helfen!

// **📂 Sicherstellen, dass das Upload-Verzeichnis existiert**
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// **🔄 Multer-Konfiguration für Bild-Uploads**
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("🔄 Speichere Datei in:", UPLOAD_DIR);
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const fileName = uuidv4() + path.extname(file.originalname); // UUID als Datei-Name
        console.log("📁 Datei gespeichert als:", fileName);
        cb(null, fileName);
    }
});
const upload = multer({ storage });

// **📌 Hilfsfunktionen**
const loadData = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        let products = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

        // IDs hinzufügen, falls sie fehlen
        return products.map((product, index) => ({
            id: product.id || uuidv4(),  // UUID für eindeutige IDs
            ...product
        }));
    } catch (error) {
        console.error("❌ Fehler beim Laden der JSON-Daten:", error);
        return [];
    }
};

const saveData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// **🔹 GET: Alle Produkte abrufen**
app.get('/products', (req, res) => {
    console.log("📡 GET: Abrufen der Produkte");
    res.json(loadData());
});

// **🔹 POST: Neues Produkt hinzufügen**
app.post('/products', upload.single('image'), (req, res) => {
    let products = loadData();
    const { name, price, description, category } = req.body;
    
    if (!name || !price || !description || !category) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const newProduct = {
        id: uuidv4(),
        name,
        price,
        description,
        category,
        image: req.file ? `/uploads/${req.file.filename}` : null
    };

    products.push(newProduct);
    saveData(products);
    console.log("✅ Producto agregado:", newProduct);
    res.status(201).json(newProduct);
});

// **🔹 PUT: Produkt bearbeiten**
app.put('/products/:id', upload.single('image'), (req, res) => {
    let products = loadData();
    const id = req.params.id;
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
        return res.status(404).json({ message: 'Producto no encontrado' });
    }

    console.log("✏️ Produkt aktualisieren:", req.body);

    // Falls ein Bild hochgeladen wurde, speichere es
    if (req.file) {
        console.log("🖼️ Neues Bild hochgeladen:", req.file.filename);
        products[index].image = `/uploads/${req.file.filename}`;
    }

    // Nur die übermittelten Felder aktualisieren (nicht alles überschreiben!)
    Object.keys(req.body).forEach(key => {
        if (req.body[key]) {
            products[index][key] = req.body[key];
        }
    });

    saveData(products);
    res.json(products[index]);
});

// **🔹 DELETE: Produkt löschen**
app.delete('/products/:id', (req, res) => {
    let products = loadData();
    const id = req.params.id;
    const filteredProducts = products.filter(p => p.id !== id);

    if (products.length === filteredProducts.length) {
        return res.status(404).json({ message: 'Producto no encontrado' });
    }

    saveData(filteredProducts);
    console.log("🗑️ Producto eliminado:", id);
    res.json({ message: 'Producto eliminado' });
});

// **📌 Bilder als statische Dateien bereitstellen**
app.use('/uploads', express.static(UPLOAD_DIR));

app.listen(PORT, () => console.log(`✅ Servidor corriendo en el puerto ${PORT}`));
