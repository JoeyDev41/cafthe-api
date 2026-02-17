// authMiddleware.js — Middleware d'authentification JWT
// Ce middleware protège les routes qui nécessitent d'être connecté
// Il vérifie le token JWT (dans le cookie ou dans le header Authorization)
// Si le token est valide, il ajoute les infos de l'utilisateur dans req.client ou req.employe

const jwt = require("jsonwebtoken");

// Vérification du token client (routes e-commerce)
// Le token est d'abord cherché dans le cookie HttpOnly, sinon dans le header Authorization
const verifyToken = (req, res, next) => {
    // On cherche d'abord le token dans les cookies
    let token = req.cookies && req.cookies.token;

    // Si pas de cookie, on regarde dans le header Authorization (format: "Bearer <token>")
    if (!token) {
        const authHeader = req.headers["authorization"];

        if (!authHeader) {
            return res.status(403).json({ message: "Token manquant" });
        }

        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(403).json({ message: "Format de token invalide" });
        }

        token = parts[1];
    }

    // On vérifie que le token est valide avec la clé secrète
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({
                    message: "Token expiré",
                });
            }

            return res.status(401).json({
                message: "Token invalide",
            });
        }

        // Token valide : on met les infos décodées dans req.client
        // pour pouvoir les utiliser dans les contrôleurs
        req.client = decoded;
        next();
    });
};

// Vérification du token employé (routes dashboard)
// Même principe mais on vérifie en plus que le token contient un rôle
const verifyEmployeToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(403).json({
            message: "Token manquant",
        });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(403).json({
            message: "Format de token invalide",
        });
    }

    const token = parts[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({
                    message: "Session expirée, veuillez vous reconnecter",
                });
            }

            return res.status(401).json({
                message: "Token invalide",
            });
        }

        // On vérifie que c'est bien un token employé (qui contient un rôle)
        // Un token client n'a pas de propriété "role"
        if (!decoded.role) {
            return res.status(403).json({
                message: "Accès refusé : token client non autorisé",
            });
        }

        req.employe = decoded;
        next();
    });
};

module.exports = { verifyToken, verifyEmployeToken };
