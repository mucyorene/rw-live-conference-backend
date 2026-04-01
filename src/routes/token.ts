import { Router, Response } from "express";
import { AccessToken } from "livekit-server-sdk";
import db from "../db";
import authMiddleware from "../middleware/auth";
import { AuthRequest, Room } from "../types";

const router = Router();

// POST /token
router.post(
  "/",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { roomName, canPublish = false } = req.body;
    if (!roomName) {
      res.status(400).json({ error: "roomName required" });
      return;
    }

    const room = db
      .prepare("SELECT * FROM rooms WHERE name = ?")
      .get(roomName) as Room | undefined;

    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      { identity: req.user!.username },
    );

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    res.json({ token, wsUrl: process.env.LIVEKIT_WS_URL });
  },
);

export default router;
