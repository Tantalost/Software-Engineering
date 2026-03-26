import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import sendEmail from "../utils/sendEmail.js"; 

export const sendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    let user = await User.findOne({ email });

   if (user && (user.password || user.mpin)) {
        return res.status(400).json({ error: "Email already registered. Please login or reset your MPIN." });
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
    const { email, otp, newMpin } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.otp || user.otp !== otp) {
        return res.status(400).json({ error: "Invalid verification code." });
    }

    if (user.otpExpires < Date.now()) {
        return res.status(400).json({ error: "Verification code has expired." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewMpin = await bcrypt.hash(newMpin, salt);

    user.mpin = hashedNewMpin;
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
   const { email, otp, mpin, firstName, middleName, lastName, suffix, contactNo } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Registration session not found. Please try signing up again." });

    if (!user.otp || user.otp !== otp) {
        return res.status(400).json({ error: "Invalid verification code." });
    }
    if (user.otpExpires < Date.now()) {
        return res.status(400).json({ error: "Verification code has expired." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedMpin = await bcrypt.hash(mpin, salt);

    user.mpin = hashedMpin;
    user.firstName = firstName;
    user.middleName = middleName;
    user.lastName = lastName;
    user.suffix = suffix;
    user.contactNo = contactNo;
    user.otp = null;
    user.otpExpires = null;
    user.isVerified = true;

    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: "Registration Successful - IBT Stalls",
        message: `Hi ${user.firstName},\n\nYour account has been successfully created and your 4-digit MPIN is set up.\n\nYou can now open the app and log in.\n\nThank you,\nIBT Management`
      });
    } catch (emailError) {
      console.error("Welcome email failed to send, but registration succeeded:", emailError);
    }

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
    const { email, mpin } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(mpin, user.mpin))) {
        return res.status(400).json({ error: "Invalid credentials" });
    }

    if (user.status === 'deactivated') {
        return res.status(403).json({ error: "Your account is deactivated.", isDeactivated: true });
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

export const changePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    const user = await User.findOne({ email });
    
    const isMatch = user && (user.mpin ? await bcrypt.compare(oldPassword, user.mpin) : (user.password ? await bcrypt.compare(oldPassword, user.password) : false));
    
    if (!user || !isMatch) {
       return res.status(400).json({ error: "Incorrect current security code." });
    }
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    
    if (user.password) user.password = newHash;
    if (user.mpin) user.mpin = newHash; 
    if (!user.mpin && !user.password) user.mpin = newHash; 

    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: "Security Code Changed - IBT Stalls",
        message: `Hi ${user.firstName || 'Vendor'},\n\nYour account security code (MPIN) was successfully updated.\n\nIf you did not make this change, please contact administration immediately.\n\nThank you,\nIBT Management`
      });
    } catch (emailError) {
      console.error("Change MPIN email failed:", emailError.message);
    }

    res.status(200).json({ message: "Security code updated successfully." });
  } catch (err) { 
      res.status(500).json({ error: err.message }); 
  }
};

export const deactivateAccount = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOneAndUpdate({ email }, { status: 'deactivated' }, { new: true });
    
    if (user) {
      try {
        await sendEmail({
          email: user.email,
          subject: "Account Deactivated - IBT Stalls",
          message: `Hi ${user.firstName || 'Vendor'},\n\nYour account has been deactivated as requested. You will no longer be able to log in.\n\nTo reactivate your account, simply attempt to log in with your email/MPIN and follow the reactivation prompts.\n\nThank you,\nIBT Management`
        });
      } catch (emailError) {
        console.error("Deactivation email failed:", emailError.message);
      }
    }

    res.status(200).json({ message: "Account deactivated." });
  } catch (err) { 
      res.status(500).json({ error: err.message }); 
  }
};

export const reactivateRequest = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Account not found." });
    if (user.status !== 'deactivated') return res.status(400).json({ error: "Account is already active." });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail({
      email: user.email,
      subject: "Account Reactivation Code",
      message: `Your account reactivation code is: ${otp}\n\nThis code will expire in 10 minutes.`
    });
    res.status(200).json({ message: "Reactivation OTP sent to email." });
  } catch (err) { 
      res.status(500).json({ error: err.message }); 
  }
};

export const reactivateConfirm = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.otp || user.otp !== otp) return res.status(400).json({ error: "Invalid verification code." });
    if (user.otpExpires < Date.now()) return res.status(400).json({ error: "Verification code has expired." });

    user.status = 'active';
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: "Account Reactivated - IBT Stalls",
        message: `Hi ${user.firstName || 'Vendor'},\n\nWelcome back! Your account has been successfully reactivated.\n\nYou can now log in using your MPIN.\n\nThank you,\nIBT Management`
      });
    } catch (emailError) {
      console.error("Reactivation email failed:", emailError.message);
    }

    res.status(200).json({ message: "Account reactivated successfully. You can now log in." });
  } catch (err) { 
      res.status(500).json({ error: err.message }); 
  }
};

export const requestEmailChangeOtp = async (req, res) => {
  try {
    const { userId, newEmail } = req.body;
    
    // Check if the new email is already taken by another user
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
        return res.status(400).json({ error: "This email is already in use by another account." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail({
      email: newEmail, 
      subject: "Change Email Verification - IBT Stalls",
      message: `Hi ${user.firstName || 'Vendor'},\n\nYour verification code to change your account email is: ${otp}\n\nThis code will expire in 10 minutes.`
    });

    res.status(200).json({ message: "Verification code sent to your new email." });
  } catch (err) { 
      res.status(500).json({ error: err.message }); 
  }
};

export const verifyAndChangeEmail = async (req, res) => {
  try {
    const { userId, newEmail, otp } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    if (!user.otp || user.otp !== otp) return res.status(400).json({ error: "Invalid verification code." });
    if (user.otpExpires < Date.now()) return res.status(400).json({ error: "Verification code has expired." });

    
    user.email = newEmail;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({ message: "Email changed successfully.", newEmail: user.email });
  } catch (err) { 
      res.status(500).json({ error: err.message }); 
  }
};