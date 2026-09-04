import crypto from "crypto";

const TOKEN_SECRET = process.env.TOKEN_SECRET || "dev-token-secret-change-me";
const DEFAULT_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const parsedTokenTtlMs = Number(process.env.TOKEN_TTL_MS);
const TOKEN_TTL_MS =
  Number.isFinite(parsedTokenTtlMs) && parsedTokenTtlMs > 0
    ? parsedTokenTtlMs
    : DEFAULT_TOKEN_TTL_MS;

function toBase64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64Url(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = normalized + (pad ? "=".repeat(4 - pad) : "");
  return Buffer.from(padded, "base64").toString("utf8");
}

function sign(payload) {
  return toBase64Url(
    crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("base64")
  );
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, passwordHash) {
  const [salt, expected] = String(passwordHash || "").split(":");
  if (!salt || !expected) return false;
  const actual = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(actual, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

function issueToken(user) {
  const payload = {
    sub: user._id.toString(),
    username: user.username,
    email: user.email,
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [encodedPayload, providedSignature] = token.split(".");
  const expectedSignature = sign(encodedPayload);
  if (providedSignature !== expectedSignature) return null;
  const payload = JSON.parse(fromBase64Url(encodedPayload));
  if (!payload?.exp || Date.now() > payload.exp) return null;
  return payload;
}

export { hashPassword, verifyPassword, issueToken, verifyToken };
