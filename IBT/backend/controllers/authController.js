import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import sendEmail from "../utils/sendEmail.js"; 

export const sendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    let user = await User.findOne({ email });

    if (user && user.password) {
        return res.status(400).json({ error: "Email already registered. Please login or reset your password." });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    if (!user) {
        user = new User({ email, otp, otpExpires });
    } else {
        user.otp = otp;
        user.otpExpires = otpExpires;
    }
    await user.save();

    await sendEmail({
      email: user.email,
      subject: "Stall Application - Registration Code",
      message: `Welcome! Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.`
    });

    res.status(200).json({ message: "Registration initiated. OTP sent to email." });

  } catch (err) {
    console.error("OTP Send Error:", err);
    res.status(500).json({ error: "Failed to send OTP." });
  }
};

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
    
    const { userId, firstName, lastName, email, contact } = req.body;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
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
        firstName: user.firstName, 
        lastName: user.lastName, 
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
    const { email, otp, password, firstName, middleName, lastName, suffix, contactNo } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Registration session not found. Please try signing up again." });

    if (!user.otp || user.otp !== otp) {
        return res.status(400).json({ error: "Invalid verification code." });
    }
    if (user.otpExpires < Date.now()) {
        return res.status(400).json({ error: "Verification code has expired." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.firstName = firstName;
    user.middleName = middleName;
    user.lastName = lastName;
    user.suffix = suffix;
    user.contactNo = contactNo;
    user.otp = null;
    user.otpExpires = null;
    user.isVerified = true;

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ 
        message: "Account created and verified successfully", 
        token, 
        user: { 
            id: user._id, 
            firstName: user.firstName, 
            middleName: user.middleName,
            lastName: user.lastName, 
            suffix: user.suffix,        
            email: user.email,
            contact: user.contactNo,
            avatarUrl: user.avatarUrl   
        }
    });
  } catch (err) {
    console.error("Registration Error:", err);
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
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName,
            suffix: user.suffix,
            email: user.email, 
            contact: user.contactNo,
            avatarUrl: user.avatarUrl
        } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};