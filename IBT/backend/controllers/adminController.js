import bcrypt from "bcryptjs";
import crypto from "crypto"; // Built-in Node module
import Admin from "../models/Admin.js";
import PasswordReset from "../models/PasswordReset.js"; // New model
import sendEmail from "../utils/sendEmail.js";

const sanitizeAdmin = (admin) => ({
  id: admin._id,
  name: admin.name,
  email: admin.email,
  role: admin.role,
  createdAt: admin.createdAt,
  updatedAt: admin.updatedAt,
});

// --- EXISTING CRUD (Create, List, Delete) ---

export const createAdmin = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    if (!name || !email || !role || !password) return res.status(400).json({ message: "All fields are required." });

    const existing = await Admin.findOne({ $or: [{ email: email.toLowerCase() }, { role }] });
    if (existing) return res.status(409).json({ message: "Admin with this email or role already exists." });

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ name, email: email.toLowerCase(), role, passwordHash });

    return res.status(201).json({ message: "Created successfully.", admin: sanitizeAdmin(admin) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const listAdmins = async (_req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: 1 });
    return res.json(admins.map(sanitizeAdmin));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch admins." });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    return res.json({ message: "Admin removed." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove admin." });
  }
};

// --- AUTH FLOWS ---

export const sendOtp = async (req, res) => {
  try {
    const targetEmail = req.body.email; 
    if (!targetEmail) return res.status(400).json({ message: "Target email required." });

    const targetAdmin = await Admin.findOne({ email: targetEmail.toLowerCase() });
    if (!targetAdmin) return res.status(404).json({ message: "Admin account not found." });

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); 

    targetAdmin.otpCode = otpCode;
    targetAdmin.otpExpiresAt = otpExpiresAt;
    await targetAdmin.save();

    const superAdminEmail = process.env.SUPERADMIN_EMAIL; 
    if (!superAdminEmail) return res.status(500).json({ message: "Server Error: SUPERADMIN_EMAIL not configured." });

    await sendEmail({
      email: superAdminEmail, 
      subject: "Admin Account Update Authorization",
      message: `Authorization Required:\n\nYou are attempting to update the password for admin: ${targetAdmin.name} (${targetAdmin.email}).\n\nYour Verification OTP is: ${otpCode}\n\nIf you did not request this, please secure your account immediately.`
    });

    return res.json({ message: `OTP sent to Super Admin (${superAdminEmail}).` });
  } catch (error) {
    console.error("OTP Error:", error);
    return res.status(500).json({ message: "Failed to send OTP." });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, otp } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ message: "Admin not found." });

    if (name) admin.name = name;
    if (email) admin.email = email.toLowerCase();

    if (password) {
      if (!otp) return res.status(400).json({ message: "OTP is required to change password." });
      if (admin.otpCode !== otp) return res.status(401).json({ message: "Invalid OTP." });
      if (new Date() > admin.otpExpiresAt) return res.status(401).json({ message: "OTP has expired." });

      admin.passwordHash = await bcrypt.hash(password, 10);
      admin.otpCode = undefined;
      admin.otpExpiresAt = undefined;
    }

    await admin.save();
    return res.json({ message: "Admin updated successfully.", admin: sanitizeAdmin(admin) });
  } catch (error) {
    console.error("Update Error:", error);
    return res.status(500).json({ message: "Failed to update admin." });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    
    // Check if admin exists
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // UPDATED: Check password and flag superadmin for reset
    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      const isSuperAdmin = admin.role === 'superadmin';
      return res.status(401).json({ 
        message: "Invalid credentials.", 
        showReset: isSuperAdmin // <--- This triggers the frontend "Forgot Password" button!
      });
    }

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); 

    admin.otpCode = otpCode;
    admin.otpExpiresAt = otpExpiresAt;
    await admin.save();

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await sendEmail({
          email: admin.email,
          subject: "Your IBT Admin Login OTP",
          message: `Your login OTP is ${otpCode}. It expires in 5 minutes.`,
        });
      } catch (emailError) {
        console.error("Failed to send OTP email:", emailError);
      }
    }

    return res.json({ message: "OTP sent to your email.", requiresOtp: true });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Login failed." });
  }
};

export const verifyAdminOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin || !admin.otpCode || admin.otpCode !== otp) {
        return res.status(401).json({ message: "Invalid or expired OTP." });
    }

    if (new Date() > admin.otpExpiresAt) {
        return res.status(401).json({ message: "OTP has expired." });
    }

    admin.otpCode = undefined;
    admin.otpExpiresAt = undefined;
    await admin.save();

    return res.json({ message: "Login successful.", admin: sanitizeAdmin(admin) });
  } catch(e) {
      return res.status(500).json({message: "Verification failed."});
  }
};

// --- NEW FORGOT PASSWORD FLOWS ---

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email: email.toLowerCase(), role: 'superadmin' });
    
    if (!admin) return res.status(404).json({ message: "Admin not found or unauthorized." });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await PasswordReset.deleteMany({ email: admin.email });
    await PasswordReset.create({ email: admin.email, otpHash, expiresAt });

    await sendEmail({
      email: admin.email,
      subject: "Superadmin Password Reset Code",
      message: `Your password reset code is: ${otp}\n\nThis code will expire in 10 minutes.`
    });

    res.status(200).json({ message: "Reset OTP sent to email." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const resetRecord = await PasswordReset.findOne({ email: email.toLowerCase() });

    if (!resetRecord || resetRecord.expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP is invalid or has expired." });
    }

    const isMatch = await bcrypt.compare(otp, resetRecord.otpHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect OTP." });
    }

    // Generate secure temporary token to authorize the actual password change
    const resetToken = crypto.randomBytes(32).toString('hex');
    resetRecord.resetToken = resetToken;
    await resetRecord.save();

    res.status(200).json({ message: "OTP verified.", resetToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    
    const resetRecord = await PasswordReset.findOne({ email: email.toLowerCase(), resetToken });
    if (!resetRecord || resetRecord.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired reset session." });
    }

    // Hash new password and update admin model directly
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await Admin.findOneAndUpdate({ email: email.toLowerCase() }, { passwordHash });

    await PasswordReset.deleteMany({ email: email.toLowerCase() });

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};a