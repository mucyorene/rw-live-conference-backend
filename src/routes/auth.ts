import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db";
import { User } from "../types";

const router = Router();

// POST /auth/register
router.post("/register", (req: Request, res: Response): void => {
  const { firstName, lastName, email, username, password } = req.body;
  if (!firstName) {
    res.status(400).json({ error: "First name is required" });
    return;
  }
  if (!lastName) {
    res.status(400).json({ error: "Last name is required" });
    return;
  }
  if (!username) {
    res.status(400).json({ error: "Username is required" });
    return;
  }
  if (!password) {
    res.status(400).json({ error: "Password is required" });
    return;
  }

  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const hashed = bcrypt.hashSync(password, 10);
  try {
    const result = db
      .prepare(
        "INSERT INTO users (first_name, last_name, email,username, password) VALUES (?, ?, ?, ?, ?)",
      )
      .run(firstName, lastName, email, username, hashed);
    const token = jwt.sign(
      { id: result.lastInsertRowid, username },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );
    res.status(201).json({ token });
  } catch {
    res.status(409).json({ error: "Username already exists" });
  }
});

// POST /auth/login
router.post("/login", (req: Request, res: Response): void => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }
  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username) as User | undefined;

  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" },
  );
  res.json({ token });
});

export default router;
