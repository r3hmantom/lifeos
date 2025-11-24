const prisma = require('../config/db');
const bcrypt = require('bcryptjs');

module.exports = async function(req, res, next) {
    try {
        const email = 'test@example.com';
        const password = 'test';
        const name = 'Test User';

        // 1. Check if the test user exists
        let user = await prisma.user.findUnique({
            where: { email }
        });

        // 2. If not, create it
        if (!user) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    password: hashedPassword,
                    preferences: {}
                }
            });
            console.log('Test user created');
        }

        // 3. Force this user to be the logged-in user
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name
        };

        next();
    } catch (err) {
        console.error("Auth Middleware Error:", err);
        // In case of DB error, we can't proceed
        res.status(500).json({ msg: 'Server Error in Auth Middleware' });
    }
};
