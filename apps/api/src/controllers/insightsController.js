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

exports.getInsights = async (req, res) => {
  const { startDate, endDate } = req.query;
  const userId = req.userId;

  try {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 7));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const tasks = await prisma.scheduleItem.findMany({
      where: {
        userId,
        startTime: {
          gte: start,
          lte: end,
        },
      },
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.isCompleted).length;
    const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate category distribution (using 'type' or inferred from related goals)
    const categoryDistribution = {};
    
    // Fetch related goals to get categories (focus)
    const goalIds = tasks
        .filter(t => t.relatedId && t.type === 'goal_task')
        .map(t => t.relatedId);
        
    const goals = await prisma.goal.findMany({
        where: { id: { in: goalIds } }
    });
    
    const goalMap = goals.reduce((acc, goal) => {
        acc[goal.id] = goal.focus;
        return acc;
    }, {});

    tasks.forEach((task) => {
      let category = "Other";
      if (task.type === "goal_task" && task.relatedId && goalMap[task.relatedId]) {
          category = goalMap[task.relatedId];
      } else if (task.type) {
          category = task.type.charAt(0).toUpperCase() + task.type.slice(1);
      }
      
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
    });

    return res.json({
      productivityScore,
      completedTasks,
      totalTasks,
      categoryDistribution,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch insights" });
  }
};

// New endpoint for mobile app dashboard insights
exports.getDashboardInsights = async (req, res) => {
  const { startDate, endDate } = req.query;
  const userId = req.userId;

  try {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 7));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get all tasks in the period
    const tasks = await prisma.scheduleItem.findMany({
      where: {
        userId,
        startTime: {
          gte: start,
          lte: end,
        },
      },
    });

    // Get all goals to map modules
    const allGoals = await prisma.goal.findMany({
      where: { userId },
    });

    const goalMap = allGoals.reduce((acc, goal) => {
      acc[goal.id] = goal;
      return acc;
    }, {});

    // Calculate scores per module
    const moduleStats = {
      UNI: { total: 0, completed: 0 },
      WORK: { total: 0, completed: 0 },
      FITNESS: { total: 0, completed: 0 },
      LIFE: { total: 0, completed: 0 },
    };

    tasks.forEach((task) => {
      let module = 'LIFE';
      if (task.relatedId && goalMap[task.relatedId]) {
        module = focusToModule(goalMap[task.relatedId].focus);
      }
      
      moduleStats[module].total++;
      if (task.isCompleted) {
        moduleStats[module].completed++;
      }
    });

    // Calculate scores (completion percentage per module)
    const scores = {
      UNI: moduleStats.UNI.total > 0 
        ? Math.round((moduleStats.UNI.completed / moduleStats.UNI.total) * 100) 
        : 0,
      WORK: moduleStats.WORK.total > 0 
        ? Math.round((moduleStats.WORK.completed / moduleStats.WORK.total) * 100) 
        : 0,
      FITNESS: moduleStats.FITNESS.total > 0 
        ? Math.round((moduleStats.FITNESS.completed / moduleStats.FITNESS.total) * 100) 
        : 0,
      LIFE: moduleStats.LIFE.total > 0 
        ? Math.round((moduleStats.LIFE.completed / moduleStats.LIFE.total) * 100) 
        : 0,
    };

    // Calculate overall productivity
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.isCompleted).length;
    const overallProductivity = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    // Generate analysis based on data
    const topModule = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0];
    const bottomModule = Object.entries(scores).reduce((a, b) => scores[a[0]] < scores[b[0]] ? a : b)[0];

    const highlight = overallProductivity >= 70 
      ? `Great job! You've completed ${completedTasks} out of ${totalTasks} tasks this week.`
      : `You've made progress with ${completedTasks} completed tasks. Keep it up!`;

    const missedOpportunity = scores[bottomModule] < 50
      ? `Focus on improving your ${bottomModule} module - you have room to grow here.`
      : `Consider balancing your time across all modules for better overall productivity.`;

    const burnoutRisk = totalTasks > 20 && overallProductivity < 50
      ? `You have many tasks scheduled. Consider prioritizing and breaking them into smaller steps.`
      : totalTasks > 15
      ? `You have a busy schedule. Make sure to take breaks and maintain work-life balance.`
      : null;

    const coaching_advice = overallProductivity >= 70
      ? `You're doing excellent! Your consistency is paying off. Keep maintaining this momentum and remember to celebrate your wins.`
      : overallProductivity >= 50
      ? `You're making steady progress. Focus on completing tasks one at a time and don't forget to take breaks when needed.`
      : `Every journey starts with a single step. Try breaking down larger tasks into smaller, manageable pieces. You've got this!`;

    return res.json({
      scores,
      analysis: {
        highlight,
        missed_opportunity: missedOpportunity,
        burnout_risk: burnoutRisk || undefined,
      },
      coaching_advice,
    });
  } catch (err) {
    console.error('Dashboard insights error:', err);
    return res.status(500).json({ error: "Failed to fetch dashboard insights" });
  }
};
