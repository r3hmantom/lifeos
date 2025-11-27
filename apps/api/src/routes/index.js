const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const memoryRoutes = require("./memories");
const goalRoutes = require("./goals");
const scheduleRoutes = require("./schedule");

router.use("/auth", authRoutes);
router.use("/memories", memoryRoutes);
router.use("/goals", goalRoutes);
router.use("/schedule", scheduleRoutes);

module.exports = router;
