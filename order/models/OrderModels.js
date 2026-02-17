// OrderModels.js — Modèle pour les commandes (requêtes SQL)
// Gère la table "commandes" et la table de liaison "contenir" (articles d'une commande)
// Le numéro de commande suit le format du cahier des charges : CMD-YYYYMMDD-XXXX

const db = require("../../db");

// Générer un numéro de commande unique au format CMD-AAAAMMJJ-XXXX
// Exemple : CMD-20250215-0042
const generateOrderNumber = (id) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const num = String(id).padStart(4, "0");
  return `CMD-${y}${m}${d}-${num}`;
};

// Créer une nouvelle commande dans la table "commandes"
// Le statut initial est toujours "en_attente" (comme prévu dans le cahier des charges)
const createOrder = async (orderData) => {
  const {
    id_client,
    mode_commande,
    montant_paiement,
    mode_paiement,
  } = orderData;

  const [result] = await db.query(
    `INSERT INTO commandes (date_commande, mode_commande, statut_commande, montant_paiement, date_paiement, mode_paiement, ID_Client)
     VALUES (CURDATE(), ?, 'en_attente', ?, CURDATE(), ?, ?)`,
    [mode_commande || "en_ligne", montant_paiement, mode_paiement || "cb", id_client]
  );
  return result;
};

// Ajouter les articles à une commande (table de liaison "contenir")
// J'utilise INSERT avec VALUES multiples pour tout insérer en une seule requête
const addOrderItems = async (id_commande, items) => {
  const values = items.map((item) => [item.id_article, id_commande, item.quantite]);
  const [result] = await db.query(
    "INSERT INTO contenir (ID_Article, ID_Commande, Quantite) VALUES ?",
    [values]
  );
  return result;
};

// Récupérer toutes les commandes avec les infos du client (pour le dashboard)
const getAllOrders = async () => {
  const [rows] = await db.query(
    `SELECT c.*, cl.nom_client, cl.prenom_client, cl.email_client
     FROM commandes c
     LEFT JOIN clients cl ON c.ID_Client = cl.ID_Client
     ORDER BY c.date_commande DESC`
  );
  return rows;
};

// Récupérer les commandes avec des filtres optionnels (dashboard)
// On peut filtrer par statut, mode de commande, et/ou période de dates
const getFilteredOrders = async ({ statut, mode, dateDebut, dateFin }) => {
  let sql = `SELECT c.*, cl.nom_client, cl.prenom_client, cl.email_client
             FROM commandes c
             LEFT JOIN clients cl ON c.ID_Client = cl.ID_Client
             WHERE 1=1`;
  const params = [];

  if (statut) {
    sql += " AND c.statut_commande = ?";
    params.push(statut);
  }
  if (mode) {
    sql += " AND c.mode_commande = ?";
    params.push(mode);
  }
  if (dateDebut) {
    sql += " AND c.date_commande >= ?";
    params.push(dateDebut);
  }
  if (dateFin) {
    sql += " AND c.date_commande <= ?";
    params.push(dateFin);
  }

  sql += " ORDER BY c.date_commande DESC";

  const [rows] = await db.query(sql, params);
  return rows;
};

// Récupérer une commande par ID avec ses articles (JOIN sur la table contenir)
const getOrderById = async (id) => {
  const [order] = await db.query(
    `SELECT c.*, cl.nom_client, cl.prenom_client, cl.email_client,
            cl.adresse_livraison, cl.cp_livraison, cl.ville_livraison
     FROM commandes c
     LEFT JOIN clients cl ON c.ID_Client = cl.ID_Client
     WHERE c.ID_Commande = ?`,
    [id]
  );

  if (order.length === 0) return null;

  // Récupération des articles de cette commande
  const [items] = await db.query(
    `SELECT co.Quantite, a.ID_Article, a.nom_produit, a.prix_ht, a.taux_tva, a.prix_ttc, a.images
     FROM contenir co
     JOIN articles a ON co.ID_Article = a.ID_Article
     WHERE co.ID_Commande = ?`,
    [id]
  );

  return { ...order[0], items };
};

// Récupérer les commandes d'un client (espace client "Mes commandes")
const getOrdersByClientId = async (clientId) => {
  const [rows] = await db.query(
    `SELECT c.* FROM commandes c
     WHERE c.ID_Client = ?
     ORDER BY c.date_commande DESC`,
    [clientId]
  );

  // Pour chaque commande, je récupère aussi les articles associés
  for (let i = 0; i < rows.length; i++) {
    const [items] = await db.query(
      `SELECT co.Quantite, a.ID_Article, a.nom_produit, a.prix_ttc, a.images
       FROM contenir co
       JOIN articles a ON co.ID_Article = a.ID_Article
       WHERE co.ID_Commande = ?`,
      [rows[i].ID_Commande]
    );
    rows[i].items = items;
    rows[i].numero_commande = generateOrderNumber(rows[i].ID_Commande);
  }

  return rows;
};

// Mettre à jour le statut d'une commande
// Les statuts possibles sont définis dans le cahier des charges :
// en_attente → en_preparation → expediee → livree
const updateOrderStatus = async (id, statut) => {
  const statutsValides = ["en_attente", "en_preparation", "expediee", "livree"];
  if (!statutsValides.includes(statut)) {
    throw new Error("Statut invalide");
  }

  const [result] = await db.query(
    "UPDATE commandes SET statut_commande = ? WHERE ID_Commande = ?",
    [statut, id]
  );
  return result;
};

module.exports = {
  generateOrderNumber,
  createOrder,
  addOrderItems,
  getAllOrders,
  getFilteredOrders,
  getOrderById,
  getOrdersByClientId,
  updateOrderStatus,
};
