import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    const verifiedUser = jwt.verify(token, process.env.JWT_SECRET);

    req.user = verifiedUser;

    next(); 
    
  } catch (err) {
    
    res.status(403).json({ error: "Invalid or expired token. Please log in again." });
  }
};