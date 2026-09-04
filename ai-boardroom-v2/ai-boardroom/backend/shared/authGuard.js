import { verifyToken } from "../features/auth/auth.utils.js";

function authGuard(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.auth = payload;
  return next();
}

export default authGuard;
