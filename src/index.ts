import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth";
import roomRoutes from "./routes/rooms";
import tokenRoutes from "./routes/token";

const app = express();
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/rooms", roomRoutes);
app.use("/token", tokenRoutes);

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});