import bcrypt from "bcryptjs";
import crypto from "crypto";
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";
import PasswordReset from "../models/PasswordReset.js";
import Settings from "../models/Settings.js";
import sendEmail from "../utils/sendEmail.js";

const DASHBOARD_TARGETS_KEY = "dashboardRevenueTargets";
const DEFAULT_DASHBOARD_TARGETS = Object.freeze({
  tickets: 5000,
  bus: 4000,
  tenants: 10000,
  parking: 3000,
});

const toNonNegativeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
};

const normalizeDashboardTargets = (value = {}) => ({
  tickets: toNonNegativeNumber(value.tickets, DEFAULT_DASHBOARD_TARGETS.tickets),
  bus: toNonNegativeNumber(value.bus, DEFAULT_DASHBOARD_TARGETS.bus),
  tenants: toNonNegativeNumber(value.tenants, DEFAULT_DASHBOARD_TARGETS.tenants),
  parking: toNonNegativeNumber(value.parking, DEFAULT_DASHBOARD_TARGETS.parking),
});

const getDeviceFingerprint = (req) => {
  let rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
  const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : rawIp;
  const userAgent = req.headers['user-agent'] || 'unknown-device';
  return crypto.createHash('sha256').update(`${clientIp}-${userAgent}`).digest('hex');
};

const sanitizeAdmin = (admin) => ({
  id: admin._id,
  firstName: admin.firstName,
  lastName: admin.lastName,
  middleName: admin.middleName,
  suffix: admin.suffix,
  name: `${admin.firstName} ${admin.middleName ? admin.middleName + ' ' : ''}${admin.lastName}${admin.suffix ? ' ' + admin.suffix : ''}`.trim(),
  email: admin.email,
  role: admin.role,
  assignedShift: admin.assignedShift || null,
  status: admin.status || "Active",
  createdAt: admin.createdAt,
  updatedAt: admin.updatedAt,
});

const LEGACY_SHIFT_PATTERN = /^(\d{2})-(\d{2})$/;
const DYNAMIC_SHIFT_PATTERN = /^\d{1,2}:\d{2}\s?(AM|PM)\s-\s\d{1,2}:\d{2}\s?(AM|PM)$/i;

const normalizeAssignedShift = (rawShift = "") => {
  const value = String(rawShift || "").trim().replace(/\s+/g, " ");
  if (!value) return "";

  if (LEGACY_SHIFT_PATTERN.test(value)) {
    const [, startRaw, endRaw] = value.match(LEGACY_SHIFT_PATTERN) || [];
    const start = String(parseInt(startRaw, 10)).padStart(2, "0");
    const end = String(parseInt(endRaw, 10)).padStart(2, "0");
    return `${start}-${end}`;
  }

  if (!DYNAMIC_SHIFT_PATTERN.test(value)) {
    return "";
  }

  const [startPart, endPart] = value.split(" - ");
  const normalizePart = (part) => {
    const match = String(part).trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
    if (!match) return "";
    const hour = String(parseInt(match[1], 10)).padStart(2, "0");
    const minute = match[2];
    const period = match[3].toUpperCase();
    return `${hour}:${minute} ${period}`;
  };

  const normalizedStart = normalizePart(startPart);
  const normalizedEnd = normalizePart(endPart);
  if (!normalizedStart || !normalizedEnd) return "";
  if (normalizedStart === normalizedEnd) return "";

  return `${normalizedStart} - ${normalizedEnd}`;
};

export const createAdmin = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      middleName,
      suffix,
      email,
      role,
      password,
      assignedShift,
    } = req.body;
    
    if (!firstName || !lastName || !email || !role || !password) {
      return res.status(400).json({ message: "All required fields are required." });
    }

    if (role === 'superadmin') {
      return res.status(403).json({ 
        message: "Security restriction: Super Admin accounts cannot be created or cloned via the API." 
      });
    }

    const normalizedShift = normalizeAssignedShift(assignedShift);
    if (!normalizedShift) {
      return res.status(400).json({ message: "A valid assigned shift is required." });
    }

    const existingEmail = await Admin.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ message: "Admin with this email already exists." });
    }

    // Check the number of admins with this role
    const roleCount = await Admin.countDocuments({ role });
    if (roleCount >= 4) {
      return res.status(409).json({ message: "Maximum 4 admins allowed per role." });
    }

    const duplicateShift = await Admin.findOne({ role, assignedShift: normalizedShift });
    if (duplicateShift) {
      return res.status(409).json({
        message: `Shift ${normalizedShift} is already assigned for ${role}.`,
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const admin = await Admin.create({ 
      firstName, 
      lastName, 
      middleName, 
      suffix, 
      email: email.toLowerCase(), 
      role, 
      assignedShift: normalizedShift,
      status: "Active",
      passwordHash
    });

    return res.status(201).json({ 
      message: "Created successfully.", 
      admin: sanitizeAdmin(admin)
    });
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

export const getDashboardTargets = async (_req, res) => {
  try {
    const setting = await Settings.findOne({ key: DASHBOARD_TARGETS_KEY });
    const targets = normalizeDashboardTargets(
      setting && setting.value && typeof setting.value === "object"
        ? setting.value
        : {},
    );

    return res.status(200).json({ targets });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch dashboard targets." });
  }
};

export const updateDashboardTargets = async (req, res) => {
  try {
    const incomingTargets =
      req.body && req.body.targets && typeof req.body.targets === "object"
        ? req.body.targets
        : req.body;

    const targets = normalizeDashboardTargets(incomingTargets || {});

    await Settings.findOneAndUpdate(
      { key: DASHBOARD_TARGETS_KEY },
      { key: DASHBOARD_TARGETS_KEY, value: targets },
      { upsert: true, new: true },
    );

    return res.status(200).json({
      message: "Dashboard targets saved successfully.",
      targets,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update dashboard targets." });
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
      message: `Authorization Required:\n\nYou are attempting to update the password for admin: ${targetAdmin.firstName} ${targetAdmin.middleName ? targetAdmin.middleName + ' ' : ''}${targetAdmin.lastName}${targetAdmin.suffix ? ' ' + targetAdmin.suffix : ''} (${targetAdmin.email}).\n\nYour Verification OTP is: ${otpCode}\n\nIf you did not request this, please secure your account immediately.`
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
    const { firstName, lastName, middleName, suffix, email, password, otp, assignedShift, status } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ message: "Admin not found." });

    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (middleName !== undefined) admin.middleName = middleName;
    if (suffix !== undefined) admin.suffix = suffix;
    if (email) admin.email = email.toLowerCase();

    if (status !== undefined) {
      const normalizedStatus = String(status).trim();
      if (!["Active", "Inactive"].includes(normalizedStatus)) {
        return res.status(400).json({ message: "Invalid status value." });
      }
      if (admin.role === "superadmin") {
        return res.status(403).json({ message: "Super Admin status cannot be changed." });
      }
      admin.status = normalizedStatus;
    }

    if (assignedShift !== undefined) {
      const normalizedShift = normalizeAssignedShift(assignedShift);
      if (admin.role !== "superadmin") {
        if (!normalizedShift) {
          return res.status(400).json({ message: "A valid assigned shift is required." });
        }

        const duplicateShift = await Admin.findOne({
          _id: { $ne: admin._id },
          role: admin.role,
          assignedShift: normalizedShift,
        });

        if (duplicateShift) {
          return res.status(409).json({
            message: `Shift ${normalizedShift} is already assigned for ${admin.role}.`,
          });
        }
      }

      admin.assignedShift = admin.role === "superadmin" ? null : normalizedShift;
    }

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

    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) return res.status(401).json({ message: "Invalid credentials." });

    if (admin.status === "Inactive") {
      return res.status(403).json({ message: "Account is inactive. Please contact Super Admin." });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ 
        message: "Invalid credentials.", 
        showReset: admin.role === 'superadmin' 
      });
    }

    // NEW: Conditional 2FA Logic
    const deviceFingerprint = getDeviceFingerprint(req);
    const isKnownDevice = admin.knownDevices && admin.knownDevices.includes(deviceFingerprint);

    if (isKnownDevice) {
      // Known device! Skip OTP, issue JWT directly.
      const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
      return res.json({ 
        message: "Login successful.", 
        requiresOtp: false, 
        token, 
        admin: sanitizeAdmin(admin) 
      });
    }

    // Unknown device -> Trigger OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    admin.otpCode = otpCode;
    admin.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); 
    await admin.save();

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await sendEmail({
        email: admin.email,
        subject: "New Device Login Attempt - OTP",
        message: `We detected a login from an unrecognized device. Your login OTP is ${otpCode}. It expires in 5 minutes.`,
      });
    }

    return res.json({ message: "OTP sent to your email.", requiresOtp: true });
  } catch (error) {
    console.error("🚨 CRASH IN LOGIN ROUTE:", error); // <-- Add this line!
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
};

export const verifyAdminOtp = async (req, res) => {
  try {
    const { email, otp, isRecoveryCode } = req.body; // Added isRecoveryCode flag
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) return res.status(401).json({ message: "Invalid request." });

    // NEW: Handle Superadmin Recovery Code usage
    if (isRecoveryCode && admin.role === 'superadmin') {
      let codeMatched = false;
      let matchedIndex = -1;

      for (let i = 0; i < admin.recoveryCodes.length; i++) {
        if (await bcrypt.compare(otp, admin.recoveryCodes[i])) {
          codeMatched = true;
          matchedIndex = i;
          break;
        }
      }

      if (!codeMatched) return res.status(401).json({ message: "Invalid recovery code." });

      // Remove the used recovery code so it can't be used again
      admin.recoveryCodes.splice(matchedIndex, 1);
    } else {
      // Standard OTP Flow
      if (!admin.otpCode || admin.otpCode !== otp) return res.status(401).json({ message: "Invalid or expired OTP." });
      if (new Date() > admin.otpExpiresAt) return res.status(401).json({ message: "OTP has expired." });
    }

    // NEW: Save the new device fingerprint
    const deviceFingerprint = getDeviceFingerprint(req);
    if (!admin.knownDevices) admin.knownDevices = [];
    if (!admin.knownDevices.includes(deviceFingerprint)) {
      admin.knownDevices.push(deviceFingerprint);
    }

    // Clear OTP states
    admin.otpCode = undefined;
    admin.otpExpiresAt = undefined;
    await admin.save();

    // NEW: Issue JWT Token
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.json({ message: "Login successful.", token, admin: sanitizeAdmin(admin) });
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
};

export const generateNewRecoveryCodes = async (req, res) => {
  try {
    // req.user is set by your verifyToken middleware
    const adminId = req.user.id; 
    const { currentPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ message: "Your current password is required." });
    }

    const admin = await Admin.findById(adminId);
    
    // Extra safety: only superadmins can have recovery codes
    if (!admin || admin.role !== 'superadmin') {
       return res.status(403).json({ message: "Unauthorized. Super Admin access required." });
    }

    // Verify they know the current password
    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    // Generate 5 brand new codes
    let plainTextRecoveryCodes = [];
    let hashedRecoveryCodes = [];

    for (let i = 0; i < 5; i++) {
      const code = crypto.randomBytes(4).toString('hex');
      plainTextRecoveryCodes.push(code);
      hashedRecoveryCodes.push(await bcrypt.hash(code, 10));
    }

    // Overwrite the old array with the new hashes
    admin.recoveryCodes = hashedRecoveryCodes;
    await admin.save();

    return res.json({
      message: "Recovery codes generated successfully.",
      recoveryCodes: plainTextRecoveryCodes // Send plain text ONCE
    });

  } catch (error) {
    console.error("Generate Codes Error:", error);
    return res.status(500).json({ message: "Failed to generate recovery codes." });
  }
};

export const getRecoveryCodeCount = async (req, res) => {
  try {
    const adminId = req.user.id;
    const admin = await Admin.findById(adminId);

    // Only superadmins should have access to this
    if (!admin || admin.role !== 'superadmin') {
      return res.status(403).json({ message: "Unauthorized." });
    }

    // Return the length of the array
    const count = admin.recoveryCodes ? admin.recoveryCodes.length : 0;
    return res.json({ count });
  } catch (error) {
    console.error("Fetch Count Error:", error);
    return res.status(500).json({ message: "Failed to fetch code count." });
  }
};