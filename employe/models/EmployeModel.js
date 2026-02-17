// EmployeModel.js — Modèle pour les employés (requêtes SQL)
// Gère la table "employes" : recherche, création, modification, suppression
// Les employés ont un rôle : "admin" (tout) ou "vendeur" (dashboard sans gestion comptes)

const db = require("../../db");
const bcrypt = require("bcryptjs");

// Rechercher un employé par son email (pour la connexion)
const findEmployeByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT * FROM employes WHERE email_employe = ?",
    [email]
  );
  return rows;
};

// Rechercher un employé par son ID (sans le mot de passe)
const findEmployeById = async (id) => {
  const [rows] = await db.query(
    "SELECT ID_Employe, nom_employe, prenom_employe, email_employe, telephone_employe, role FROM employes WHERE ID_Employe = ?",
    [id]
  );
  return rows;
};

// Récupérer tous les employés (page admin de gestion des employés)
const getAllEmployes = async () => {
  const [rows] = await db.query(
    "SELECT ID_Employe, nom_employe, prenom_employe, email_employe, telephone_employe, role FROM employes"
  );
  return rows;
};

// Créer un nouvel employé (admin uniquement)
const createEmploye = async (employeData) => {
  const { nom, prenom, email, mot_de_passe, telephone, role } = employeData;
  const [result] = await db.query(
    `INSERT INTO employes (nom_employe, prenom_employe, email_employe, mdp_employe, telephone_employe, role)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nom, prenom, email, mot_de_passe, telephone || null, role || "vendeur"]
  );
  return result;
};

// Mettre à jour un employé (admin uniquement)
const updateEmploye = async (id, employeData) => {
  const { nom, prenom, email, telephone, role } = employeData;
  const [result] = await db.query(
    `UPDATE employes SET nom_employe = ?, prenom_employe = ?, email_employe = ?, telephone_employe = ?, role = ?
     WHERE ID_Employe = ?`,
    [nom, prenom, email, telephone || null, role, id]
  );
  return result;
};

// Supprimer un employé (admin uniquement)
const deleteEmploye = async (id) => {
  const [result] = await db.query("DELETE FROM employes WHERE ID_Employe = ?", [id]);
  return result;
};

// Mettre à jour le mot de passe d'un employé
const updatePassword = async (id, hashedPassword) => {
  const [result] = await db.query(
    "UPDATE employes SET mdp_employe = ? WHERE ID_Employe = ?",
    [hashedPassword, id]
  );
  return result;
};

// Hacher un mot de passe avec bcrypt
const hashPassword = async (password) => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  return await bcrypt.hash(password, rounds);
};

// Comparer un mot de passe en clair avec son hash
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = {
  findEmployeByEmail,
  findEmployeById,
  getAllEmployes,
  createEmploye,
  updateEmploye,
  deleteEmploye,
  updatePassword,
  hashPassword,
  comparePassword,
};
