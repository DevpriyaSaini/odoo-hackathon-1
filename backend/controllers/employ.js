import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import Employmodel from "../model/employ.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

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
 * POST /employ/register
 * Register new employee
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
