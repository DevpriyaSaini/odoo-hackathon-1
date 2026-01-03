import mongoose, { Schema } from "mongoose";

const leaveSchema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    type: {
      type: String,
      enum: ["paid", "sick", "unpaid"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminComment: {
      type: String,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "Adminodoo",
    },
    reviewedAt: {
      type: Date,
    },
    // Number of days
    duration: {
      type: Number,
    },
  },
  { timestamps: true }
);

// Calculate duration before saving
leaveSchema.pre("save", function () {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    this.duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
});

// Check for overlapping leaves
leaveSchema.statics.hasOverlap = async function (employeeId, startDate, endDate, excludeId) {
  const query = {
    employeeId,
    status: { $ne: "rejected" },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
    ],
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const overlap = await this.findOne(query);
  return !!overlap;
};

const Leave = mongoose.models.Leave || mongoose.model("Leave", leaveSchema);
export default Leave;
