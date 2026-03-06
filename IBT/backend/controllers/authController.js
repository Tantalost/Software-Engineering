import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ error: "No account found with that email address." });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; 
    await user.save();

    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.EMAIL_PASS, 
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: { 
            name: "Stall Application Support", 
            email: process.env.EMAIL_USER 
        },
        to: [{ email: user.email }],
        subject: "Your Password Reset Code",
        textContent: `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.`
      })
    });

    if (!brevoRes.ok) {
        const errorData = await brevoRes.text();
        console.error("Brevo API Error:", errorData);
        throw new Error("Failed to send email via Brevo.");
    }

    res.status(200).json({ message: "Verification code sent to email." });

  } catch (err) {
    console.error("OTP Send Error:", err);
    res.status(500).json({ error: "Failed to send email. Check server logs." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.otp || user.otp !== otp) {
        return res.status(400).json({ error: "Invalid verification code." });
    }

    if (user.otpExpires < Date.now()) {
        return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedNewPassword; 
    
    user.otp = null;
    user.otpExpires = null;
    
    await user.save();

    res.status(200).json({ message: "Password reset successfully." });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const register = async (req, res) => {
  try {
    const { email, password, fullName, contactNo } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
        email,
        password: hashedPassword,
        fullName,
        contactNo
    });

    const savedUser = await newUser.save();

    const token = jwt.sign(
        { id: savedUser._id, email: savedUser.email }, 
        process.env.JWT_SECRET, 
        { expiresIn: "7d" } 
    );

    res.status(201).json({ 
        message: "User created", 
        token: token, 
        user: { id: savedUser._id, name: savedUser.fullName, email: savedUser.email } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
        { id: user._id, email: user.email }, 
        process.env.JWT_SECRET, 
        { expiresIn: "7d" } 
    );

    res.status(200).json({ 
        message: "Login successful", 
        token: token, 
        user: { id: user._id, name: user.fullName, email: user.email, contact: user.contactNo } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};