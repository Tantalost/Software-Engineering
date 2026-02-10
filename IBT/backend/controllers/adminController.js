import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import sendEmail from "../utils/sendEmail.js";

// Helper to format admin response without sensitive fields
const sanitizeAdmin = (admin) => ({
  id: admin._id,
  name: admin.name,
  email: admin.email,
  role: admin.role,
  createdAt: admin.createdAt,
  updatedAt: admin.updatedAt,
});

// POST /api/admins
// Create a new admin account (intended for Super Admin use)
export const createAdmin = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;

    if (!name || !email || !role || !password) {
      return res.status(400).json({ message: "Name, email, role, and password are required." });
    }

    // Check if an admin already exists for this role (page)
    const existingByRole = await Admin.findOne({ role });
    if (existingByRole) {
      return res
        .status(409)
        .json({ message: `An admin already exists for the ${role} page.` });
    }

    // Ensure email is unique as well
    const existingByEmail = await Admin.findOne({ email: email.toLowerCase() });
    if (existingByEmail) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      name,
      email: email.toLowerCase(),
      role,
      passwordHash,
    });

    return res.status(201).json({
      message: "Admin account created successfully.",
      admin: sanitizeAdmin(admin),
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    return res.status(500).json({ message: "Failed to create admin account." });
  }
};

// GET /api/admins
// List all admins (for Manage Employee page)
export const listAdmins = async (_req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: 1 });
    return res.json(admins.map(sanitizeAdmin));
  } catch (error) {
    console.error("Error listing admins:", error);
    return res.status(500).json({ message: "Failed to fetch admins." });
  }
};

// DELETE /api/admins/:id
export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findByIdAndDelete(id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    return res.json({ message: "Admin removed successfully." });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return res.status(500).json({ message: "Failed to remove admin." });
  }
};

// PATCH /api/admins/:id/password
export const updateAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const admin = await Admin.findByIdAndUpdate(
      id,
      { passwordHash },
      { new: true }
    );

    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    return res.json({
      message: "Password updated successfully.",
      admin: sanitizeAdmin(admin),
    });
  } catch (error) {
    console.error("Error updating admin password:", error);
    return res.status(500).json({ message: "Failed to update password." });
  }
};

// POST /api/admins/login
// Step 1: validate credentials, generate & email OTP
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
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    admin.otpCode = otpCode;
    admin.otpExpiresAt = otpExpiresAt;
    await admin.save();

    // Send OTP via email
    const isDev = process.env.NODE_ENV !== "production";

    // Try to send OTP via email when email credentials are configured.
    // In development, if email sending fails or isn't configured, we still allow OTP-based login
    // and expose the OTP in logs / response to make testing easier.
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await sendEmail({
          email: admin.email,
          subject: "Your IBT Admin Login OTP",
          message: `Your one-time password (OTP) is ${otpCode}. It will expire in 5 minutes.\n\nIf you did not attempt to log in, please ignore this email.`,
        });
      } catch (emailError) {
        console.error("Failed to send OTP email:", emailError);
        if (!isDev) {
          return res
            .status(500)
            .json({ message: "Failed to send OTP email. Please contact support." });
        }
      }
    } else {
      console.warn(
        "EMAIL_USER or EMAIL_PASS not set. Skipping OTP email send. OTP will be available in development response/logs."
      );
    }

    const baseMessage = process.env.EMAIL_USER && process.env.EMAIL_PASS
      ? "Credentials verified. OTP has been sent to the admin email."
      : "Credentials verified. OTP generated (see server logs / response in development).";

    const responsePayload = {
      message: baseMessage,
      requiresOtp: true,
    };

    if (isDev) {
      // For development convenience: surface OTP in the API response as well.
      responsePayload.otp = otpCode;
    }

    return res.json(responsePayload);
  } catch (error) {
    console.error("Error during admin login:", error);
    return res.status(500).json({ message: "Login failed." });
  }
};

// POST /api/admins/verify-otp
// Step 2: confirm OTP and finish authentication
export const verifyAdminOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin || !admin.otpCode || !admin.otpExpiresAt) {
      return res.status(400).json({ message: "No active OTP found. Please login again." });
    }

    if (admin.otpCode !== otp) {
      return res.status(401).json({ message: "Invalid OTP." });
    }

    if (admin.otpExpiresAt < new Date()) {
      return res.status(401).json({ message: "OTP has expired. Please login again." });
    }

    // Clear OTP after successful verification
    admin.otpCode = undefined;
    admin.otpExpiresAt = undefined;
    await admin.save();

    return res.json({
      message: "OTP verified. Login successful.",
      admin: sanitizeAdmin(admin),
    });
  } catch (error) {
    console.error("Error verifying admin OTP:", error);
    return res.status(500).json({ message: "Failed to verify OTP." });
  }
};

