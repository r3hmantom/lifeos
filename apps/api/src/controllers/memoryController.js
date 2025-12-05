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
        userId: req.userId,
      },
    });
    return res.json(memory);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create memory" });
  }
};

exports.updateMemory = async (req, res) => {
  const { id } = req.params;
  const { title, description, tags, date, isActive } = req.body;

  try {
    const updatedMemory = await prisma.memory.update({
      where: { id, userId: req.userId },
      data: {
        title,
        description,
        isActive,
      },
    });
    return res.json(updatedMemory);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update memory" });
  }
};

exports.deleteMemory = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.memory.delete({
      where: { id, userId: req.userId },
    });
    return res.json({ message: "Memory deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete memory" });
  }
};
