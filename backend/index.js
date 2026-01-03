import express, { Router } from "express";
import adminRoutes from "./controllers/admin.js";
import employRoutes from "./controllers/employ.js";
const app = express();
const PORT = process.env.PORT || 4000;
import mongoose from "mongoose";
import cors from "cors";
import 'dotenv/config';





const mongoUrl=process.env.MONGO_URL||"";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration - MUST be before routes
app.use(cors({
  origin: [ 'http://localhost:3000', 'http://localhost:4000'],
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

const connectdb=async ()=>{
   try {
    await mongoose.connect(mongoUrl);
    console.log("mongo connected");

    // Start cron jobs after database connection (with error handling)
    try {
      
      console.log("✅ Cron jobs initialization completed");
    } catch (cronError) {
      console.error("⚠️ Cron jobs failed to start, but server will continue:", cronError.message);
      // Server continues even if cron fails
    }

   } catch (error) {
    console.log("❌ Database connection error:", error);
   }
}
app.use("/admin",adminRoutes)
app.use("/employ",employRoutes)
app.use("/employ-profile",employProfileRoutes)



connectdb();


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});