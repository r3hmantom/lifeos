const prisma = require("../config/db");

exports.getDailySchedule = async (req, res) => {
  const { date } = req.query;
  const targetDate = date ? new Date(date) : new Date();

  // Set start and end of the day
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const items = await prisma.scheduleItem.findMany({
      where: {
        userId: req.userId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return res.json({
      date: targetDate.toISOString().split("T")[0],
      items,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch schedule" });
  }
};

exports.generateSchedule = async (req, res) => {
  const { timezone, date, preferences } = req.body;
  
  try {
    const targetDate = date ? new Date(date) : new Date();
    
    // Helper to set time on the target date
    const setTime = (h, m) => {
      const d = new Date(targetDate);
      d.setHours(h, m, 0, 0);
      return d;
    };

    // Create dummy schedule items
    const newItems = [
      {
        title: "Morning Focus Session",
        description: "Deep work on high priority goals (AI Generated)",
        startTime: setTime(9, 0),
        endTime: setTime(11, 0),
        type: "goal_task",
        userId: req.userId,
        isCompleted: false,
      },
      {
        title: "Lunch Break",
        description: "Recharge and relax",
        startTime: setTime(12, 0),
        endTime: setTime(13, 0),
        type: "routine",
        userId: req.userId,
        isCompleted: false,
      },
      {
        title: "Project Review",
        description: "Review progress and update tasks",
        startTime: setTime(14, 0),
        endTime: setTime(15, 30),
        type: "fixed_commitment",
        userId: req.userId,
        isCompleted: false,
      }
    ];

    // Save to database
    const createdItems = await Promise.all(
      newItems.map(item => prisma.scheduleItem.create({ data: item }))
    );

    return res.json({
      message: "Schedule generated successfully",
      schedule: {
        date: targetDate.toISOString().split("T")[0],
        items: createdItems,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate schedule" });
  }
};
