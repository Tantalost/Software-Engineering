import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    let token;
    const authHeader = req.header("Authorization");

   
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } 
    
    else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const verifiedUser = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verifiedUser;

    next(); 
    
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token. Please log in again." });
  }
};

export const requireSuperAdmin = (req, res, next) => {
  // Assuming req.user is set by verifyToken
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Superadmin privileges required." });
  }
};