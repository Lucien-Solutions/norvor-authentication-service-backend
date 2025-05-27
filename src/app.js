require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { authRoutes } = require("./routes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use(errorHandler);

module.exports = app;
