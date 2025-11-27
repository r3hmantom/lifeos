const prisma = require("../config/db");

exports.getAllGoals = async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.userId },
    });
    return res.json({ data: goals });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch goals" });
  }
};

exports.createGoal = async (req, res) => {
  const { title, focus, deadline, priority } = req.body;

  try {
    const goal = await prisma.goal.create({
      data: {
        title,
        focus,
        deadline: new Date(deadline),
        priority,
        userId: req.userId,
      },
    });
    return res.json(goal);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create goal" });
  }
};
