import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import Employmodel from "../model/employ.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();



const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

async function sendOtpMail(name, email, otp) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Verify Your Email - Employ Portal",
    html: `
      <h2>Welcome, ${name} 🎓</h2>
      <p>Your OTP for email verification is:</p>
      <h3 style="color:blue;">${otp}</h3>
      <p>This OTP is valid for <b>10 minutes</b>.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
}



function generateToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}


router.post("/register", async (req, res) => {
  try {
    const { Employname, email, password, image } = req.body;

    if (!Employname || !email || !password || !image) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    let user = await Employmodel.findOne({ email });

    if (user) {
      if (user.isVerified) {
        return res.status(400).json({
          success: false,
          message: "Employ already exists",
        });
      }

      user.Employname = Employname;
      user.password = password;
      user.image = image;
      user.VerifyCode = otp;

      await user.save();
      await sendOtpMail(Employname, email, otp);

      return res.status(200).json({
        success: true,
        message: "OTP resent. Please verify your email.",
      });
    }

    user = await Employmodel.create({
      Employname,
      email,
      password,
      image,
      VerifyCode: otp,
    });

    await sendOtpMail(Employname, email, otp);

    res.status(201).json({
      success: true,
      message: "Employ registered. OTP sent to email.",
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});


router.put("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await Employmodel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employ not found",
      });
    }

    if (user.VerifyCode !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.isVerified = true;
    user.VerifyCode = undefined;
    await user.save();

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      token,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Employmodel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employ not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Email not verified",
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});


router.get("/all-employs", async (req, res) => {
  try {
    const employs = await Employmodel.find(
      {},
      "-password -VerifyCode"
    );

    res.status(200).json({
      success: true,
      employs,
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employs",
    });
  }
});

export default router;
