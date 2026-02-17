// OrderController.js — Contrôleur des commandes
// Gère la création de commandes (en ligne et en magasin), la consultation et le changement de statut
// Quand une commande est créée, le stock des articles est automatiquement décrémenté

const {
  generateOrderNumber,
  createOrder,
  addOrderItems,
  getAllOrders,
  getFilteredOrders,
  getOrderById,
  getOrdersByClientId,
  updateOrderStatus,
} = require("../models/OrderModels");
const { updateStock } = require("../../article/models/ArticleModel");

// Créer une commande en ligne (client connecté depuis le site)
const create = async (req, res) => {
  try {
    const { items, mode_paiement } = req.body;
    const id_client = req.client.id;

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "Le panier est vide",
      });
    }

    // Calcul du montant total à partir des articles du panier
    let montant_total = 0;
    for (const item of items) {
      montant_total += item.prix_ttc * item.quantite;
    }

    // Insertion de la commande en base
    const result = await createOrder({
      id_client,
      mode_commande: "en_ligne",
      montant_paiement: parseFloat(montant_total.toFixed(2)),
      mode_paiement: mode_paiement || "cb",
    });

    const orderId = result.insertId;

    // Ajout des articles dans la table de liaison "contenir"
    await addOrderItems(
      orderId,
      items.map((item) => ({
        id_article: item.id_article,
        quantite: item.quantite,
      }))
    );

    // Décrémentation du stock pour chaque article commandé
    for (const item of items) {
      await updateStock(item.id_article, item.quantite);
    }

    // Génération du numéro de commande au format CMD-YYYYMMDD-XXXX
    const numero_commande = generateOrderNumber(orderId);

    res.status(201).json({
      message: "Commande créée avec succès",
      commande: {
        id: orderId,
        numero_commande,
        montant_total: parseFloat(montant_total.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Erreur création commande", error.message);
    res.status(500).json({
      message: "Erreur lors de la création de la commande",
    });
  }
};

// Créer une vente en magasin (depuis le dashboard vendeur)
// Même logique que create mais avec mode_commande = "en_magasin"
// Le client peut être optionnel (vente anonyme)
const createInStore = async (req, res) => {
  try {
    const { id_client, items, mode_paiement } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "Le panier est vide",
      });
    }

    let montant_total = 0;
    for (const item of items) {
      montant_total += item.prix_ttc * item.quantite;
    }

    const result = await createOrder({
      id_client: id_client || null,
      mode_commande: "en_magasin",
      montant_paiement: parseFloat(montant_total.toFixed(2)),
      mode_paiement: mode_paiement || "cb",
    });

    const orderId = result.insertId;

    await addOrderItems(
      orderId,
      items.map((item) => ({
        id_article: item.id_article,
        quantite: item.quantite,
      }))
    );

    for (const item of items) {
      await updateStock(item.id_article, item.quantite);
    }

    res.status(201).json({
      message: "Vente enregistrée avec succès",
      commande: {
        id: orderId,
        numero_commande: generateOrderNumber(orderId),
        montant_total: parseFloat(montant_total.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Erreur vente en magasin", error.message);
    res.status(500).json({
      message: "Erreur lors de l'enregistrement de la vente",
    });
  }
};

// Récupérer toutes les commandes (dashboard, avec filtres optionnels)
const getAll = async (req, res) => {
  try {
    const { statut, mode, dateDebut, dateFin } = req.query;

    let orders;
    if (statut || mode || dateDebut || dateFin) {
      orders = await getFilteredOrders({ statut, mode, dateDebut, dateFin });
    } else {
      orders = await getAllOrders();
    }

    // On ajoute le numéro de commande formaté à chaque commande
    orders = orders.map((order) => ({
      ...order,
      numero_commande: generateOrderNumber(order.ID_Commande),
    }));

    res.json({
      message: "Commandes récupérées avec succès",
      count: orders.length,
      commandes: orders,
    });
  } catch (error) {
    console.error("Erreur récupération commandes", error.message);
    res.status(500).json({
      message: "Erreur lors de la récupération des commandes",
    });
  }
};

// Récupérer une commande par ID avec ses articles (dashboard)
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await getOrderById(id);

    if (!order) {
      return res.status(404).json({
        message: "Commande non trouvée",
      });
    }

    order.numero_commande = generateOrderNumber(order.ID_Commande);

    res.json({
      message: "Commande récupérée avec succès",
      commande: order,
    });
  } catch (error) {
    console.error("Erreur récupération commande", error.message);
    res.status(500).json({
      message: "Erreur lors de la récupération de la commande",
    });
  }
};

// Récupérer les commandes du client connecté (page "Mes commandes")
const getMyOrders = async (req, res) => {
  try {
    const id_client = req.client.id;
    const orders = await getOrdersByClientId(id_client);

    res.json({
      message: "Commandes récupérées avec succès",
      count: orders.length,
      commandes: orders,
    });
  } catch (error) {
    console.error("Erreur récupération mes commandes", error.message);
    res.status(500).json({
      message: "Erreur lors de la récupération des commandes",
    });
  }
};

// Mettre à jour le statut d'une commande (dashboard)
// Statuts possibles : en_attente, en_preparation, expediee, livree
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!statut) {
      return res.status(400).json({
        message: "Statut requis",
      });
    }

    const result = await updateOrderStatus(id, statut);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Commande non trouvée",
      });
    }

    res.json({
      message: `Statut mis à jour : ${statut}`,
    });
  } catch (error) {
    if (error.message === "Statut invalide") {
      return res.status(400).json({
        message: "Statut invalide. Valeurs acceptées : en_attente, en_preparation, expediee, livree",
      });
    }
    console.error("Erreur mise à jour statut", error.message);
    res.status(500).json({
      message: "Erreur lors de la mise à jour du statut",
    });
  }
};

module.exports = { create, createInStore, getAll, getById, getMyOrders, updateStatus };
