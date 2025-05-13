const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require('crypto'); // Pour générer un ID unique
const app = express();
const PORT = 3000;


// Middleware pour servir les fichiers statiques
app.use(express.static(path.join(__dirname, "public")));
// Middleware pour analyser le JSON dans le corps des requêtes
app.use(express.json());

// Endpoint pour récupérer les produits
app.get("/api/products", (req, res) => {
  fs.readFile("./products.json", "utf8", (err, data) => {
    if (err) {
      console.error("Erreur lors de la lecture de products.json :", err);
      return res.status(500).json({ error: "Erreur serveur." });
    }
    res.json(JSON.parse(data));
  });
});


// Endpoint pour ajouter un produit au panier
app.post('/add-to-cart', (req, res) => {
  const { userId, produit, quantity } = req.body;

  if (!userId || !produit|| !quantity) {
    return res.status(400).json({ error: 'Données manquantes.' });
  }

  const usersData = JSON.parse(fs.readFileSync('users.json', 'utf8'));

  // Trouver l'utilisateur par ID
  const user = usersData.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé.' });
  }

  const existingProduct = user.cart.find((item) => item.id === produit.id);
    if (existingProduct) {
      // Mettre à jour la quantité
      existingProduct.quantity += quantity;
    } else {
      // Ajouter un nouveau produit
      produit.quantity=quantity;
      user.cart.push(produit);
    }

  

  // Sauvegarder les modifications
  fs.writeFileSync('users.json', JSON.stringify(usersData, null, 2));

  res.status(200).json({ message: 'Produit ajouté au panier.', cart: user.cart });
});

app.get("/api/points", (req, res) => {
  fs.readFile("./points.json", "utf8", (err, data) => {
    if (err) {
      console.error("Erreur lors de la lecture de points.json :", err);
      return res.status(500).json({ error: "Erreur serveur." });
    }
    res.json(JSON.parse(data));
  });
});


// Endpoint pour récupérer le panier d'un utilisateur
app.get('/cart/:userId', (req, res) => {
  const { userId } = req.params;

  const usersData = JSON.parse(fs.readFileSync('users.json', 'utf8'));

  // Trouver l'utilisateur par ID
  const user = usersData.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé.' });
  }

  res.status(200).json({ cart: user.cart });
});



app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
  }

  const usersData = JSON.parse(fs.readFileSync('users.json', 'utf8'));
  const user = usersData.users.find((u) => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
  }

  // Simuler la session utilisateur
  const sessionId = `session_${user.id}`;
  res.status(200).json({ message: 'Connexion réussie', sessionId, userId: user.id});
});

app.post('/logout', (req, res) => {
  // On peut invalider la session côté client uniquement
  res.status(200).json({ message: 'Déconnexion réussie' });
});



// Endpoint d'inscription
app.post('/register', (req, res) => {
  const { username, password, phone } = req.body;

  if (!username || !password || !phone ) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  const usersData = JSON.parse(fs.readFileSync('users.json', 'utf8'));

  // Vérifier si le nom d'utilisateur existe déjà
  const userExists = usersData.users.some((user) => user.username === username );
  if (userExists) {
    return res.status(409).json({ error: 'Nom d\'utilisateur ou email déjà utilisé' });
  }

  // Ajouter un nouvel utilisateur
  const newUser = {
    id: crypto.randomUUID(), // ID unique
    username,
    password, // Vous pouvez hacher le mot de passe pour plus de sécurité
    phone,
    cart: [] // Panier vide au départ
  };

  usersData.users.push(newUser);

  // Sauvegarder les données
  fs.writeFileSync('users.json', JSON.stringify(usersData, null, 2));

  res.status(201).json({ message: 'Inscription réussie', userId: newUser.id });
});

app.delete("/api/panier/:userId/:productId", (req, res) => {
  const { userId, productId } = req.params;

  const usersData = JSON.parse(fs.readFileSync('users.json', 'utf8'));
  const user = usersData.users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé." });
  }

  user.cart = user.cart.filter((item) => item.id !== productId);

  fs.writeFileSync('users.json', JSON.stringify(usersData, null, 2));
  res.status(200).json({ message: "Produit supprimé du panier.", cart: user.cart });
});

//mettre a jour la quantité dùun produit du panier
app.patch('/add-to-cart', (req, res) => {
  const { userId, produit, quantity } = req.body;

  if (!userId || !produit || !quantity) {
    return res.status(400).json({ error: "Données manquantes." });
  }

  const usersData = JSON.parse(fs.readFileSync('users.json', 'utf8'));
  const user = usersData.users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé." });
  }

  const existingProduct = user.cart.find((item) => item.id === produit.id);
  if (existingProduct) {
    existingProduct.quantity = quantity;
    fs.writeFileSync('users.json', JSON.stringify(usersData, null, 2));
    return res.status(200).json({ message: "Quantité mise à jour.", cart: user.cart });
  }

  res.status(404).json({ error: "Produit non trouvé dans le panier." });
});

// Endpoint pour récupérer les informations d'un utilisateur par ID
app.get('/user/:userId', (req, res) => {
  const { userId } = req.params;

  const usersData = JSON.parse(fs.readFileSync('users.json', 'utf8'));
  const user = usersData.users.find((u) => u.id === userId);

  if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
  }

  res.status(200).json({ username: user.username });
});

// Ajouter un produit dashboard
app.post('/api/products', (req, res) => {
  const { name, price, description, image } = req.body;

  const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
  const newProduct = {
    id: crypto.randomUUID(),
    name,
    price,
    description,
    image
  };
  products.push(newProduct);
  fs.writeFileSync('products.json', JSON.stringify(products, null, 2));

  res.status(201).json(newProduct);
});

// Supprimer un produit dashboard
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;

  const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
  const updatedProducts = products.filter(product => product.id !== id);
  fs.writeFileSync('products.json', JSON.stringify(updatedProducts, null, 2));

  res.status(200).json({ message: 'Produit supprimé' });
});

// Supprimer un utilisateur dashboard
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;

  const usersData = JSON.parse(fs.readFileSync('users.json', 'utf8'));
  usersData.users = usersData.users.filter(user => user.id !== id);
  fs.writeFileSync('users.json', JSON.stringify(usersData, null, 2));

  res.status(200).json({ message: 'Utilisateur supprimé' });
});

// Liste des utilisateurs dashboard
app.get('/api/users', (req, res) => {
  const usersData = JSON.parse(fs.readFileSync('users.json', 'utf8'));
  res.json(usersData.users);
});

// Endpoint pour enregistrer une commande
app.post('/api/order', (req, res) => {
  const { username, phone, items } = req.body;

  if (!username || !phone || !items || items.length === 0) {
    return res.status(400).json({ error: "Données de commande invalides." });
  }

  const orders = JSON.parse(fs.readFileSync('order.json', 'utf8'));
  const newOrder = {
    id: crypto.randomUUID(),
    username,
    phone,
    items,
    date: new Date().toISOString(),
  };

  orders.push(newOrder);
  fs.writeFileSync('order.json', JSON.stringify(orders, null, 2));

  res.status(201).json({ message: "Commande enregistrée avec succès." });
});

// Endpoint pour récupérer les informations de l'utilisateur
app.get('/api/users/:userId', (req, res) => {
  const { userId } = req.params;

  const usersData = JSON.parse(fs.readFileSync('users.json', 'utf8'));
  const user = usersData.users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé." });
  }

  res.status(200).json(user);
});

app.get("/api/orders", (req, res) => {
  const orders = JSON.parse(fs.readFileSync("order.json", "utf8"));
  res.status(200).json(orders);
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
