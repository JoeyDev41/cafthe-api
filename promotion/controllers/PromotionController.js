// PromotionController.js — Contrôleur des promotions
// Deux routes : les promos actives (pour la page d'accueil) et les articles en promo (pour le contexte)

const { getActivePromotions, getPromotionArticles } = require("../models/PromotionModels");

// Récupérer les promotions actives (utilisé sur la page d'accueil pour afficher la bannière promo)
const getActive = async (req, res) => {
  try {
    const promotions = await getActivePromotions();

    res.json({
      message: "Promotions récupérées avec succès",
      count: promotions.length,
      promotions,
    });
  } catch (error) {
    console.error("Erreur récupération promotions", error.message);
    res.status(500).json({
      message: "Erreur lors de la récupération des promotions",
    });
  }
};

// Récupérer la liste des articles en promo (id_article + pourcentage de réduction)
// Le front utilise cette route pour savoir quels articles ont un prix réduit
const getArticlesEnPromo = async (req, res) => {
  try {
    const articles = await getPromotionArticles();

    res.json({
      message: "Articles en promotion récupérés",
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error("Erreur récupération articles en promo", error.message);
    res.status(500).json({
      message: "Erreur lors de la récupération des articles en promotion",
    });
  }
};

module.exports = { getActive, getArticlesEnPromo };
