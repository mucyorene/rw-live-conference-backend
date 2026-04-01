import { Router, Response } from 'express';
import db from '../db';
import authMiddleware from '../middleware/auth';
import { AuthRequest, Room } from '../types';

const router = Router();

router.use(authMiddleware);

// GET /rooms
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await db.query<Room>(`
    SELECT rooms.*, users.username as host
    FROM rooms
    JOIN users ON rooms.created_by = users.id
    ORDER BY rooms.created_at DESC
  `);
  res.json(result.rows);
});

// POST /rooms
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Room name required' });
    return;
  }

  try {
    const result = await db.query<Room>(
      'INSERT INTO rooms (name, created_by) VALUES ($1, $2) RETURNING *',
      [name, req.user!.id]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(409).json({ error: 'Room name already exists' });
  }
});

// DELETE /rooms/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await db.query<Room>(
    'SELECT * FROM rooms WHERE id = $1',
    [req.params.id]
  );
  const room = result.rows[0];

  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  if (room.created_by !== req.user!.id) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  await db.query('DELETE FROM rooms WHERE id = $1', [req.params.id]);
  res.json({ message: 'Room deleted' });
});

export default router;