const { default: axios } = require("axios");
const AppError = require("../utils/AppError");
const jwt = require("jsonwebtoken");

exports.verifyJWT = async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new AppError("Unauthorized request", 401);
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const response = await axios.get(
      `${process.env.baseUrl}/auth/user/${decodedToken?.userId}`
    );
    if (!response) {
      // Client should make a request to /api/v1/users/refresh-token if they have refreshToken present in their cookie
      // Then they will get a new access token which will allow them to refresh the access token without logging out the user
      throw new AppError("Invalid access token", 401);
    }
    req.user = response.data.user;
    next();
  } catch (error) {
    // Client should make a request to /api/v1/users/refresh-token if they have refreshToken present in their cookie
    // Then they will get a new access token which will allow them to refresh the access token without logging out the user
    throw new AppError(error?.message || "Invalid access token", 401);
  }
};
