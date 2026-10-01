import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from "../controllers/notificationController.js";
import authStaff from "../middleware/authStaff.js";

const router = express.Router();

// All notification routes act only on the caller's own notifications
router.get("/", authStaff, getNotifications);
router.put("/read-all", authStaff, markAllAsRead);
router.put("/read/:notificationId", authStaff, markAsRead);
router.delete("/:notificationId", authStaff, deleteNotification);

export default router;
