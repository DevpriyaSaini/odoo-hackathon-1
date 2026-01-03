import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";



const userSchema = new Schema(
  {
    Employname: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
      
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
     validate: {
        validator: function (value) {
          // ✅ Must start with year (4 digits) and end with @iitjammu.ac.in
          return /^[0-9]{4}[a-zA-Z0-9._%+-]*@iitjammu\.ac\.in$/.test(value);
        },
        message:
          "Email must start with year (e.g., 2024xxxx) and end with @iitjammu.ac.in",
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
    image: {
      type: String,
      required: [true, "Image is required"],
    },
    VerifyCode: {
      type: String,
    },
    
    role: {
      type: String,
      default: "employ",
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});


const Employmodel = mongoose.models.employ || mongoose.model("employ", userSchema);
export default Employmodel;
