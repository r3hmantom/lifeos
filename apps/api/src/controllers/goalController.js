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

exports.updateGoal = async (req, res) => {
  const { id } = req.params;
  const { title, focus, deadline, priority, isActive } = req.body;

  try {
    const updatedGoal = await prisma.goal.update({
      where: { id, userId: req.userId },
      data: {
        title,
        focus,
        deadline: deadline ? new Date(deadline) : undefined,
        priority,
        isActive,
      },
    });
    return res.json(updatedGoal);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update goal" });
  }
};

exports.deleteGoal = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.goal.delete({
      where: { id, userId: req.userId },
    });
    return res.json({ message: "Goal deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete goal" });
  }
};
