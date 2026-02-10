import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
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

// --- NEW AUTH FLOWS ---

// 1. Send OTP (For EDITING credentials)
// Logic: Super Admin requests this -> Save code to Target Admin DB -> Email code to Super Admin
export const sendOtp = async (req, res) => {
  try {
    // The frontend sends the email of the ADMIN BEING EDITED
    const targetEmail = req.body.email; 
    
    if (!targetEmail) return res.status(400).json({ message: "Target email required." });

    // 1. Find the Target Admin to generate the code for
    const targetAdmin = await Admin.findOne({ email: targetEmail.toLowerCase() });
    if (!targetAdmin) return res.status(404).json({ message: "Admin account not found." });

    // 2. Generate OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // 3. Save OTP to the TARGET account (so updateAdmin can find/verify it later)
    targetAdmin.otpCode = otpCode;
    targetAdmin.otpExpiresAt = otpExpiresAt;
    await targetAdmin.save();

    // 4. Send Email to SUPER ADMIN (The "Boss" Authorizing the change)
    const superAdminEmail = process.env.SUPERADMIN_EMAIL; 
    
    if (!superAdminEmail) {
        return res.status(500).json({ message: "Server Error: SUPERADMIN_EMAIL not configured." });
    }

    await sendEmail({
      email: superAdminEmail, // <--- SENT TO SUPER ADMIN
      subject: "Admin Account Update Authorization",
      message: `Authorization Required:\n\nYou are attempting to update the password for admin: ${targetAdmin.name} (${targetAdmin.email}).\n\nYour Verification OTP is: ${otpCode}\n\nIf you did not request this, please secure your account immediately.`
    });

    return res.json({ message: `OTP sent to Super Admin (${superAdminEmail}).` });
  } catch (error) {
    console.error("OTP Error:", error);
    return res.status(500).json({ message: "Failed to send OTP." });
  }
};

// 2. Update Admin (Verifies the OTP stored on the admin record)
export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, otp } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ message: "Admin not found." });

    // Update Basic Info
    if (name) admin.name = name;
    if (email) admin.email = email.toLowerCase();

    // If Password change is requested
    if (password) {
      if (!otp) {
        return res.status(400).json({ message: "OTP is required to change password." });
      }

      // Verify OTP (Checks the code we saved to this admin's record)
      if (admin.otpCode !== otp) {
        return res.status(401).json({ message: "Invalid OTP." });
      }
      if (new Date() > admin.otpExpiresAt) {
        return res.status(401).json({ message: "OTP has expired." });
      }

      admin.passwordHash = await bcrypt.hash(password, 10);
      
      // Cleanup
      admin.otpCode = undefined;
      admin.otpExpiresAt = undefined;
    }

    await admin.save();

    return res.json({
      message: "Admin updated successfully.",
      admin: sanitizeAdmin(admin),
    });
  } catch (error) {
    console.error("Update Error:", error);
    return res.status(500).json({ message: "Failed to update admin." });
  }
};

// 3. Login Admin (Standard Login Flow)
// Logic: User logs in -> OTP sent to THAT User
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); 

    admin.otpCode = otpCode;
    admin.otpExpiresAt = otpExpiresAt;
    await admin.save();

    // SEND TO THE USER WHO IS LOGGING IN
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await sendEmail({
          email: admin.email, // <--- SENT TO THE USER
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

// 4. Verify Login OTP
export const verifyAdminOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin || !admin.otpCode || admin.otpCode !== otp) {
        return res.status(401).json({ message: "Invalid or expired OTP." });
    }

    // Check expiration
    if (new Date() > admin.otpExpiresAt) {
        return res.status(401).json({ message: "OTP has expired." });
    }

    admin.otpCode = undefined;
    admin.otpExpiresAt = undefined;
    await admin.save();

    return res.json({ 
        message: "Login successful.", 
        admin: sanitizeAdmin(admin) 
    });
  } catch(e) {
      return res.status(500).json({message: "Verification failed."});
  }
};