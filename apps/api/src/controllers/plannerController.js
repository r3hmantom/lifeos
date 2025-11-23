const plannerService = require('../services/planner');

async function generatePlan(req, res) {
    try {
        const { date, user_intent } = req.body;
        const userId = req.user.id;

        const plan = await plannerService.generateDailyPlan(userId, date, user_intent);
        res.json(plan);
    } catch (error) {
        console.error("Planner Error:", error);
        res.status(500).json({ 
            error: 'Failed to generate plan',
            details: error.message 
        });
    }
}

module.exports = {
    generatePlan
};

