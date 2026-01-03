import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import Employmodel from "../model/employ.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { protect, adminOnly } from "../middleware/auth.js";
dotenv.config();

// Company prefix for employee ID
const COMPANY_PREFIX = "OI"; // Odoo India

// MAILER SETUP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

async function sendOtpMail(name, email, otp) {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: `Verify Your Email - Employee Portal`,
      html: `
        <h2>Welcome, ${name} 🎓</h2>
        <p>To complete your registration, please use the OTP below:</p>
        <h3 style="color:blue; font-size:22px;">${otp}</h3>
        <p>This OTP is valid for <b>10 minutes</b>. If you did not request this, please ignore.</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("Email send error:", error);
    throw error;
  }
}

// Send welcome email with credentials
async function sendWelcomeEmail(name, email, employeeId, password) {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: `Welcome to Dayflow HRMS - Your Account Details`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Welcome to Dayflow HRMS! 🎉</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your employee account has been created successfully. Below are your login credentials:</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Employee ID:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${employeeId}</code></p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 8px 0;"><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${password}</code></p>
          </div>
          
          <p style="color: #dc2626;"><strong>⚠️ Important:</strong> Please change your password after your first login.</p>
          
          <p>You can login at: <a href="http://localhost:3000/auth/login">Dayflow HRMS Portal</a></p>
          
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Welcome email sent:", info.response);
    return info;
  } catch (error) {
    console.error("Welcome email error:", error);
    throw error;
  }
}

// Generate random password
function generatePassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Generate Employee ID
async function generateEmployeeId(firstName, lastName) {
  const year = new Date().getFullYear();
  
  // Get first 2 letters of first name and last name (uppercase)
  const firstNameLetters = firstName.substring(0, 2).toUpperCase();
  const lastNameLetters = lastName.substring(0, 2).toUpperCase();
  
  // Get count of employees registered this year
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year + 1, 0, 1);
  
  const count = await Employmodel.countDocuments({
    createdAt: { $gte: startOfYear, $lt: endOfYear }
  });
  
  // Serial number padded to 4 digits
  const serialNumber = String(count + 1).padStart(4, '0');
  
  // Format: OI + FirstNameLetters + LastNameLetters + Year + SerialNumber
  // Example: OIJODO20220001
  return `${COMPANY_PREFIX}${firstNameLetters}${lastNameLetters}${year}${serialNumber}`;
}

// JWT GENERATOR
function generateToken(employee) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }

  return jwt.sign(
    {
      id: employee._id,
      email: employee.email,
      role: employee.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

const employRouter = express.Router();

/**
 * POST /employ/create
 * Admin-only: Create new employee with auto-generated ID and password
 */
employRouter.post("/create", protect, adminOnly, async (req, res) => {
  try {
    const { Employname, email, phone, image, department, position, employmentType } = req.body;

    // Validation
    if (!Employname || !email) {
      return res.status(400).json({
        success: false,
        message: "Employee name and email are required",
      });
    }

    // Check if employee already exists
    const existingEmployee = await Employmodel.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: "Employee with this email already exists",
      });
    }

    // Parse first and last name
    const nameParts = Employname.trim().split(' ');
    const firstName = nameParts[0] || 'XX';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'XX';

    // Generate Employee ID and Password
    const employeeId = await generateEmployeeId(firstName, lastName);
    const generatedPassword = generatePassword(10);

    // Create employee
    const employee = await Employmodel.create({
      Employname,
      email,
      password: generatedPassword,
      phone,
      image: image || '',
      employeeId,
      department,
      position,
      employmentType: employmentType || 'full-time',
      joiningDate: new Date(),
      isVerified: true, // Admin-created employees are pre-verified
      role: 'employ',
    });

    // Send welcome email with credentials (non-blocking)
    sendWelcomeEmail(Employname, email, employeeId, generatedPassword)
      .catch(emailError => console.error("Failed to send welcome email:", emailError));

    return res.status(201).json({
      success: true,
      message: "Employee created successfully. Credentials sent to email.",
      employee: {
        _id: employee._id,
        Employname: employee.Employname,
        email: employee.email,
        employeeId: employee.employeeId,
        phone: employee.phone,
        department: employee.department,
        position: employee.position,
      },
      // Only show password in response for admin reference (not recommended in production)
      temporaryPassword: generatedPassword,
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating employee",
      error: error.message,
    });
  }
});

/**
 * POST /employ/register
 * Self-registration (keeping for backward compatibility, but could be disabled)
 */
employRouter.post("/register", async (req, res) => {
  try {
    const { Employname, email, password, image } = req.body;

    if (!Employname || !email || !password || !image) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    let employee = await Employmodel.findOne({ email });

    if (employee) {
      if (employee.isVerified) {
        return res.status(400).json({
          success: false,
          message: "Employee already exists",
        });
      } else {
        // Update details & resend OTP
        employee.Employname = Employname;
        employee.password = password;
        employee.image = image;
        employee.VerifyCode = otp;
        employee.VerifyCodeExpiry = otpExpiry;

        await employee.save();
        await sendOtpMail(Employname, email, otp);

        return res.status(200).json({
          success: true,
          message: "OTP resent. Please verify your email.",
          userId: employee._id,
        });
      }
    } else {
      employee = await Employmodel.create({
        Employname,
        email,
        password,
        image,
        isVerified: false,
        VerifyCode: otp,
        VerifyCodeExpiry: otpExpiry,
      });

      await sendOtpMail(Employname, email, otp);

      return res.status(200).json({
        success: true,
        message: "Employee registered successfully. OTP sent to email.",
        userId: employee._id,
      });
    }
  } catch (error) {
    console.error("Error during employee registration:", error);
    return res.status(500).json({
      success: false,
      message: "Error registering employee",
    });
  }
});

/**
 * PUT /employ/verify-otp
 * Verify OTP for employee
 */
employRouter.put("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const employee = await Employmodel.findOne({ email });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (employee.isVerified) {
      const token = generateToken(employee);
      return res.status(200).json({
        success: true,
        message: "Employee already verified",
        token,
      });
    }

    if (employee.VerifyCode?.toString() !== otp.toString()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    employee.isVerified = true;
    employee.VerifyCode = undefined;
    employee.VerifyCodeExpiry = undefined;
    await employee.save();

    const token = generateToken(employee);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      token,
    });
  } catch (error) {
    console.error("Error verifying employee OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying OTP",
    });
  }
});

/**
 * POST /employ/login
 * Employee login
 */
employRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const employee = await Employmodel.findOne({ email });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!employee.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Email not verified. Please verify with OTP.",
      });
    }

    const token = generateToken(employee);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Error logging in employee:", error);
    return res.status(500).json({
      success: false,
      message: "Error logging in",
    });
  }
});

/**
 * GET /employ/all
 * Get all employees (for admin reference)
 */
employRouter.get("/all", async (req, res) => {
  try {
    const employees = await Employmodel.find({}, '-password -VerifyCode -VerifyCodeExpiry');
    return res.status(200).json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching employees",
    });
  }
});

export default employRouter;
