// StatsController.js — Contrôleur des statistiques pour le dashboard
// Fournit les données pour le tableau de bord : CA, top produits, ventes par catégorie, stats clients
// Toutes ces routes sont protégées (réservées aux vendeurs et admins)

const db = require("../../db");

// Chiffre d'affaires par période (jour, semaine, mois, année)
const getRevenue = async (req, res) => {
  try {
    const { periode } = req.query;

    // Je construis le filtre SQL selon la période demandée
    let dateFilter;
    switch (periode) {
      case "jour":
        dateFilter = "DATE(date_commande) = CURDATE()";
        break;
      case "semaine":
        dateFilter = "YEARWEEK(date_commande) = YEARWEEK(CURDATE())";
        break;
      case "mois":
        dateFilter = "MONTH(date_commande) = MONTH(CURDATE()) AND YEAR(date_commande) = YEAR(CURDATE())";
        break;
      case "annee":
        dateFilter = "YEAR(date_commande) = YEAR(CURDATE())";
        break;
      default:
        dateFilter = "1=1"; // Pas de filtre = tout
    }

    // COALESCE renvoie 0 au lieu de NULL si aucune commande trouvée
    const [rows] = await db.query(
      `SELECT
        COUNT(*) as nombre_ventes,
        COALESCE(SUM(montant_paiement), 0) as chiffre_affaires,
        COALESCE(AVG(montant_paiement), 0) as panier_moyen
       FROM commandes
       WHERE ${dateFilter}`
    );

    res.json({
      message: "Statistiques de revenus",
      periode: periode || "total",
      stats: rows[0],
    });
  } catch (error) {
    console.error("Erreur stats revenus", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
  }
};

// Top 10 des produits les plus vendus
const getTopProducts = async (req, res) => {
  try {
    // SUM(Quantite) pour compter le total des ventes, GROUP BY pour regrouper par article
    const [rows] = await db.query(
      `SELECT a.ID_Article, a.nom_produit, a.categorie, a.prix_ttc, a.images,
              SUM(co.Quantite) as total_vendu
       FROM contenir co
       JOIN articles a ON co.ID_Article = a.ID_Article
       GROUP BY a.ID_Article
       ORDER BY total_vendu DESC
       LIMIT 10`
    );

    res.json({
      message: "Top 10 produits",
      produits: rows,
    });
  } catch (error) {
    console.error("Erreur top produits", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération du top produits" });
  }
};

// Répartition des ventes par catégorie (thé, café, accessoire)
const getSalesByCategory = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.categorie,
              COUNT(DISTINCT co.ID_Commande) as nombre_commandes,
              SUM(co.Quantite) as quantite_totale,
              SUM(co.Quantite * a.prix_ttc) as ca_categorie
       FROM contenir co
       JOIN articles a ON co.ID_Article = a.ID_Article
       GROUP BY a.categorie`
    );

    res.json({
      message: "Ventes par catégorie",
      categories: rows,
    });
  } catch (error) {
    console.error("Erreur ventes par catégorie", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération des ventes par catégorie" });
  }
};

// Statistiques sur les clients (total + clients actifs par mois sur 12 mois)
const getClientStats = async (req, res) => {
  try {
    const [total] = await db.query("SELECT COUNT(*) as total FROM clients");

    // Nombre de clients ayant commandé chaque mois (sur les 12 derniers mois)
    const [parMois] = await db.query(
      `SELECT DATE_FORMAT(c.date_commande, '%Y-%m') as mois,
              COUNT(DISTINCT c.ID_Client) as clients_actifs
       FROM commandes c
       WHERE c.date_commande >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY mois
       ORDER BY mois`
    );

    res.json({
      message: "Statistiques clients",
      total_clients: total[0].total,
      clients_par_mois: parMois,
    });
  } catch (error) {
    console.error("Erreur stats clients", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération des stats clients" });
  }
};

// Dashboard résumé : toutes les infos importantes en une seule requête
// C'est la première chose que voit le vendeur/admin quand il ouvre le dashboard
const getDashboard = async (req, res) => {
  try {
    // CA du jour
    const [caJour] = await db.query(
      `SELECT COALESCE(SUM(montant_paiement), 0) as ca
       FROM commandes WHERE DATE(date_commande) = CURDATE()`
    );

    // CA du mois
    const [caMois] = await db.query(
      `SELECT COALESCE(SUM(montant_paiement), 0) as ca
       FROM commandes WHERE MONTH(date_commande) = MONTH(CURDATE()) AND YEAR(date_commande) = YEAR(CURDATE())`
    );

    // Nombre de commandes en attente (à traiter)
    const [enAttente] = await db.query(
      "SELECT COUNT(*) as count FROM commandes WHERE statut_commande = 'en_attente'"
    );

    // Nombre total de clients inscrits
    const [totalClients] = await db.query("SELECT COUNT(*) as count FROM clients");

    // Nombre de ventes aujourd'hui
    const [ventesJour] = await db.query(
      "SELECT COUNT(*) as count FROM commandes WHERE DATE(date_commande) = CURDATE()"
    );

    // Articles en rupture de stock (stock = 0)
    const [ruptures] = await db.query(
      "SELECT COUNT(*) as count FROM articles WHERE stock = 0"
    );

    // Articles avec stock faible (moins de 10 unités)
    const [stockFaible] = await db.query(
      "SELECT COUNT(*) as count FROM articles WHERE stock > 0 AND stock < 10"
    );

    res.json({
      message: "Dashboard",
      dashboard: {
        ca_jour: caJour[0].ca,
        ca_mois: caMois[0].ca,
        commandes_en_attente: enAttente[0].count,
        total_clients: totalClients[0].count,
        ventes_jour: ventesJour[0].count,
        articles_rupture: ruptures[0].count,
        articles_stock_faible: stockFaible[0].count,
      },
    });
  } catch (error) {
    console.error("Erreur dashboard", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération du dashboard" });
  }
};

module.exports = { getRevenue, getTopProducts, getSalesByCategory, getClientStats, getDashboard };
