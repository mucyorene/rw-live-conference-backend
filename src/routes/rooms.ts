import { Router, Response } from 'express';
import db from '../db';
import authMiddleware from '../middleware/auth';
import { AuthRequest, Room } from '../types';

const router = Router();

router.use(authMiddleware);

// GET /rooms
router.get('/', (req: AuthRequest, res: Response): void => {
  const rooms = db.prepare(`
    SELECT rooms.*, users.username as host
    FROM rooms
    JOIN users ON rooms.created_by = users.id
    ORDER BY rooms.created_at DESC
  `).all() as Room[];
  res.json(rooms);
});

// POST /rooms
router.post('/', (req: AuthRequest, res: Response): void => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Room name required' });
    return;
  }

  try {
    const result = db
      .prepare('INSERT INTO rooms (name, created_by) VALUES (?, ?)')
      .run(name, req.user!.id);
    res.status(201).json({ id: result.lastInsertRowid, name });
  } catch {
    res.status(409).json({ error: 'Room name already exists' });
  }
});

// DELETE /rooms/:id
router.delete('/:id', (req: AuthRequest, res: Response): void => {
  const room = db
    .prepare('SELECT * FROM rooms WHERE id = ?')
    .get(req.params.id) as Room | undefined;

  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  if (room.created_by !== req.user!.id) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);
  res.json({ message: 'Room deleted' });
});

export default router;