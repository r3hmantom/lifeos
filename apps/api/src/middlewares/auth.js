const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

module.exports = async function(req, res, next) {
    // BYPASS AUTH for development/testing (Disabled by default now)
    if (process.env.BYPASS_AUTH === 'true') {
        try {
            // Use the first user found as the logged-in user
            let user = await prisma.user.findFirst();
            if (!user) {
                // Create a dummy user if none exists
                user = await prisma.user.create({
                    data: {
                        email: 'test@example.com',
                        name: 'Test User',
                        password: 'hashedpassword_placeholder'
                    }
                });
            }
            req.user = user;
            return next();
        } catch (error) {
            console.error("Auth Bypass Error:", error);
            return res.status(500).json({ msg: 'Auth bypass failed' });
        }
    }

    // Get token from header
    const token = req.header('x-auth-token') || (req.header('Authorization') ? req.header('Authorization').replace('Bearer ', '') : null);

    // Check if not token
    if (!token) {
        // Optional: Fallback for development if needed, but safer to deny
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
