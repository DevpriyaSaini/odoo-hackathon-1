import mongoose from "mongoose";

const employeeProfileSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employ",
      required: true,
      unique: true,
    },

    
    phone: String,
    address: String,
    profilePicture: String,

    
    jobDetails: {
      designation: String,
      department: String,
      joiningDate: Date,
      employmentType: {
        type: String,
        enum: ["full-time", "part-time", "contract"],
      },
    },

  
    salaryStructure: {
      basic: Number,
      hra: Number,
      allowances: Number,
      deductions: Number,
      netSalary: Number,
    },

  
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
