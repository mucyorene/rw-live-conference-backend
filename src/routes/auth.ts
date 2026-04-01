import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import { User } from '../types';

const router = Router();

// POST /auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, username, password } = req.body;
  if (!firstName) { res.status(400).json({ error: 'First name is required' }); return; }
  if (!lastName) { res.status(400).json({ error: 'Last name is required' }); return; }
  if (!email) { res.status(400).json({ error: 'Email is required' }); return; }
  if (!username) { res.status(400).json({ error: 'Username is required' }); return; }
  if (!password) { res.status(400).json({ error: 'Password is required' }); return; }

  const hashed = bcrypt.hashSync(password, 10);
  try {
    const result = await db.query<User>(
      `INSERT INTO users (first_name, last_name, email, username, password)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, username`,
      [firstName, lastName, email, username, hashed]
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token });
  } catch {
    res.status(409).json({ error: 'Username or email already exists' });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  const result = await db.query<User>(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );
  const user = result.rows[0];

  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
  res.json({ token });
});

export default router;