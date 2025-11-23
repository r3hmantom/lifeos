const prisma = require('../config/db');

async function updatePreferences(req, res) {
    try {
        const userId = req.user.id;
        const { preferences, name } = req.body;

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                preferences,
                name: name || undefined
            }
        });

        res.json(user);
    } catch (error) {
        console.error("Update Preferences Error:", error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
}

async function getProfile(req, res) {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                preferences: true,
                createdAt: true
            }
        });
        res.json(user);
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
}

module.exports = {
    updatePreferences,
    getProfile
};

