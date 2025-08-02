require("dotenv").config(); // Load environment variables first
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const setupSwagger = require("./docs/swagger");
const { authRoutes,congitoRoutes } = require("./routes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(cookieParser());

app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN === "*"
        ? "*"
        : process.env.CORS_ORIGIN?.split(","),
    // credentials: true,
  })
);

app.use(express.json());

setupSwagger(app);

app.use("/api/auth", authRoutes);
app.use("/api/cognito",congitoRoutes);

app.use(errorHandler);

module.exports = app;
