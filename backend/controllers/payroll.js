import express from "express";
import Payroll from "../model/payroll.js";
import { protect, adminOnly } from "../middleware/auth.js";

const payrollRouter = express.Router();

/**
 * GET /payroll/me
 * Get own payroll history
 */
payrollRouter.get("/me", protect, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { year, limit = 12 } = req.query;

    let query = { employeeId };
    if (year) {
      query.year = parseInt(year);
    }

    const payroll = await Payroll.find(query)
      .sort({ year: -1, month: -1 })
      .limit(parseInt(limit));

    // Calculate totals
    const totals = payroll.reduce(
      (acc, p) => {
        acc.totalEarnings += p.grossSalary || 0;
        acc.totalDeductions += p.totalDeductions || 0;
        acc.totalNet += p.netSalary || 0;
        return acc;
      },
      { totalEarnings: 0, totalDeductions: 0, totalNet: 0 }
    );

    return res.status(200).json({
      success: true,
      count: payroll.length,
      totals,
      payroll,
    });
  } catch (error) {
    console.error("Error fetching payroll:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching payroll",
    });
  }
});

/**
 * GET /payroll/all
 * Get all payroll records (admin only)
 */
payrollRouter.get("/all", protect, adminOnly, async (req, res) => {
  try {
    const { month, year, status, employeeId } = req.query;

    let query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId;

    const payroll = await Payroll.find(query)
      .populate("employeeId", "Employname email department position")
      .sort({ year: -1, month: -1 });

    // Summary
    const summary = {
      total: payroll.length,
      totalGross: payroll.reduce((sum, p) => sum + (p.grossSalary || 0), 0),
      totalNet: payroll.reduce((sum, p) => sum + (p.netSalary || 0), 0),
      pending: payroll.filter((p) => p.status === "pending").length,
      processed: payroll.filter((p) => p.status === "processed").length,
      paid: payroll.filter((p) => p.status === "paid").length,
    };

    return res.status(200).json({
      success: true,
      summary,
      payroll,
    });
  } catch (error) {
    console.error("Error fetching all payroll:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching payroll",
    });
  }
});

/**
 * POST /payroll
 * Create payroll record (admin only)
 */
payrollRouter.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { employeeId, month, year, basic, allowances, deductions, workingDays, presentDays, notes } = req.body;

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "Employee, month, and year are required",
      });
    }

    // Check if payroll already exists
    const existing = await Payroll.findOne({ employeeId, month, year });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Payroll record already exists for this month",
      });
    }

    const payroll = await Payroll.create({
      employeeId,
      month,
      year,
      basic,
      allowances,
      deductions,
      workingDays,
      presentDays,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Payroll created successfully",
      payroll,
    });
  } catch (error) {
    console.error("Error creating payroll:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating payroll",
    });
  }
});

/**
 * PUT /payroll/:employeeId
 * Update payroll (admin only)
 */
payrollRouter.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove protected fields
    delete updates._id;
    delete updates.employeeId;

    const payroll = await Payroll.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payroll updated successfully",
      payroll,
    });
  } catch (error) {
    console.error("Error updating payroll:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating payroll",
    });
  }
});

/**
 * PUT /payroll/:id/pay
 * Mark payroll as paid (admin only)
 */
payrollRouter.put("/:id/pay", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "paid",
          paidOn: new Date(),
        },
      },
      { new: true }
    );

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payroll marked as paid",
      payroll,
    });
  } catch (error) {
    console.error("Error marking payroll as paid:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating payroll",
    });
  }
});

export default payrollRouter;
