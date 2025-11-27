const prisma = require("../config/db");

exports.getSettings = async (req, res) => {
  try {
    let settings = await prisma.userSettings.findUnique({
      where: { userId: req.userId },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: req.userId,
        },
      });
    }

    return res.json(settings);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch settings" });
  }
};

exports.updateSettings = async (req, res) => {
  const { theme, notificationsEnabled, timezone } = req.body;

  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId },
      update: {
        theme,
        notificationsEnabled,
        timezone,
      },
      create: {
        userId: req.userId,
        theme,
        notificationsEnabled,
        timezone,
      },
    });

    return res.json(settings);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update settings" });
  }
};
