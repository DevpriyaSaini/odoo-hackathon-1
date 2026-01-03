import mongoose from "mongoose";

const employeeProfileSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true,
    },

    // Personal Information
    phone: String,
    address: String,
    profilePicture: String,
    dateOfBirth: Date,
    nationality: { type: String, default: "Indian" },
    personalEmail: String,
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
    },
    maritalStatus: {
      type: String,
      enum: ["single", "married", "divorced", "widowed", ""],
    },

    // Job Details
    jobDetails: {
      designation: String,
      department: String,
      joiningDate: Date,
      employmentType: {
        type: String,
        enum: ["full-time", "part-time", "contract"],
      },
    },

    // Bank Details
    bankDetails: {
      bankName: String,
      accountNumber: String,
      panNo: String,
      uamNo: String,
      empCode: String,
    },

    // Salary Structure (Admin only - not editable by employee)
    salaryStructure: {
      basic: Number,
      hra: Number,
      allowances: Number,
      deductions: Number,
      netSalary: Number,
    },

    // Documents
    documents: {
      aadhaar: String,
      pan: String,
      resume: String,
    },
  },
  { timestamps: true }
);

const EmployeeProfile =
  mongoose.models.employeeProfile ||
  mongoose.model("employeeProfile", employeeProfileSchema);

export default EmployeeProfile;
