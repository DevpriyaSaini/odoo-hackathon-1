import express from "express";
import EmployeeProfile from "../model/employ-profile.js";
import { protect,adminOnly } from "../middleware/auth.js";

const EmployeeProfileRouter = express.Router();


EmployeeProfileRouter.post("/profile", protect, async (req, res) => {
  try {
    const exists = await EmployeeProfile.findOne({
      employee: req.user.id,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Profile already exists",
      });
    }

    const profile = await EmployeeProfile.create({
      employee: req.user.id,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      message: "Employee profile created",
      profile,
    });
  } catch (error) {
    console.error("Create profile error:", error);
    res.status(500).json({
      success: false,
      message: "Profile creation failed",
    });
  }
});


EmployeeProfileRouter.get("/profile", protect, async (req, res) => {
  try {
    const profile = await EmployeeProfile.findOne({
      employee: req.user.id,
    }).populate("employee", "Employname email role");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
});


EmployeeProfileRouter.put("/profile", protect, async (req, res) => {
  try {
    const allowedFields = ["phone", "address", "profilePicture"];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field]) updates[field] = req.body[field];
    });

    const updatedProfile = await EmployeeProfile.findOneAndUpdate(
      { employee: req.user.id },
      updates,
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Profile update failed",
    });
  }
});

EmployeeProfileRouter.put(
  "/profile/:employeeId",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const { employeeId } = req.params;

      const updatedProfile = await EmployeeProfile.findOneAndUpdate(
        { employee: employeeId },
        req.body,
        { new: true }
      );

      if (!updatedProfile) {
        return res.status(404).json({
          success: false,
          message: "Profile not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Employee profile updated by admin",
        profile: updatedProfile,
      });
    } catch (error) {
      console.error("Admin update error:", error);
      res.status(500).json({
        success: false,
        message: "Admin update failed",
      });
    }
  }
);

export default EmployeeProfileRouter;
