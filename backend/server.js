import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import jwt from "jsonwebtoken";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import whatsappRouter from "./routes/whatsappRoute.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { testEmailConnection } from "./config/emailService.js";

// Fail fast with a clear message if required configuration is missing
const requiredEnv = ["MONGODB_URI", "JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  console.error("Copy backend/.env.example to backend/.env and fill them in.");
  process.exit(1);
}

// Allowed frontend origins, e.g. "https://site.vercel.app,https://admin.vercel.app".
// When unset (local development) every origin is allowed.
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOptions = { origin: allowedOrigins.length ? allowedOrigins : "*" };

// App Config
const app = express();
app.set("trust proxy", 1); // correct protocol/host behind Render/Vercel proxies
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { ...corsOptions, methods: ["GET", "POST"] }
});

const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();
testEmailConnection();

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.set("io", io);

// Socket.IO: the client sends its token, and the server decides the room.
// Admins join "admin"; doctors join "doctor_<id>".
io.use((socket, next) => {
  try {
    const decoded = jwt.verify(socket.handshake.auth?.token || "", process.env.JWT_SECRET);
    if (decoded.role === "admin") {
      socket.data.room = "admin";
    } else if (decoded.role === "doctor" && decoded.id) {
      socket.data.room = `doctor_${decoded.id}`;
    } else {
      return next(new Error("Unauthorized"));
    }
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.join(socket.data.room);
});

// Api Endpoints
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/whatsapp", whatsappRouter);
app.use("/api/notifications", notificationRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.status(200).send("API Working");
});

// Errors thrown by middleware (e.g. rejected uploads) as JSON instead of HTML
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 400).json({ success: false, message: err.message || "Request failed" });
});

server.listen(port, () => console.log("Server Started on port", port));
