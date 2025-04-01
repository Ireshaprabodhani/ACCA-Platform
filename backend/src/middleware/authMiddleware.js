const jwt = require("jsonwebtoken");

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
