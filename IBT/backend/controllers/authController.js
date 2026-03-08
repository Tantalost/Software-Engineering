import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import sendEmail from "../utils/sendEmail.js"; 

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

    await sendEmail({
      email: user.email,
      subject: "Stall Application Reset Code",
      message: `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.`
    });

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
        return res.status(400).json({ error: "Verification code has expired." });
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


export const updateProfile = async (req, res) => {
  try {
    const { userId, name, email, contact } = req.body;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.fullName = name;
    if (email) user.email = email;
    if (contact) user.contactNo = contact;

   
    if (req.file) {
      user.avatarUrl = req.file.filename; 
    }

    await user.save();

    res.status(200).json({ 
      message: "Profile updated successfully", 
      user: { 
        id: user._id, 
        name: user.fullName, 
        email: user.email, 
        contact: user.contactNo,
        avatarUrl: user.avatarUrl 
      } 
    });
  } catch (err) {
    console.error("Profile Update Error:", err);
    res.status(500).json({ error: "Server error during profile update" });
  }
};


export const getAvatar = async (req, res) => {
    try {
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'uploads'
        });

        const downloadStream = bucket.openDownloadStreamByName(req.params.filename);
        downloadStream.on('data', (chunk) => res.write(chunk));
        downloadStream.on('error', () => res.status(404).json({ message: "Image not found" }));
        downloadStream.on('end', () => res.end());
    } catch (error) {
        res.status(500).json({ message: "Error fetching image" });
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
        contactNo,
        avatarUrl: null
    });

    const savedUser = await newUser.save();
    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ 
        message: "User created", 
        token, 
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

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({ 
        message: "Login successful", 
        token, 
        user: { 
            id: user._id, 
            name: user.fullName, 
            email: user.email, 
            contact: user.contactNo,
            avatarUrl: user.avatarUrl
        } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};