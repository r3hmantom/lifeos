const prisma = require("../config/db");

exports.getAllSlots = async (req, res) => {
  try {
    const slots = await prisma.timetableSlot.findMany({
      where: { userId: req.userId },
      orderBy: { time: "asc" },
    });
    return res.json({ data: slots });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch timetable slots" });
  }
};

exports.createSlot = async (req, res) => {
  const { time, activity, isActive } = req.body;

  try {
    const slot = await prisma.timetableSlot.create({
      data: {
        time,
        activity,
        isActive: isActive !== undefined ? isActive : true,
        userId: req.userId,
      },
    });
    return res.json(slot);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create timetable slot" });
  }
};

exports.updateSlot = async (req, res) => {
  const { id } = req.params;
  const { time, activity, isActive } = req.body;

  try {
    const slot = await prisma.timetableSlot.findUnique({
      where: { id },
    });

    if (!slot || slot.userId !== req.userId) {
      return res.status(404).json({ error: "Slot not found" });
    }

    const updatedSlot = await prisma.timetableSlot.update({
      where: { id },
      data: {
        time,
        activity,
        isActive,
      },
    });

    return res.json(updatedSlot);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update timetable slot" });
  }
};

exports.deleteSlot = async (req, res) => {
  const { id } = req.params;

  try {
    const slot = await prisma.timetableSlot.findUnique({
      where: { id },
    });

    if (!slot || slot.userId !== req.userId) {
      return res.status(404).json({ error: "Slot not found" });
    }

    await prisma.timetableSlot.delete({
      where: { id },
    });

    return res.json({ message: "Slot deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete timetable slot" });
  }
};
