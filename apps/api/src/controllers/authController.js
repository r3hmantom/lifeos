const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        let user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                preferences: {} // Initialize empty preferences
            }
        });

        // Create JWT
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret', // Use env var in production
            { expiresIn: '30d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Validate password
        // Handle users created without password (e.g. demo users)
        if (!user.password) {
             return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Create JWT
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '30d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, email: user.email, name: user.name, preferences: user.preferences } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getMe = async (req, res) => {
    try {
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

