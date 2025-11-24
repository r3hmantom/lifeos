const express = require("express");
const router = express.Router();

router.use("/", (req, res, next) => {
  console.log(req);
  next();
});

const memoryRoutes = require("./memories");
const plannerRoutes = require("./planner");
const authRoutes = require("./auth");
const dashboardRoutes = require("./dashboard");
const userRoutes = require("./user");

router.use("/auth", authRoutes);
router.use("/memories", memoryRoutes);
router.use("/planner", plannerRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/user", userRoutes);
app.get("/health", (req, res) => res.json({ status: "ok" }));

module.exports = router;
