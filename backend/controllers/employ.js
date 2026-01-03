import express from "express";
import Employmodel from "../model/employ.js";
import authMiddleware from "../middleware/auth.js";
import adminOnlyMiddleware from "../middleware/adminOnly.js";

const employeeRouter = express.Router();

// Fields that employees can edit themselves
const EMPLOYEE_EDITABLE_FIELDS = [
  "phone",
  "address",
  "emergencyContact",
  "image",
];

// Fields that only admins can edit
const ADMIN_ONLY_FIELDS = [
  "department",
  "position",
  "joiningDate",
  "employmentType",
  "salary",
  "leaveBalance",
  "status",
  "employeeId",
  "reportingTo",
  "role",
];

/**
 * GET /employees
 * Get all employees (admin only)
 */
employeeRouter.get("/", authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const { status, department, search } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (department) {
      query.department = department;
    }
    
    if (search) {
      query.$or = [
        { Employname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const employees = await Employmodel.find(query)
      .select("-password -VerifyCode -VerifyCodeExpiry")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: employees.length,
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

/**
 * GET /employees/me
 * Get current employee's profile
 */
employeeRouter.get("/me", authMiddleware, async (req, res) => {
  try {
    const employee = await Employmodel.findById(req.user.id)
      .select("-password -VerifyCode -VerifyCodeExpiry")
      .populate("reportingTo", "Employname email position");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching profile",
    });
  }
});

/**
 * GET /employees/:id
 * Get employee by ID (admin or self)
 */
employeeRouter.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin or accessing their own profile
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own profile.",
      });
    }

    const employee = await Employmodel.findById(id)
      .select("-password -VerifyCode -VerifyCodeExpiry")
      .populate("reportingTo", "Employname email position");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    console.error("Error fetching employee:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching employee",
    });
  }
});

/**
 * PUT /employees/:id
 * Update employee (field-level permissions)
 */
employeeRouter.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const isAdmin = req.user.role === "admin";

    // Check permissions
    if (!isAdmin && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only update your own profile.",
      });
    }

    // Filter updates based on role
    const allowedUpdates = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (isAdmin) {
        // Admin can update all fields except password and auth fields
        if (!["password", "VerifyCode", "VerifyCodeExpiry", "isVerified"].includes(key)) {
          allowedUpdates[key] = value;
        }
      } else {
        // Employee can only update specific fields
        if (EMPLOYEE_EDITABLE_FIELDS.includes(key)) {
          allowedUpdates[key] = value;
        }
      }
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    const employee = await Employmodel.findByIdAndUpdate(
      id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select("-password -VerifyCode -VerifyCodeExpiry");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      employee,
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating profile",
    });
  }
});

/**
 * POST /employees
 * Create new employee (admin only)
 */
employeeRouter.post("/", authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const {
      Employname,
      email,
      password,
      department,
      position,
      joiningDate,
      employmentType,
      salary,
      image,
    } = req.body;

    // Validate required fields
    if (!Employname || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
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

    // Generate employee ID
    const count = await Employmodel.countDocuments();
    const employeeId = `EMP${String(count + 1).padStart(4, "0")}`;

    const employee = await Employmodel.create({
      Employname,
      email,
      password,
      employeeId,
      department,
      position,
      joiningDate: joiningDate || new Date(),
      employmentType: employmentType || "full-time",
      salary,
      image,
      isVerified: true, // Admin-created employees are auto-verified
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee: {
        ...employee.toJSON(),
        password: undefined,
      },
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error creating employee",
    });
  }
});

/**
 * DELETE /employees/:id
 * Delete employee (admin only)
 */
employeeRouter.delete("/:id", authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employmodel.findByIdAndDelete(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting employee",
    });
  }
});

export default employeeRouter;
