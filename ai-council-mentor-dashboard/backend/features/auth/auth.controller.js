/**
 * Auth Controller
 * WHY: Handle user registration, login, and session management
 * HOW: Hash passwords, verify credentials, issue JWT tokens, manage user data
 * RESULT: Auth tokens and user profile for authenticated API access
 */

import User from "./user.model.js";
import { hashPassword, issueToken, verifyPassword } from "./auth.utils.js";

/**
 * register - Create new user account
 * WHY: Allow new users to access the system
 * HOW: Validate input, hash password, check for duplicates, create user record
 * RESULT: JWT token and user object for immediate authenticated session
 */
export async function register(req, res) {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ message: "username, email and password are required." });
    if (String(password).length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });
    const exists = await User.findOne({ $or: [{ email: String(email).toLowerCase() }, { username: String(username).trim() }] });
    if (exists) return res.status(409).json({ message: "User already exists." });
    const user = await User.create({ username: String(username).trim(), email: String(email).toLowerCase().trim(), password: hashPassword(password) });
    const token = issueToken(user);
    return res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) { console.error("Auth register failed:", error); return res.status(500).json({ message: "Registration failed.", error: error.message }); }
}


/**
 * login - Authenticate user and issue session token
 * WHY: Verify user identity and start authenticated sessions
 * HOW: Lookup user by email/username, verify password hash, issue JWT
 * RESULT: JWT token for authenticated requests, user profile data
 */
export async function login(req, res) {
  try {
    const { identifier, email, username, password } = req.body || {};
    const lookup = identifier || email || username;
    if (!lookup || !password) return res.status(400).json({ message: "identifier/email/username and password are required." });
    const user = await User.findOne({ $or: [{ email: String(lookup).toLowerCase() }, { username: String(lookup).trim() }] });
    if (!user || !verifyPassword(password, user.password)) return res.status(401).json({ message: "Invalid credentials." });
    const token = issueToken(user);
    return res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) { console.error("Auth login failed:", error); return res.status(500).json({ message: "Login failed.", error: error.message }); }
}


/**
 * me - Retrieve current authenticated user profile
 * WHY: Allow users to view their own account info
 * HOW: Extract user ID from JWT token, lookup user by ID
 * RESULT: User profile (ID, username, email) for authenticated requester
 */
export async function me(req, res) {
  try {
    const user = await User.findById(req.auth.sub).select("_id username email");
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json({ user });
  } catch (error) { console.error("Auth me failed:", error); return res.status(500).json({ message: "Could not fetch profile.", error: error.message }); }
}
