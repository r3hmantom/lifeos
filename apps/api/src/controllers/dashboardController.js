const prisma = require('../config/db');

async function getDashboard(req, res) {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 1. Get today's plan (from Schedule)
        const schedule = await prisma.schedule.findFirst({
            where: {
                userId,
                targetDate: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });

        // 2. Get Next Task/Event (based on eventDate >= now)
        const nextTask = await prisma.memory.findFirst({
            where: {
                userId,
                type: { in: ['TASK', 'EVENT'] },
                eventDate: {
                    gte: new Date() // Now
                }
            },
            orderBy: { eventDate: 'asc' }
        });

        // 3. Overview Stats (Counts per module)
        const stats = await prisma.memory.groupBy({
            by: ['module'],
            where: { userId },
            _count: {
                id: true
            }
        });

        const overview = {
            UNI: 0,
            FITNESS: 0,
            WORK: 0,
            LIFE: 0
        };
        stats.forEach(s => {
            if (overview[s.module] !== undefined) {
                overview[s.module] = s._count.id;
            }
        });

        // 4. Recent Activity (across all modules)
        const recentActivity = await prisma.memory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        res.json({
            date: today,
            dailyPlan: schedule ? schedule.dailyPlan : null,
            nextTask,
            overview,
            recentActivity
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
}

async function getModuleStats(req, res) {
    try {
        const userId = req.user.id;
        const { module } = req.params;

        // Get upcoming deadlines/events for this module
        const upcoming = await prisma.memory.findMany({
            where: {
                userId,
                module: module.toUpperCase(),
                type: { in: ['TASK', 'EVENT'] },
                eventDate: { gte: new Date() }
            },
            orderBy: { eventDate: 'asc' },
            take: 5
        });

        // Get recent logs for this module
        const recentLogs = await prisma.memory.findMany({
            where: {
                userId,
                module: module.toUpperCase(),
                type: 'LOG'
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        res.json({
            module,
            upcoming,
            recentLogs
        });
    } catch (error) {
        console.error("Module Stats Error:", error);
        res.status(500).json({ error: 'Failed to fetch module stats' });
    }
}

module.exports = {
    getDashboard,
    getModuleStats
};

