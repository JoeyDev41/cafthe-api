// ArticleController.js — Contrôleur des articles
// C'est ici que je gère la logique métier entre les routes et le modèle
// Chaque fonction correspond à une action : lister, chercher, créer, modifier, supprimer

const {
  getAllArticles,
  getArticleById,
  getArticlesByCategory,
  searchArticles,
  createArticle,
  updateArticle,
  deleteArticle,
} = require("../models/ArticleModel");

// Récupérer tous les articles
const getAll = async (req, res) => {
  try {
    const articles = await getAllArticles();

    res.json({
      message: "Articles récupérés avec succès",
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error("Erreur de récupération des articles", error.message);
    res.status(500).json({
      message: "Erreur de récupération des articles",
    });
  }
};

// Récupérer un article par son ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const articleId = parseInt(id);

    const articles = await getArticleById(id);

    // Si le tableau est vide, l'article n'existe pas
    if (articles.length === 0) {
      return res.status(404).json({
        message: "Article non trouvé",
      });
    }

    res.json({
      message: "Article récupéré avec succès",
      article: articles[0],
    });
  } catch (error) {
    console.error("Erreur de récupération de l'article", error.message);
    res.status(500).json({
      message: "Erreur de récupération de l'articles",
    });
  }
};

// Récupérer les produits par catégorie (the, cafe, accessoire)
const getByCategory = async (req, res) => {
  try {
    const { categorie } = req.params;
    const articles = await getArticlesByCategory(categorie);

    res.json({
      message: `Articles de la catégorie ${categorie}`,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error("Erreur de récupération par catégorie", error.message);
    res.status(500).json({
      message: "Erreur de récupération des articles",
    });
  }
};

// Recherche avec filtres, tri et pagination
// Les paramètres sont passés en query string (req.query)
const search = async (req, res) => {
  try {
    const result = await searchArticles(req.query);

    res.json({
      message: "Résultats de recherche",
      ...result,
    });
  } catch (error) {
    console.error("Erreur de recherche des articles", error.message);
    res.status(500).json({
      message: "Erreur lors de la recherche",
    });
  }
};

// Créer un article (réservé admin/vendeur via middleware)
const create = async (req, res) => {
  try {
    const { nom_produit, description, categorie, type_vente, prix_ht, stock, images, origine } = req.body;

    // Vérification des champs obligatoires
    if (!nom_produit || !description || !categorie || !type_vente || !prix_ht || stock === undefined) {
      return res.status(400).json({
        message: "Champs obligatoires manquants",
      });
    }

    // Calcul automatique de la TVA et du prix TTC selon la catégorie
    // D'après le cahier des charges : 5.5% pour thé/café, 20% pour accessoires
    const taux_tva = categorie === "accessoire" ? 20 : 5.5;
    const prix_ttc = parseFloat((prix_ht * (1 + taux_tva / 100)).toFixed(2));

    const result = await createArticle({
      nom_produit,
      description,
      categorie,
      type_vente,
      prix_ht: parseFloat(prix_ht),
      taux_tva,
      prix_ttc,
      stock: parseInt(stock),
      images,
      origine,
    });

    res.status(201).json({
      message: "Article créé avec succès",
      articleId: result.insertId,
    });
  } catch (error) {
    console.error("Erreur création article", error.message);
    res.status(500).json({
      message: "Erreur lors de la création de l'article",
    });
  }
};

// Mettre à jour un article (réservé admin/vendeur)
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_produit, description, categorie, type_vente, prix_ht, stock, images, origine } = req.body;

    // Vérifier que l'article existe avant de le modifier
    const existing = await getArticleById(id);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Article non trouvé" });
    }

    // Recalcul de la TVA et du TTC en cas de changement de catégorie ou de prix
    const cat = categorie || existing[0].categorie;
    const taux_tva = cat === "accessoire" ? 20 : 5.5;
    const ht = parseFloat(prix_ht || existing[0].prix_ht);
    const prix_ttc = parseFloat((ht * (1 + taux_tva / 100)).toFixed(2));

    const result = await updateArticle(id, {
      nom_produit: nom_produit || existing[0].nom_produit,
      description: description || existing[0].description,
      categorie: cat,
      type_vente: type_vente || existing[0].type_vente,
      prix_ht: ht,
      taux_tva,
      prix_ttc,
      stock: stock !== undefined ? parseInt(stock) : existing[0].stock,
      images: images !== undefined ? images : existing[0].images,
      origine: origine !== undefined ? origine : existing[0].origine,
    });

    res.json({
      message: "Article mis à jour avec succès",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Erreur mise à jour article", error.message);
    res.status(500).json({
      message: "Erreur lors de la mise à jour de l'article",
    });
  }
};

// Supprimer un article (réservé admin/vendeur)
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'article existe
    const existing = await getArticleById(id);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Article non trouvé" });
    }

    const result = await deleteArticle(id);

    res.json({
      message: "Article supprimé avec succès",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Erreur suppression article", error.message);
    res.status(500).json({
      message: "Erreur lors de la suppression de l'article",
    });
  }
};

module.exports = { getAll, getById, getByCategory, search, create, update, remove };
