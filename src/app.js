require("dotenv").config(); // Load environment variables first
const express = require("express");
const cors = require("cors");

const setupSwagger = require("./docs/swagger");
const { authRoutes } = require("./routes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(cors());

app.use(express.json());

setupSwagger(app);

app.use("/api/auth", authRoutes);

app.use(errorHandler);

module.exports = app;
