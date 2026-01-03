import mongoose, { Schema } from "mongoose";

const payrollSchema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    month: {
      type: Number, // 1-12
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    // Earnings
    basic: {
      type: Number,
      default: 0,
    },
    allowances: {
      hra: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      special: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    // Deductions
    deductions: {
      tax: { type: Number, default: 0 },
      pf: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    // Calculated fields
    grossSalary: {
      type: Number,
      default: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
    },
    netSalary: {
      type: Number,
      default: 0,
    },
    // Status
    status: {
      type: String,
      enum: ["pending", "processed", "paid"],
      default: "pending",
    },
    paidOn: {
      type: Date,
    },
    // Working days/hours
    workingDays: {
      type: Number,
      default: 0,
    },
    presentDays: {
      type: Number,
      default: 0,
    },
    // Notes
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

// Compound index for unique month/year per employee
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

// Calculate totals before saving
payrollSchema.pre("save", function () {
  // Calculate gross salary
  const allowanceTotal = Object.values(this.allowances || {}).reduce((a, b) => a + (b || 0), 0);
  this.grossSalary = (this.basic || 0) + allowanceTotal;
  
  // Calculate total deductions
  this.totalDeductions = Object.values(this.deductions || {}).reduce((a, b) => a + (b || 0), 0);
  
  // Calculate net salary
  this.netSalary = this.grossSalary - this.totalDeductions;
});

const Payroll = mongoose.models.Payroll || mongoose.model("Payroll", payrollSchema);
export default Payroll;
