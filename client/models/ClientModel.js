// ClientModel.js — Modèle pour les clients (requêtes SQL)
// Gère tout ce qui touche à la table "clients" : recherche, création, mise à jour
// J'utilise bcryptjs pour le hachage et la vérification des mots de passe

const db = require("../../db");
const bcrypt = require("bcryptjs");

// Rechercher un client par son email (utilisé à la connexion et à l'inscription)
const findClientByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT * FROM clients WHERE email_client = ?",
    [email],
  );
  return rows;
};

// Créer un nouveau client dans la base de données
const createClient = async (clientData) => {
  const {
    nom,
    prenom,
    email,
    mot_de_passe,
    adresse_facturation,
    ville_facturation,
    cp_facturation,
    adresse_livraison,
    cp_livraison,
    ville_livraison,
    telephone,
  } = clientData;

  const [result] = await db.query(
    `INSERT INTO clients
    (nom_client, prenom_client,email_client, mdp_client,adresse_facturation, cp_facturation,
   ville_facturation, adresse_livraison, cp_livraison, ville_livraison
    ,telephone_client )
    VALUE (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nom,
      prenom,
      email,
      mot_de_passe,
      adresse_facturation || null,
      ville_facturation || null,
      cp_facturation || null,
      adresse_livraison || null,
      cp_livraison || null,
      ville_livraison || null,
      telephone || null,
    ],
  );
  return result;
};

// Hacher un mot de passe avec bcrypt
// Le nombre de rounds détermine la complexité du hachage (10 par défaut)
const hashPassword = async (password) => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  return await bcrypt.hash(password, rounds);
};

// Comparer un mot de passe en clair avec un hash (pour la connexion)
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Récupérer un client par son ID (sans le mot de passe pour la sécurité)
const findClientById = async (id) => {
  const [rows] = await db.query(
    "SELECT ID_Client, nom_client, prenom_client, email_client, adresse_facturation, cp_facturation, ville_facturation, adresse_livraison, cp_livraison, ville_livraison, telephone_client FROM clients WHERE ID_Client = ?",
    [id]
  );
  return rows;
};

// Mettre à jour les informations du profil client
const updateClient = async (id, data) => {
  const {
    nom, prenom, telephone,
    adresse_facturation, cp_facturation, ville_facturation,
    adresse_livraison, cp_livraison, ville_livraison,
  } = data;

  const [result] = await db.query(
    `UPDATE clients SET nom_client = ?, prenom_client = ?, telephone_client = ?,
     adresse_facturation = ?, cp_facturation = ?, ville_facturation = ?,
     adresse_livraison = ?, cp_livraison = ?, ville_livraison = ?
     WHERE ID_Client = ?`,
    [nom, prenom, telephone || null,
     adresse_facturation || null, cp_facturation || null, ville_facturation || null,
     adresse_livraison || null, cp_livraison || null, ville_livraison || null, id]
  );
  return result;
};

// Mettre à jour le mot de passe (changement depuis l'espace client)
const updateClientPassword = async (id, hashedPassword) => {
  const [result] = await db.query(
    "UPDATE clients SET mdp_client = ? WHERE ID_Client = ?",
    [hashedPassword, id]
  );
  return result;
};

// Récupérer la liste de tous les clients (pour le dashboard)
const getAllClients = async () => {
  const [rows] = await db.query(
    "SELECT ID_Client, nom_client, prenom_client, email_client, telephone_client, ville_facturation FROM clients"
  );
  return rows;
};

// Rechercher des clients par nom, prénom ou email (dashboard)
const searchClients = async (search) => {
  const like = `%${search}%`;
  const [rows] = await db.query(
    `SELECT ID_Client, nom_client, prenom_client, email_client, telephone_client
     FROM clients
     WHERE nom_client LIKE ? OR prenom_client LIKE ? OR email_client LIKE ?`,
    [like, like, like]
  );
  return rows;
};

// Anonymiser un client (droit à l'oubli RGPD)
// On remplace toutes les données personnelles par des valeurs anonymes
// mais on garde la ligne en BDD pour que les commandes restent cohérentes
const anonymizeClient = async (id) => {
  const [result] = await db.query(
    `UPDATE clients SET
     nom_client = 'Compte',
     prenom_client = 'Supprimé',
     email_client = CONCAT('deleted_', ?, '@anonymized.cafthe'),
     mdp_client = NULL,
     telephone_client = NULL,
     adresse_facturation = NULL,
     cp_facturation = NULL,
     ville_facturation = NULL,
     adresse_livraison = NULL,
     cp_livraison = NULL,
     ville_livraison = NULL
     WHERE ID_Client = ?`,
    [id, id]
  );
  return result;
};

module.exports = {
  findClientByEmail,
  findClientById,
  createClient,
  updateClient,
  updateClientPassword,
  getAllClients,
  searchClients,
  hashPassword,
  comparePassword,
  anonymizeClient,
};
