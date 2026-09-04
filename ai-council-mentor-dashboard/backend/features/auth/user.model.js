// User schema for authentication and ownership of created agents.
import mongoose  from "mongoose";
const userSchema = new mongoose.Schema(
  {
    // Unique username + email used for login and identity.
    username: { type: String, required: true, unique: true, trim: true },       
    email: { type: String, required: true, unique: true, trim: true },
    // Password is stored as a string (hashing should happen before save).
    password: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);
const User = mongoose.model("User", userSchema);

export default User;
