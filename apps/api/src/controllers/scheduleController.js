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
  // Placeholder for AI generation logic
  // In a real implementation, this would call an AI service
  // For now, we'll just return a success message or create a dummy schedule

  try {
    // Logic to fetch goals and memories and generate schedule items would go here

    return res.json({
      message: "Schedule generated successfully",
      schedule: {
        date: date || new Date().toISOString().split("T")[0],
        items: [], // This would be populated by the AI generation
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate schedule" });
  }
};
