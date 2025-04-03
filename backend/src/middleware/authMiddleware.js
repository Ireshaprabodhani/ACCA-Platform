const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

exports.adminAuth = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.admin = verified;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};



exports.userAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization");
    console.log("Received Token:", token); // Debugging Token Received

    if (!token) {
      return res.status(401).json({ error: "Access Denied! No Token Provided." });
    }

    // Extract token from "Bearer <token>"
    const tokenParts = token.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      console.log("Invalid Token Format:", token); // Debugging Invalid Format
      return res.status(401).json({ error: "Invalid Token Format!" });
    }

    const decoded = jwt.verify(tokenParts[1], process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded); // Debugging Decoded Token

    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      console.log("User Not Found in Database!");
      return res.status(401).json({ error: "User not found!" });
    }

    console.log("User Authenticated:", req.user.email);
    next();
  } catch (err) {
    console.log("JWT Error:", err.message); // Debugging JWT Errors
    return res.status(401).json({ error: "Invalid Token!" });
  }
};

