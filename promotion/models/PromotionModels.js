// PromotionModels.js — Modèle pour les promotions (requêtes SQL)
// Les promotions sont liées aux articles via une table de liaison "promotion_articles"
// Une promo est active si : active = TRUE et la date du jour est entre start_date et end_date

const db = require("../../db");

// Récupérer les promotions qui sont actuellement actives
const getActivePromotions = async () => {
  const [rows] = await db.query(
    `SELECT * FROM promotions
     WHERE active = TRUE
     AND start_date <= CURDATE()
     AND end_date >= CURDATE()
     ORDER BY created_at DESC`
  );
  return rows;
};

// Récupérer les articles en promotion avec le pourcentage de réduction
// Je fais un JOIN entre la table de liaison et la table promotions
// pour ne garder que les articles dont la promo est active et en cours
const getPromotionArticles = async () => {
  const [rows] = await db.query(
    `SELECT pa.id_article, p.id AS id_promotion, p.discount_percent, p.titre
     FROM promotion_articles pa
     JOIN promotions p ON pa.id_promotion = p.id
     WHERE p.active = TRUE
     AND p.start_date <= CURDATE()
     AND p.end_date >= CURDATE()
     AND p.discount_percent > 0`
  );
  return rows;
};

module.exports = { getActivePromotions, getPromotionArticles };
