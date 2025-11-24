const prisma = require('../config/db');
const jwt = require('jsonwebtoken');

// Helper to get the test user
const getTestUser = async () => {
    return await prisma.user.findUnique({
        where: { email: 'test@example.com' }
    });
};

const register = async (req, res) => {
    // Just return the test user
    const user = await getTestUser();
    // Return a dummy token
    res.json({ 
        token: 'dummy-token', 
        user: { 
            id: user.id, 
            email: user.email, 
            name: user.name 
        } 
    });
};

const login = async (req, res) => {
    // Just return the test user
    const user = await getTestUser();
    res.json({ 
        token: 'dummy-token', 
        user: { 
            id: user.id, 
            email: user.email, 
            name: user.name, 
            preferences: user.preferences 
        } 
    });
};

const getMe = async (req, res) => {
    try {
        // req.user is already set by the middleware to the test user
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, name: true, preferences: true, createdAt: true }
        });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    register,
    login,
    getMe
};
