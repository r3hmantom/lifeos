const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const memoryRoutes = require("./memories");
const goalRoutes = require("./goals");
const scheduleRoutes = require("./schedule");
const settingsRoutes = require("./settings");

router.use("/auth", authRoutes);
router.use("/memories", memoryRoutes);
router.use("/goals", goalRoutes);
router.use("/schedule", scheduleRoutes);
router.use("/settings", settingsRoutes);

module.exports = router;
