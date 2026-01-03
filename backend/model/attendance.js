import mongoose, { Schema } from "mongoose";

const attendanceSchema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      time: { type: Date },
      location: { type: String },
      ip: { type: String },
    },
    checkOut: {
      time: { type: Date },
      location: { type: String },
      ip: { type: String },
    },
    status: {
      type: String,
      enum: ["present", "absent", "half-day", "leave", "weekend", "holiday"],
      default: "absent",
    },
    workHours: {
      type: Number, // in minutes
      default: 0,
    },
    notes: {
      type: String,
    },
    // For admin override
    overriddenBy: {
      type: Schema.Types.ObjectId,
      ref: "Adminodoo",
    },
    overrideReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// Compound index to ensure one attendance record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Calculate work hours on checkout
attendanceSchema.pre("save", function () {
  if (this.checkIn?.time && this.checkOut?.time) {
    const diffMs = this.checkOut.time - this.checkIn.time;
    this.workHours = Math.round(diffMs / (1000 * 60)); // Convert to minutes
    
    // Determine status based on work hours
    if (this.workHours >= 360) { // 6+ hours = present
      this.status = "present";
    } else if (this.workHours >= 180) { // 3+ hours = half-day
      this.status = "half-day";
    }
  }
});

// Static method to get today's date normalized
attendanceSchema.statics.getTodayDate = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Static method to check if already checked in today
attendanceSchema.statics.getTodayRecord = async function (employeeId) {
  const today = this.getTodayDate();
  return await this.findOne({
    employeeId,
    date: today,
  });
};

const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
export default Attendance;
