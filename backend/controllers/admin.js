import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import Adminmodel from "../model/admin.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();



// MAILER SETUP + OTP SENDER

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,      // backend env vars
    pass: process.env.GMAIL_APP_PASS,
  },
});

async function sendOtpMail(name, email, otp) {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: `Verify Your Email -Admin Portal`,
      html: `
        <h2>Welcome, Admin. ${name} 🎓</h2>
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

function generateToken(admin) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }

  return jwt.sign(
    {
      id: admin._id,
      email: admin.email,
      role: admin.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}


// AUTH ROUTES

const Adminrouter = express.Router();

/**
 * POST /api/auth/register
 * - Registers admin (unverified)
 * - Generates OTP & expiry
 * - Sends OTP email
 */
Adminrouter.post("/register", async (req, res) => {
  try {
    const { Adminname, email, password, image } = req.body;

    if (!Adminname || !email || !password || !image) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Generate OTP and expiry (10 minutes)
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    let admin = await Adminmodel.findOne({ email });

    if (admin) {
      if (admin.isVerified) {
        return res.status(400).json({
          success: false,
          message: "Admin already exists",
        });
      } else {
        // Exists but not verified: update details & resend OTP
        admin.Adminname = Adminname;
        admin.password = password; // will be hashed by pre-save
        admin.image = image;
        admin.VerifyCode = otp;
        admin.VerifyCodeExpiry = otpExpiry;

        await admin.save();
        await sendOtpMail(Adminname, email, otp);

        return res.status(200).json({
          success: true,
          message: "OTP resent. Please verify your email.",
          userId: admin._id,
        });
      }
    } else {
      // New admin
      admin = await Adminmodel.create({
        Adminname,
        email,
        password,
        image,
        isVerified: false,
        VerifyCode: otp,
        VerifyCodeExpiry: otpExpiry,
      });

      await sendOtpMail(Adminname, email, otp);

      return res.status(200).json({
        success: true,
        message: "Admin registered successfully. OTP sent to email.",
        userId: admin._id,
      });
    }
  } catch (error) {
    console.error("Error during admin registration:", error);
    return res.status(500).json({
      success: false,
      message: "Error registering admin",
    });
  }
});

/**
 * PUT /api/auth/verify-otp
 * - Verifies OTP
 * - Marks admin as verified
 * - Returns JWT
 */
Adminrouter.put("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("Verify OTP:", email, otp);

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const admin = await Adminmodel.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (admin.isVerified) {
      const token = generateToken(admin);
      return res.status(200).json({
        success: true,
        message: "Admin already verified",
        token,
      });
    }
  
    if (
      admin.VerifyCode?.toString() !== otp.toString() 
     
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    admin.isVerified = true;
    admin.VerifyCode = undefined;
    admin.VerifyCodeExpiry = undefined;
    await admin.save();

    const token = generateToken(admin);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      token,
    });
  } catch (error) {
    console.error("Error verifying admin OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying OTP",
    });
  }
});

/**
 * POST /api/auth/login
 * - Checks credentials
 * - Requires verified email
 * - Returns JWT
 */
// LOGIN - POST /api/auth/login
Adminrouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // find admin by email
    const admin = await Adminmodel.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // compare password -> use the same variable name (admin)
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!admin.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Email not verified. Please verify with OTP.",
      });
    }

    const token = generateToken(admin);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Error logging in admin:", error);
    return res.status(500).json({
      success: false,
      message: "Error logging in",
    });
  }
});


Adminrouter.get("/all-admins", async (req, res) => {
  try {
    const admins = await Adminmodel.find({}, '-password -VerifyCode -VerifyCodeExpiry');    
    return res.status(200).json({
      success: true,
      admins,
    });
  }
  catch (error) {
    console.error("Error fetching admins:", error);
    return res.status(500).json({   
      success: false,
      message: "Error fetching admins",
    });
  }
});

Adminrouter.get("/dashboard/stats", async (req, res) => {
  try {
    const totalEmployees = await import("../model/employ.js").then(m => m.default.countDocuments({}));
    // Mock other stats for now until those modules are fully integrated
    const presentToday = 0; 
    const pendingLeaves = 0;
    const onLeaveToday = 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalEmployees,
        presentToday,
        pendingLeaves,
        onLeaveToday
      }
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching dashboard stats",
    });
  }
});

export default Adminrouter;
