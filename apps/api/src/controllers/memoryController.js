const prisma = require("../config/db");

exports.getAllMemories = async (req, res) => {
  try {
    const memories = await prisma.memory.findMany({
      where: { userId: req.userId },
    });
    return res.json({ data: memories });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch memories" });
  }
};

exports.createMemory = async (req, res) => {
  const { title, description, tags, date } = req.body;

  try {
    const memory = await prisma.memory.create({
      data: {
        title,
        description,
        tags,
        date: new Date(date),
        userId: req.userId,
      },
    });
    return res.json(memory);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create memory" });
  }
};
