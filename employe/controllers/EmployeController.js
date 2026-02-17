// EmployeController.js — Contrôleur des employés
// Gère la connexion des employés, la gestion de leurs profils et le CRUD (admin)
// La session employé expire au bout de 30 minutes (exigence du cahier des charges)

const {
  findEmployeByEmail,
  findEmployeById,
  getAllEmployes,
  createEmploye,
  updateEmploye,
  deleteEmploye,
  updatePassword,
  hashPassword,
  comparePassword,
} = require("../models/EmployeModel");
const jwt = require("jsonwebtoken");

// Connexion employé (accès au dashboard)
const login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    const employes = await findEmployeByEmail(email);

    if (employes.length === 0) {
      return res.status(401).json({
        message: "Identifiants incorrects",
      });
    }

    const employe = employes[0];

    // Vérification du mot de passe
    const isMatch = await comparePassword(mot_de_passe, employe.mdp_employe);

    if (!isMatch) {
      return res.status(401).json({
        message: "Identifiants incorrects",
      });
    }

    // Génération du token JWT avec timeout de 30 minutes
    // Le rôle est inclus dans le token pour le middleware de vérification des rôles
    const token = jwt.sign(
      {
        id: employe.ID_Employe,
        email: employe.email_employe,
        role: employe.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );

    res.json({
      message: "Connexion réussie",
      token,
      employe: {
        id: employe.ID_Employe,
        nom: employe.nom_employe,
        prenom: employe.prenom_employe,
        email: employe.email_employe,
        role: employe.role,
      },
    });
  } catch (error) {
    console.error("Erreur connexion employé", error.message);
    res.status(500).json({
      message: "Erreur lors de la connexion",
    });
  }
};

// Récupérer le profil de l'employé connecté
const getProfile = async (req, res) => {
  try {
    const employes = await findEmployeById(req.employe.id);

    if (employes.length === 0) {
      return res.status(404).json({ message: "Employé non trouvé" });
    }

    res.json({
      message: "Profil récupéré",
      employe: employes[0],
    });
  } catch (error) {
    console.error("Erreur profil employé", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération du profil" });
  }
};

// Changer le mot de passe de l'employé connecté
const changePassword = async (req, res) => {
  try {
    const { ancien_mdp, nouveau_mdp } = req.body;

    if (!ancien_mdp || !nouveau_mdp) {
      return res.status(400).json({ message: "Ancien et nouveau mot de passe requis" });
    }

    // Vérification de l'ancien mot de passe
    const employes = await findEmployeByEmail(req.employe.email);
    const employe = employes[0];

    const isMatch = await comparePassword(ancien_mdp, employe.mdp_employe);
    if (!isMatch) {
      return res.status(401).json({ message: "Ancien mot de passe incorrect" });
    }

    const hash = await hashPassword(nouveau_mdp);
    await updatePassword(req.employe.id, hash);

    res.json({ message: "Mot de passe modifié avec succès" });
  } catch (error) {
    console.error("Erreur changement mdp employé", error.message);
    res.status(500).json({ message: "Erreur lors du changement de mot de passe" });
  }
};

// Lister tous les employés (réservé admin)
const getAll = async (req, res) => {
  try {
    const employes = await getAllEmployes();
    res.json({
      message: "Employés récupérés avec succès",
      count: employes.length,
      employes,
    });
  } catch (error) {
    console.error("Erreur récupération employés", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération des employés" });
  }
};

// Créer un employé (réservé admin)
const create = async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, telephone, role } = req.body;

    if (!nom || !prenom || !email || !mot_de_passe) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    // Vérifier que l'email n'est pas déjà pris
    const existing = await findEmployeByEmail(email);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }

    const hash = await hashPassword(mot_de_passe);

    const result = await createEmploye({
      nom, prenom, email,
      mot_de_passe: hash,
      telephone,
      role: role || "vendeur",
    });

    res.status(201).json({
      message: "Employé créé avec succès",
      employeId: result.insertId,
    });
  } catch (error) {
    console.error("Erreur création employé", error.message);
    res.status(500).json({ message: "Erreur lors de la création de l'employé" });
  }
};

// Mettre à jour un employé (réservé admin)
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, telephone, role } = req.body;

    const existing = await findEmployeById(id);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Employé non trouvé" });
    }

    // On garde les valeurs existantes pour les champs non envoyés
    await updateEmploye(id, {
      nom: nom || existing[0].nom_employe,
      prenom: prenom || existing[0].prenom_employe,
      email: email || existing[0].email_employe,
      telephone: telephone !== undefined ? telephone : existing[0].telephone_employe,
      role: role || existing[0].role,
    });

    res.json({ message: "Employé mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur mise à jour employé", error.message);
    res.status(500).json({ message: "Erreur lors de la mise à jour" });
  }
};

// Supprimer un employé (réservé admin)
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Sécurité : on empêche un admin de supprimer son propre compte
    if (parseInt(id) === req.employe.id) {
      return res.status(400).json({ message: "Impossible de supprimer votre propre compte" });
    }

    const result = await deleteEmploye(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employé non trouvé" });
    }

    res.json({ message: "Employé supprimé avec succès" });
  } catch (error) {
    console.error("Erreur suppression employé", error.message);
    res.status(500).json({ message: "Erreur lors de la suppression" });
  }
};

module.exports = { login, getProfile, changePassword, getAll, create, update, remove };
