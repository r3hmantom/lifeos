const prisma = require("../config/db");

// Map goal focus categories to modules
const focusToModule = (focus) => {
  const focusLower = focus?.toLowerCase() || '';
  if (focusLower.includes('uni') || focusLower.includes('university') || focusLower.includes('study') || focusLower.includes('academic')) {
    return 'UNI';
  }
  if (focusLower.includes('work') || focusLower.includes('career') || focusLower.includes('job') || focusLower.includes('professional')) {
    return 'WORK';
  }
  if (focusLower.includes('fitness') || focusLower.includes('health') || focusLower.includes('exercise') || focusLower.includes('workout')) {
    return 'FITNESS';
  }
  if (focusLower.includes('life') || focusLower.includes('personal') || focusLower.includes('hobby') || focusLower.includes('social')) {
    return 'LIFE';
  }
  return 'LIFE'; // default
};

exports.getDashboard = async (req, res) => {
  const userId = req.userId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  try {
    // Get today's schedule items
    const todayItems = await prisma.scheduleItem.findMany({
      where: {
        userId,
        startTime: {
          gte: today,
          lte: endOfToday,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Get next upcoming task (first incomplete task from today onwards)
    const nextTask = await prisma.scheduleItem.findFirst({
      where: {
        userId,
        startTime: {
          gte: new Date(),
        },
        isCompleted: false,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Get active goals to calculate overview stats
    const goals = await prisma.goal.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    // Calculate overview stats by module
    const overview = {
      UNI: 0,
      WORK: 0,
      FITNESS: 0,
      LIFE: 0,
    };

    goals.forEach((goal) => {
      const module = focusToModule(goal.focus);
      overview[module] = (overview[module] || 0) + 1;
    });

    // Format daily plan - transform schedule items to match expected format
    const dailyPlan = {
      schedule: todayItems.map((item) => ({
        time: new Date(item.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        activity: item.title,
        category: item.type,
        module: item.relatedId ? focusToModule(goals.find(g => g.id === item.relatedId)?.focus) : 'LIFE',
        description: item.description,
        startTime: item.startTime.toISOString(),
        endTime: item.endTime.toISOString(),
      })),
    };

    // Format next task
    let formattedNextTask = null;
    if (nextTask) {
      const relatedGoal = nextTask.relatedId ? goals.find(g => g.id === nextTask.relatedId) : null;
      formattedNextTask = {
        text: nextTask.title,
        rawText: nextTask.title,
        module: relatedGoal ? focusToModule(relatedGoal.focus) : 'LIFE',
        eventDate: nextTask.startTime.toISOString(),
        description: nextTask.description,
      };
    }

    // Get recent activity (recent schedule items and memories)
    const recentMemories = await prisma.memory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentActivity = [
      ...todayItems.slice(0, 5).map(item => ({
        type: 'schedule',
        text: item.title,
        date: item.startTime.toISOString(),
      })),
      ...recentMemories.map(memory => ({
        type: 'memory',
        text: memory.title,
        date: memory.createdAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    return res.json({
      date: today.toISOString(),
      dailyPlan,
      nextTask: formattedNextTask,
      overview,
      recentActivity,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

exports.getStats = async (req, res) => {
  const { module } = req.params;
  const userId = req.userId;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get goals for this module
    const goals = await prisma.goal.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    const moduleGoals = goals.filter(g => focusToModule(g.focus) === module.toUpperCase());

    // Get upcoming schedule items related to these goals
    const goalIds = moduleGoals.map(g => g.id);
    const upcoming = await prisma.scheduleItem.findMany({
      where: {
        userId,
        startTime: {
          gte: today,
        },
        relatedId: {
          in: goalIds,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: 10,
    });

    // Get recent logs (completed schedule items)
    const recentLogs = await prisma.scheduleItem.findMany({
      where: {
        userId,
        isCompleted: true,
        relatedId: {
          in: goalIds,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
    });

    return res.json({
      module: module.toUpperCase(),
      upcoming,
      recentLogs,
    });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
};

