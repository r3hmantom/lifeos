const prisma = require("../config/db");

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
