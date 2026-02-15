import User from "../models/User.js";

// REGISTER
export const register = async (req, res) => {
  try {
    const { email, password, fullName, contactNo } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const newUser = new User({ email, password, fullName, contactNo });
    const savedUser = await newUser.save();

    res.status(201).json({ 
        message: "User created", 
        user: { id: savedUser._id, name: savedUser.fullName, email: savedUser.email } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    // Simple check (Use bcrypt.compare in production)
    if (!user || user.password !== password) {
        return res.status(400).json({ error: "Invalid credentials" });
    }

    res.status(200).json({ 
        message: "Login successful", 
        user: { id: user._id, name: user.fullName, email: user.email, contact: user.contactNo } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};