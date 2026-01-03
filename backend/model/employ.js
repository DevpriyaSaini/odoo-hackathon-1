import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

const documentSchema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String }, // resume, id, certificate, etc.
  uploadedAt: { type: Date, default: Date.now },
});

const salaryStructureSchema = new Schema({
  basic: { type: Number, default: 0 },
  hra: { type: Number, default: 0 },
  transport: { type: Number, default: 0 },
  medical: { type: Number, default: 0 },
  other: { type: Number, default: 0 },
}, { _id: false });

const employeeSchema = new Schema(
  {
    // ========== Auth Fields ==========
    Employname: {
      type: String,
      required: [true, "Employee name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      validate: {
        validator: function (value) {
          // ✅ Must start with year (4 digits) and end with @iitjammu.ac.in OR @mnit.ac.in
          return /^[0-9]{4}[a-zA-Z0-9._%+-]*@(iitjammu\.ac\.in|mnit\.ac\.in)$/.test(value);
        },
        message: "Email must start with year and end with @iitjammu.ac.in or @mnit.ac.in",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    VerifyCode: {
      type: String,
    },
    VerifyCodeExpiry: {
      type: Date,
    },
    role: {
      type: String,
      enum: ["employ", "employee", "admin"],
      default: "employ",
    },

    // ========== Personal Details ==========
    image: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      country: { type: String, default: "India" },
    },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relation: { type: String },
    },

    // ========== Job Details ==========
    employeeId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values
    },
    department: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
    joiningDate: {
      type: Date,
    },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "intern"],
      default: "full-time",
    },
    reportingTo: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "terminated"],
      default: "active",
    },

    // ========== Salary Structure ==========
    salary: salaryStructureSchema,

    // ========== Documents ==========
    documents: [documentSchema],

    // ========== Leave Balance ==========
    leaveBalance: {
      paid: { type: Number, default: 12 },
      sick: { type: Number, default: 6 },
      unpaid: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Hash password before saving
employeeSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Virtual for full address
employeeSchema.virtual("fullAddress").get(function () {
  if (!this.address) return "";
  const { street, city, state, pincode, country } = this.address;
  return [street, city, state, pincode, country].filter(Boolean).join(", ");
});

// Virtual for total salary
employeeSchema.virtual("totalSalary").get(function () {
  if (!this.salary) return 0;
  const { basic, hra, transport, medical, other } = this.salary;
  return (basic || 0) + (hra || 0) + (transport || 0) + (medical || 0) + (other || 0);
});

// Exclude sensitive fields in JSON
employeeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.VerifyCode;
  delete obj.VerifyCodeExpiry;
  return obj;
};

const Employmodel = mongoose.models.Employee || mongoose.model("Employee", employeeSchema);
export default Employmodel;
