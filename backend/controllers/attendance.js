import express from "express";
import Attendance from "../model/attendance.js";
import authMiddleware from "../middleware/auth.js";
import adminOnlyMiddleware from "../middleware/adminOnly.js";

const attendanceRouter = express.Router();

/**
 * POST /attendance/check-in
 * Mark check-in for the day
 */
attendanceRouter.post("/check-in", authMiddleware, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    let attendance = await Attendance.findOne({
      employeeId,
      date: today,
    });

    if (attendance && attendance.checkIn?.time) {
      return res.status(400).json({
        success: false,
        message: "You have already checked in today",
        checkInTime: attendance.checkIn.time,
      });
    }

    const now = new Date();

    if (attendance) {
      // Update existing record
      attendance.checkIn = {
        time: now,
        ip: req.ip,
      };
      attendance.status = "present";
      await attendance.save();
    } else {
      // Create new attendance record
      attendance = await Attendance.create({
        employeeId,
        date: today,
        checkIn: {
          time: now,
          ip: req.ip,
        },
        status: "present",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Check-in successful",
      attendance: {
        date: attendance.date,
        checkInTime: attendance.checkIn.time,
        status: attendance.status,
      },
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return res.status(500).json({
      success: false,
      message: "Error during check-in",
    });
  }
});

/**
 * POST /attendance/check-out
 * Mark check-out for the day
 */
attendanceRouter.post("/check-out", authMiddleware, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId,
      date: today,
    });

    if (!attendance || !attendance.checkIn?.time) {
      return res.status(400).json({
        success: false,
        message: "You haven't checked in today",
      });
    }

    if (attendance.checkOut?.time) {
      return res.status(400).json({
        success: false,
        message: "You have already checked out today",
        checkOutTime: attendance.checkOut.time,
      });
    }

    const now = new Date();
    attendance.checkOut = {
      time: now,
      ip: req.ip,
    };

    // Calculate work hours
    const diffMs = now - attendance.checkIn.time;
    attendance.workHours = Math.round(diffMs / (1000 * 60));

    // Determine status
    if (attendance.workHours >= 360) {
      attendance.status = "present";
    } else if (attendance.workHours >= 180) {
      attendance.status = "half-day";
    }

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Check-out successful",
      attendance: {
        date: attendance.date,
        checkInTime: attendance.checkIn.time,
        checkOutTime: attendance.checkOut.time,
        workHours: attendance.workHours,
        status: attendance.status,
      },
    });
  } catch (error) {
    console.error("Check-out error:", error);
    return res.status(500).json({
      success: false,
      message: "Error during check-out",
    });
  }
});

/**
 * GET /attendance/today
 * Get today's attendance status
 */
attendanceRouter.get("/today", authMiddleware, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId,
      date: today,
    });

    return res.status(200).json({
      success: true,
      attendance: attendance || null,
      checkedIn: !!attendance?.checkIn?.time,
      checkedOut: !!attendance?.checkOut?.time,
    });
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching attendance",
    });
  }
});

/**
 * GET /attendance/me
 * Get own attendance history
 */
attendanceRouter.get("/me", authMiddleware, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { startDate, endDate, limit = 30 } = req.query;

    let query = { employeeId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit));

    // Calculate summary
    const summary = attendance.reduce(
      (acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        acc.totalHours += record.workHours || 0;
        return acc;
      },
      { present: 0, absent: 0, "half-day": 0, leave: 0, totalHours: 0 }
    );

    return res.status(200).json({
      success: true,
      count: attendance.length,
      summary,
      attendance,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching attendance",
    });
  }
});

/**
 * GET /attendance/all
 * Get all employees' attendance (admin only)
 */
attendanceRouter.get("/all", authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const { date, startDate, endDate, status, employeeId } = req.query;

    let query = {};

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      query.date = targetDate;
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = today;
    }

    if (status) {
      query.status = status;
    }

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const attendance = await Attendance.find(query)
      .populate("employeeId", "Employname email department position image")
      .sort({ date: -1, "checkIn.time": -1 });

    // Summary statistics
    const summary = {
      total: attendance.length,
      present: attendance.filter((a) => a.status === "present").length,
      absent: attendance.filter((a) => a.status === "absent").length,
      halfDay: attendance.filter((a) => a.status === "half-day").length,
      onLeave: attendance.filter((a) => a.status === "leave").length,
    };

    return res.status(200).json({
      success: true,
      summary,
      attendance,
    });
  } catch (error) {
    console.error("Error fetching all attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching attendance",
    });
  }
});

/**
 * PUT /attendance/:id
 * Override attendance (admin only)
 */
attendanceRouter.put("/:id", authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, checkIn, checkOut } = req.body;

    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    // Update fields
    if (status) attendance.status = status;
    if (notes) attendance.notes = notes;
    if (checkIn) attendance.checkIn = { ...attendance.checkIn, ...checkIn };
    if (checkOut) attendance.checkOut = { ...attendance.checkOut, ...checkOut };

    attendance.overriddenBy = req.user.id;
    attendance.overrideReason = req.body.overrideReason || "Admin override";

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      attendance,
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating attendance",
    });
  }
});

export default attendanceRouter;
