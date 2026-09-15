const jwt = require("jsonwebtoken");
const config = require("../config");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Debug logging
  console.log(`[Auth] ${req.method} ${req.path} - Auth header:`, authHeader ? 'Present' : 'Missing');

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    return res.status(401).json({ error: "Token error" });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: "Token malformatted" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "default_secret",
    (err, decoded) => {
      if (err) {
        console.log(`[Auth] Token verification failed:`, err.message);
        return res.status(401).json({ error: "Token invalid", details: err.message });
      }

      console.log(`[Auth] Token verified for user:`, decoded.id);
      req.userId = decoded.id;
      return next();
    }
  );
};

module.exports = authMiddleware;
