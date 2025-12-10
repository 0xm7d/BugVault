import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { UserModel } from "../models/User.js";
import { env } from "../config/env.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["owner", "admin", "analyst", "dev"]).optional().default("dev"),
});

// Public registration endpoint
router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const { name, email, password, role } = parsed.data;
  const existing = await UserModel.findOne({ email });
  if (existing) return res.status(409).json({ error: "Email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({ name, email, passwordHash, role });
  
  const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "8h" });
  return res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// Admin-only registration endpoint
router.post("/register/admin", requireAuth, requireRole(["admin"]), async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const { name, email, password, role } = parsed.data;
  const existing = await UserModel.findOne({ email });
  if (existing) return res.status(409).json({ error: "Email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({ name, email, passwordHash, role });
  return res.status(201).json({ id: user.id, email: user.email, role: user.role });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const { email, password } = parsed.data;
  const user = await UserModel.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "8h" });
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

router.get("/me", requireAuth, (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const { id, name, email, role } = req.user;
  return res.json({ id, name, email, role });
});

// Update profile (name)
router.put("/profile", requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name || name.length < 2) {
    return res.status(400).json({ error: "Name must be at least 2 characters" });
  }

  const user = await UserModel.findByIdAndUpdate(
    req.user.id,
    { name },
    { new: true }
  );

  if (!user) return res.status(404).json({ error: "User not found" });

  return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

// Update password
router.put("/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current password and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }

  const user = await UserModel.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Current password is incorrect" });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await UserModel.findByIdAndUpdate(req.user.id, { passwordHash });

  return res.json({ message: "Password updated successfully" });
});

// List all users (admin/owner only)
router.get("/users", requireAuth, requireRole(["admin", "owner"]), async (req, res) => {
  const users = await UserModel.find({}, { passwordHash: 0 }).sort({ createdAt: -1 });
  return res.json(users);
});

// Update user role (admin/owner only)
router.put("/users/:id/role", requireAuth, requireRole(["admin", "owner"]), async (req, res) => {
  const { role } = req.body;
  const validRoles = ["owner", "admin", "analyst", "dev"];
  
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `Role must be one of: ${validRoles.join(", ")}` });
  }

  // Prevent non-owners from assigning owner role
  if (role === "owner" && req.user.role !== "owner") {
    return res.status(403).json({ error: "Only owners can assign owner role" });
  }

  // Prevent users from changing their own role
  if (req.user.id.toString() === req.params.id) {
    return res.status(400).json({ error: "You cannot change your own role" });
  }

  const user = await UserModel.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select("-passwordHash");

  if (!user) return res.status(404).json({ error: "User not found" });

  return res.json(user);
});

export default router;


