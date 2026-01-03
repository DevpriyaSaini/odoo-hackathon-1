import express from "express";
import Leave from "../model/leave.js";
import Employmodel from "../model/employ.js";
import { protect, adminOnly } from "../middleware/auth.js";

const leaveRouter = express.Router();

/**
 * POST /leaves/apply
 * Apply for leave
 */
leaveRouter.post("/apply", protect, async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    const employeeId = req.user.id;

    // Validation
    if (!type || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    if (start < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Cannot apply for past dates",
      });
    }

    // Check for overlapping leaves
    const hasOverlap = await Leave.hasOverlap(employeeId, start, end);
    if (hasOverlap) {
      return res.status(400).json({
        success: false,
        message: "You already have a leave request for these dates",
      });
    }

    // Check leave balance
    const employee = await Employmodel.findById(employeeId);
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    if (employee?.leaveBalance?.[type] < duration && type !== "unpaid") {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${type} leave balance`,
      });
    }

    const leave = await Leave.create({
      employeeId,
      type,
      startDate: start,
      endDate: end,
      reason,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Leave application submitted",
      leave,
    });
  } catch (error) {
    console.error("Error applying for leave:", error);
    return res.status(500).json({
      success: false,
      message: "Error applying for leave",
    });
  }
});

/**
 * GET /leaves/me
 * Get own leave requests
 */
leaveRouter.get("/me", protect, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { status, year } = req.query;

    let query = { employeeId };
    if (status) query.status = status;
    if (year) {
      query.startDate = {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`),
      };
    }

    const leaves = await Leave.find(query)
      .sort({ createdAt: -1 });

    // Calculate summary
    const summary = leaves.reduce(
      (acc, leave) => {
        if (leave.status === "approved") {
          acc[leave.type] = (acc[leave.type] || 0) + leave.duration;
        }
        acc[leave.status] = (acc[leave.status] || 0) + 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );

    const employee = await Employmodel.findById(employeeId).select('leaveBalance');

    return res.status(200).json({
      success: true,
      count: leaves.length,
      summary,
      balance: employee?.leaveBalance,
      leaves,
    });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching leaves",
    });
  }
});

/**
 * GET /leaves/all
 * Get all leave requests (admin only)
 */
leaveRouter.get("/all", protect, adminOnly, async (req, res) => {
  try {
    const { status, employeeId, startDate, endDate } = req.query;

    let query = {};
    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId;
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start)) query.startDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end)) query.startDate.$lte = end;
      }
    }

    const leaves = await Leave.find(query)
      .populate("employeeId", "Employname email department position image")
      .populate("reviewedBy", "Adminname email")
      .sort({ createdAt: -1 });

    // Summary
    const summary = {
      total: leaves.length,
      pending: leaves.filter((l) => l.status === "pending").length,
      approved: leaves.filter((l) => l.status === "approved").length,
      rejected: leaves.filter((l) => l.status === "rejected").length,
    };

    return res.status(200).json({
      success: true,
      summary,
      leaves,
    });
  } catch (error) {
    console.error("Error fetching all leaves:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching leaves",
    });
  }
});

/**
 * PUT /leaves/:id/approve
 * Approve leave request (admin only)
 */
leaveRouter.put("/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Leave request has already been processed",
      });
    }

    // Update leave status
    leave.status = "approved";
    leave.adminComment = comment;
    leave.reviewedBy = req.user.id;
    leave.reviewedAt = new Date();
    await leave.save();

    // Deduct from leave balance
    if (leave.type !== "unpaid") {
      await Employmodel.findByIdAndUpdate(leave.employeeId, {
        $inc: { [`leaveBalance.${leave.type}`]: -leave.duration },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Leave approved successfully",
      leave,
    });
  } catch (error) {
    console.error("Error approving leave:", error);
    return res.status(500).json({
      success: false,
      message: "Error approving leave",
    });
  }
});

/**
 * PUT /leaves/:id/reject
 * Reject leave request (admin only)
 */
leaveRouter.put("/:id/reject", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Leave request has already been processed",
      });
    }

    leave.status = "rejected";
    leave.adminComment = comment || "Rejected by admin";
    leave.reviewedBy = req.user.id;
    leave.reviewedAt = new Date();
    await leave.save();

    return res.status(200).json({
      success: true,
      message: "Leave rejected",
      leave,
    });
  } catch (error) {
    console.error("Error rejecting leave:", error);
    return res.status(500).json({
      success: false,
      message: "Error rejecting leave",
    });
  }
});

export default leaveRouter;
