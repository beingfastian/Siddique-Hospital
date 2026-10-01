import notificationModel from "../model/notificationModel.js";

// Create a new notification
export const createNotification = async (recipient, recipientType, sender, senderType, type, title, message, priority = 'medium', relatedId = null) => {
  try {
    const notification = new notificationModel({
      recipient,
      recipientType,
      sender,
      senderType,
      type,
      title,
      message,
      priority,
      relatedId
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Get notifications for the logged-in admin or doctor
export const getNotifications = async (req, res) => {
  try {
    const notifications = await notificationModel.find({
      recipient: req.recipient,
      recipientType: req.recipientType
    }).sort({ createdAt: -1 });

    res.json({ success: true, notifications });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await notificationModel.findOneAndUpdate(
      { _id: notificationId, recipient: req.recipient, recipientType: req.recipientType },
      { read: true }
    );

    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Mark all of the caller's notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await notificationModel.updateMany(
      { recipient: req.recipient, recipientType: req.recipientType, read: false },
      { read: true }
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await notificationModel.findOneAndDelete({
      _id: notificationId,
      recipient: req.recipient,
      recipientType: req.recipientType
    });

    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
