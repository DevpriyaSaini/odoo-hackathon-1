import express from "express";
import EmployeeProfile from "../model/employ-profile.js";
import Employee from "../model/employ.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { uploadProfile, deleteImage, getPublicIdFromUrl } from "../config/cloudinary.js";

const EmployeeProfileRouter = express.Router();

// Upload/Update profile picture
EmployeeProfileRouter.post(
  "/profile/picture",
  protect,
  uploadProfile.single("profilePicture"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file provided",
        });
      }

      // Find existing profile to get old image URL
      const existingProfile = await EmployeeProfile.findOne({
        employee: req.user.id,
      });

      // Delete old profile picture from Cloudinary if exists
      if (existingProfile?.profilePicture) {
        const oldPublicId = getPublicIdFromUrl(existingProfile.profilePicture);
        if (oldPublicId) {
          try {
            await deleteImage(oldPublicId);
          } catch (err) {
            console.error("Failed to delete old profile picture:", err);
          }
        }
      }

      // Update or create profile with new picture URL
      const imageUrl = req.file.path;
      
      let profile;
      if (existingProfile) {
        profile = await EmployeeProfile.findOneAndUpdate(
          { employee: req.user.id },
          { profilePicture: imageUrl },
          { new: true }
        );
      } else {
        profile = await EmployeeProfile.create({
          employee: req.user.id,
          profilePicture: imageUrl,
        });
      }

      res.status(200).json({
        success: true,
        message: "Profile picture uploaded successfully",
        profilePicture: imageUrl,
        profile,
      });
    } catch (error) {
      console.error("Profile picture upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload profile picture",
        error: error.message,
      });
    }
  }
);


// Get all employee profiles (admin only)
EmployeeProfileRouter.get("/profiles", protect, adminOnly, async (req, res) => {
  try {
    const profiles = await EmployeeProfile.find()
      .populate("employee", "Employname email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: profiles.length,
      profiles,
    });
  } catch (error) {
    console.error("Get all profiles error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profiles",
    });
  }
});


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
    // All editable fields except salaryStructure (admin-only)
    const allowedFields = [
      "phone",
      "address",
      "profilePicture",
      "dateOfBirth",
      "nationality",
      "personalEmail",
      "gender",
      "maritalStatus",
      "jobDetails",
      "bankDetails",
      "documents",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
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

// Get specific employee profile (admin only)
EmployeeProfileRouter.get(
  "/profile/:id",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      let userId = req.params.id;

      // Check if it's a valid MongoDB ObjectId
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(userId);

      if (!isMongoId) {
        // Try finding employee by custom employeeId
        const user = await Employee.findOne({ employeeId: userId });
        if (!user) {
          return res.status(404).json({
            success: false,
            message: "Employee not found with this ID",
          });
        }
        userId = user._id;
      }

      const profile = await EmployeeProfile.findOne({
        employee: userId,
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
      console.error("Get specific profile error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch profile",
      });
    }
  }
);

EmployeeProfileRouter.put(
  "/profile/:id",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      let userId = req.params.id;

      // Check if it's a valid MongoDB ObjectId
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(userId);

      if (!isMongoId) {
        // Try finding employee by custom employeeId
        const user = await Employee.findOne({ employeeId: userId });
        if (!user) {
          return res.status(404).json({
            success: false,
            message: "Employee not found with this ID",
          });
        }
        userId = user._id;
      }

      const updatedProfile = await EmployeeProfile.findOneAndUpdate(
        { employee: userId },
        req.body,
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      // Also update the main Employee model salary fields for backward compatibility
      if (req.body.salaryStructure) {
        const salaryUpdate = {
          "salary.basic": req.body.salaryStructure.basic,
          "salary.hra": req.body.salaryStructure.hra,
          "salary.other": req.body.salaryStructure.netSalary // Storing net as other for now or just generic allowance
        };
        await Employee.findByIdAndUpdate(userId, { $set: salaryUpdate });
      }

      res.status(200).json({
        success: true,
        message: "Employee profile updated by admin",
        profile: updatedProfile,
        employeeUpdated: true
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
