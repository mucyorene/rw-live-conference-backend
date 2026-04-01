import { Request } from "express";

export interface JwtPayload {
  id: number;
  username: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  created_at: string;
}

export interface Room {
  id: number;
  name: string;
  created_by: number;
  created_at: string;
  host?: string;
}
