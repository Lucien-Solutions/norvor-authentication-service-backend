const jwt = require("jsonwebtoken");

const generateVerificationToken = (userId) => {
  return jwt.sign({ userId }, process.env.EMAIL_VERIFICATION_SECRET, {
    expiresIn: "1h",
  });
};

module.exports = { generateVerificationToken };
