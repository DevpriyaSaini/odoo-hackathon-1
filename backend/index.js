import express from "express";
import adminRoutes from "./controllers/admin.js";
import employeeRoutes from "./controllers/employ.js";
import attendanceRoutes from "./controllers/attendance.js";
import leaveRoutes from "./controllers/leave.js";
import payrollRoutes from "./controllers/payroll.js";

const app = express();
const PORT = process.env.PORT || 4000;
import mongoose from "mongoose";
import cors from "cors";
import 'dotenv/config';

const mongoUrl = process.env.MONGO_URL || "";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:4000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// CSP middleware
app.use((_req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "connect-src 'self' http://localhost:3000 http://localhost:4000 ws://localhost:*; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval';"
  );
  next();
});

const connectdb = async () => {
  try {
    await mongoose.connect(mongoUrl);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.log("❌ Database connection error:", error);
  }
}

// Routes
app.use("/admin", adminRoutes);
app.use("/employees", employeeRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/leaves", leaveRoutes);
app.use("/payroll", payrollRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

connectdb();

app.listen(PORT, () => {
  console.log(`🚀 Dayflow HRMS Server running on port ${PORT}`);
});