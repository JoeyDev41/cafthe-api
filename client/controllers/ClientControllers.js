// ClientControllers.js — Contrôleur des clients
// Gère toutes les actions liées aux clients : inscription, connexion, profil, mot de passe
// L'authentification se fait par JWT stocké dans un cookie HttpOnly (plus sécurisé que localStorage)

const {
  createClient,
  findClientByEmail,
  findClientById,
  updateClient,
  updateClientPassword,
  getAllClients,
  searchClients,
  hashPassword,
  comparePassword,
  anonymizeClient,
} = require("../models/ClientModel");
const jwt = require("jsonwebtoken");

// Inscription d'un nouveau client
const register = async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe } = req.body;

    // Vérifier que l'email n'est pas déjà utilisé
    const existingClient = await findClientByEmail(email);

    if (existingClient.length > 0) {
      return res.status(400).send({
        message: "Cet email est déjà utilisé",
      });
    }

    // Hachage du mot de passe avec bcrypt avant de le stocker en BDD
    const hash = await hashPassword(mot_de_passe);

    // Création du client en base
    const result = await createClient({
      nom,
      prenom,
      email,
      mot_de_passe: hash,
    });

    res.status(201).json({
      message: "Inscription réussie",
      client_id: result.insertId,
    });
  } catch (error) {
    console.error("Erreur inscription", error.message);
    res.status(500).json({
      message: "Erreur lors de l'inscription",
    });
  }
};

// Connexion d'un client existant
const login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    // Recherche du client par email
    const clients = await findClientByEmail(email);

    if (clients.length === 0) {
      return res.status(401).json({
        message: "Identifiants incorrects",
      });
    }

    const client = clients[0];

    // Cas spécial : client créé en magasin sans mot de passe
    // À sa première connexion en ligne, il définit son mot de passe
    if (!client.mdp_client && mot_de_passe) {
      const hash = await hashPassword(mot_de_passe);
      await updateClientPassword(client.ID_Client, hash);
    } else {
      // Vérification du mot de passe avec bcrypt
      const isMatch = await comparePassword(mot_de_passe, client.mdp_client);

      if (!isMatch) {
        return res.status(401).json({
          message: "Identifiants incorrects",
        });
      }
    }

    // Génération du token JWT avec l'id et l'email du client
    const expire = parseInt(process.env.JWT_EXPRESS_IN, 10) || 3600;
    const token = jwt.sign(
      {
        id: client.ID_Client,
        email: client.email_client,
      },
      process.env.JWT_SECRET,
      { expiresIn: expire},
    );

    // On place le token dans un cookie HttpOnly
    // httpOnly: true empêche JavaScript côté client d'accéder au cookie (protection XSS)
    // sameSite: "lax" protège contre les attaques CSRF
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Mettre en true au déploiement (HTTPS uniquement)
      sameSite: "lax",
      maxAge: expire * 1000,
    });

    res.json({
      message: "Connexion réussie",
      token,
      client: {
        id: client.ID_Client,
        nom: client.nom_client,
        prenom: client.prenom_client,
        email: client.email_client,
      },
    });
  } catch (error) {
    console.error("Erreur de connexion utilisateur", error.message);
    res.status(500).json({
      message: "Erreur lors de la connexion",
    });
  }
};

// Récupérer le profil complet du client connecté (avec adresses)
const getProfile = async (req, res) => {
  try {
    // req.client.id vient du token JWT décodé par le middleware
    const clients = await findClientById(req.client.id);

    if (clients.length === 0) {
      return res.status(404).json({ message: "Client non trouvé" });
    }

    res.json({
      message: "Profil récupéré",
      client: clients[0],
    });
  } catch (error) {
    console.error("Erreur profil client", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération du profil" });
  }
};

// Mettre à jour le profil du client connecté
const updateProfile = async (req, res) => {
  try {
    const clientId = req.client.id;
    const clients = await findClientById(clientId);

    if (clients.length === 0) {
      return res.status(404).json({ message: "Client non trouvé" });
    }

    // On garde les valeurs existantes pour les champs non envoyés
    const existing = clients[0];

    await updateClient(clientId, {
      nom: req.body.nom || existing.nom_client,
      prenom: req.body.prenom || existing.prenom_client,
      telephone: req.body.telephone !== undefined ? req.body.telephone : existing.telephone_client,
      adresse_facturation: req.body.adresse_facturation !== undefined ? req.body.adresse_facturation : existing.adresse_facturation,
      cp_facturation: req.body.cp_facturation !== undefined ? req.body.cp_facturation : existing.cp_facturation,
      ville_facturation: req.body.ville_facturation !== undefined ? req.body.ville_facturation : existing.ville_facturation,
      adresse_livraison: req.body.adresse_livraison !== undefined ? req.body.adresse_livraison : existing.adresse_livraison,
      cp_livraison: req.body.cp_livraison !== undefined ? req.body.cp_livraison : existing.cp_livraison,
      ville_livraison: req.body.ville_livraison !== undefined ? req.body.ville_livraison : existing.ville_livraison,
    });

    res.json({ message: "Profil mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur mise à jour profil", error.message);
    res.status(500).json({ message: "Erreur lors de la mise à jour du profil" });
  }
};

// Changer le mot de passe du client connecté
const changePassword = async (req, res) => {
  try {
    const { ancien_mdp, nouveau_mdp } = req.body;

    if (!ancien_mdp || !nouveau_mdp) {
      return res.status(400).json({ message: "Ancien et nouveau mot de passe requis" });
    }

    // On vérifie d'abord que l'ancien mot de passe est correct
    const clients = await findClientByEmail(req.client.email);
    const client = clients[0];

    const isMatch = await comparePassword(ancien_mdp, client.mdp_client);
    if (!isMatch) {
      return res.status(401).json({ message: "Ancien mot de passe incorrect" });
    }

    // Hachage et mise à jour du nouveau mot de passe
    const hash = await hashPassword(nouveau_mdp);
    await updateClientPassword(req.client.id, hash);

    res.json({ message: "Mot de passe modifié avec succès" });
  } catch (error) {
    console.error("Erreur changement mdp", error.message);
    res.status(500).json({ message: "Erreur lors du changement de mot de passe" });
  }
};

// Récupérer tous les clients (pour le dashboard, avec recherche optionnelle)
const getAll = async (req, res) => {
  try {
    const { search } = req.query;

    let clients;
    if (search) {
      clients = await searchClients(search);
    } else {
      clients = await getAllClients();
    }

    res.json({
      message: "Clients récupérés avec succès",
      count: clients.length,
      clients,
    });
  } catch (error) {
    console.error("Erreur récupération clients", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération des clients" });
  }
};

// Récupérer un client par ID (dashboard)
const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const clients = await findClientById(id);

    if (clients.length === 0) {
      return res.status(404).json({ message: "Client non trouvé" });
    }

    res.json({
      message: "Client récupéré",
      client: clients[0],
    });
  } catch (error) {
    console.error("Erreur récupération client", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération du client" });
  }
};

// Déconnexion : on supprime le cookie qui contient le token
const logout = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    });
    res.json({ message: "Déconnexion réussie" });
};

// Suppression de compte (anonymisation RGPD)
// On anonymise les données personnelles mais on garde les commandes
const deleteAccount = async (req, res) => {
    try {
        await anonymizeClient(req.client.id);

        res.clearCookie("token", {
            httpOnly: true,
            secure: false,
            sameSite: "lax"
        });

        res.json({ message: "Compte supprimé avec succès" });
    } catch (error) {
        console.error("Erreur suppression compte:", error.message);
        res.status(500).json({ message: "Erreur lors de la suppression du compte" });
    }
};

// Route /me : vérifier si le client est toujours connecté
// Le navigateur envoie automatiquement le cookie, le middleware vérifie le JWT
// Si le token est valide, on renvoie les infos du client
const getMe = async (req, res) => {
    try {
        const clients = await findClientById(req.client.id);

        if (clients.length === 0) {
            return res.status(404).json({ message: "Client introuvable" });
        }

        const client = clients[0];

        res.json({
            client: {
                id: client.id_client,
                nom: client.nom_client,
                prenom: client.prenom_client,
                email: client.email_client
            }
        });
    } catch (error) {
        console.error("Erreur /me:", error.message);
        res.status(500).json({ message: "Erreur lors de la vérification de session" });
    }
};

module.exports = { register, login, getProfile, updateProfile, changePassword, getAll, getClientById, logout, getMe, deleteAccount };
