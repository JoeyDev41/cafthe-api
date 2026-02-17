// ArticleModel.js — Modèle pour les articles (requêtes SQL)
// Toutes les fonctions qui touchent à la table "articles" sont ici
// J'utilise des requêtes paramétrées (?) pour éviter les injections SQL

const db = require("../../db");

// Récupérer tous les articles
const getAllArticles = async () => {
  const [rows] = await db.query("SELECT * FROM articles");
  return rows;
};

// Récupérer un article par son ID
const getArticleById = async (id) => {
  const [rows] = await db.query("SELECT * FROM articles WHERE id_article = ?", [
    id,
  ]);
  return rows;
};

// Récupérer les articles d'une catégorie (the, cafe, accessoire)
const getArticlesByCategory = async (categorie) => {
  const [rows] = await db.query("SELECT * FROM articles WHERE categorie = ?", [
    categorie,
  ]);
  return rows;
};

// Recherche d'articles avec filtres, tri et pagination
// C'est la fonction la plus complète, elle gère tous les cas de recherche
const searchArticles = async ({ search, categorie, type_vente, prixMin, prixMax, tri, ordre, page, limite }) => {
  // Je construis la requête SQL dynamiquement selon les filtres fournis
  // WHERE 1=1 me permet d'ajouter des AND sans me soucier du premier
  let sql = "SELECT * FROM articles WHERE 1=1";
  const params = [];

  // Recherche textuelle dans le nom, la description ou l'origine
  if (search) {
    sql += " AND (nom_produit LIKE ? OR description LIKE ? OR origine LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  // Filtre par catégorie
  if (categorie) {
    sql += " AND categorie = ?";
    params.push(categorie);
  }

  // Filtre par type de vente (unité ou poids)
  // Si pas de type_vente spécifié, on exclut les produits au poids (page vrac séparée)
  if (type_vente) {
    sql += " AND type_vente = ?";
    params.push(type_vente);
  } else {
    sql += " AND (type_vente != 'poids' OR type_vente IS NULL)";
  }

  // Filtre par fourchette de prix
  if (prixMin) {
    sql += " AND prix_ttc >= ?";
    params.push(parseFloat(prixMin));
  }

  if (prixMax) {
    sql += " AND prix_ttc <= ?";
    params.push(parseFloat(prixMax));
  }

  // Je compte le total d'articles avant la pagination pour calculer le nombre de pages
  const countSql = sql.replace("SELECT *", "SELECT COUNT(*) as total");
  const [countRows] = await db.query(countSql, params);
  const total = countRows[0].total;

  // Tri : je vérifie que la colonne demandée est dans la liste autorisée (sécurité)
  const colonnesTri = ["prix_ttc", "nom_produit", "stock"];
  if (tri && colonnesTri.includes(tri)) {
    const direction = ordre === "desc" ? "DESC" : "ASC";
    sql += ` ORDER BY ${tri} ${direction}`;
  } else {
    sql += " ORDER BY ID_Article DESC";
  }

  // Pagination avec LIMIT et OFFSET
  const p = parseInt(page) || 1;
  const l = parseInt(limite) || 12;
  const offset = (p - 1) * l;
  sql += " LIMIT ? OFFSET ?";
  params.push(l, offset);

  const [rows] = await db.query(sql, params);
  return { articles: rows, total, page: p, limite: l, totalPages: Math.ceil(total / l) };
};

// Créer un nouvel article (utilisé depuis le dashboard)
const createArticle = async (articleData) => {
  const { nom_produit, description, categorie, type_vente, prix_ht, taux_tva, prix_ttc, stock, images, origine } = articleData;
  const [result] = await db.query(
    `INSERT INTO articles (nom_produit, description, categorie, type_vente, prix_ht, taux_tva, prix_ttc, stock, images, origine)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nom_produit, description, categorie, type_vente, prix_ht, taux_tva, prix_ttc, stock, images || null, origine || null]
  );
  return result;
};

// Mettre à jour un article existant
const updateArticle = async (id, articleData) => {
  const { nom_produit, description, categorie, type_vente, prix_ht, taux_tva, prix_ttc, stock, images, origine } = articleData;
  const [result] = await db.query(
    `UPDATE articles SET nom_produit = ?, description = ?, categorie = ?, type_vente = ?,
     prix_ht = ?, taux_tva = ?, prix_ttc = ?, stock = ?, images = ?, origine = ?
     WHERE ID_Article = ?`,
    [nom_produit, description, categorie, type_vente, prix_ht, taux_tva, prix_ttc, stock, images || null, origine || null, id]
  );
  return result;
};

// Supprimer un article
const deleteArticle = async (id) => {
  const [result] = await db.query("DELETE FROM articles WHERE ID_Article = ?", [id]);
  return result;
};

// Décrémenter le stock d'un article (appelé lors d'une commande)
// La condition stock >= ? empêche d'avoir un stock négatif
const updateStock = async (id, quantite) => {
  const [result] = await db.query(
    "UPDATE articles SET stock = stock - ? WHERE ID_Article = ? AND stock >= ?",
    [quantite, id, quantite]
  );
  return result;
};

module.exports = {
  getAllArticles,
  getArticleById,
  getArticlesByCategory,
  searchArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  updateStock,
};
