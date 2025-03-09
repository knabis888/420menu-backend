const express = require('express');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer'); // Für Datei-Uploads
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // UUID für sichere IDs

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'menu.json'); // Absoluter Pfad für Stabilität
const uploadDir = path.join(__dirname, 'public/happyclub/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// **📂 Sicherstellen, dass das Upload-Verzeichnis existiert**
const uploadDir = path.join(__dirname, 'public/happyclub/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// **🔄 Multer-Konfiguration für Bild-Uploads**
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("🔄 Speichere Datei in:", uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const fileName = Date.now() + path.extname(file.originalname);
        console.log("📁 Datei-Name:", fileName);
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
        id: Date.now(),
        name,
        price,
        description,
        category,
        image: req.file ? `/happyclub/uploads/${req.file.filename}` : null
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
app.use('/happyclub/uploads', express.static(uploadDir));

app.listen(PORT, () => console.log(`✅ Servidor corriendo en el puerto ${PORT}`));
