import { db } from "../config/firebase";
import admin from "firebase-admin";

interface Notification {
  userId: string;
  title: string;
  message: string;
  createdAt: FirebaseFirestore.Timestamp;
  read: boolean;
}

export async function sendNotification(
  userId: string,
  title: string,
  message: string
) {
  try {
    const notification: Notification = {
      userId,
      title,
      message,
      createdAt: admin.firestore.Timestamp.now(),
      read: false,
    };

    await db.collection("notifications").add(notification);
  } catch (error) {
    console.error("Error sending notification:", error);
    throw new Error("Failed to send notification");
  }
}

export async function sendBulkNotifications(
  userIds: string[],
  title: string,
  message: string
) {
  try {
    const batch = db.batch();

    userIds.forEach((userId) => {
      const notifications: Notification = {
        userId,
        title,
        message,
        createdAt: admin.firestore.Timestamp.now(),
        read: false,
      };
      const docRef = db.collection("notifications").doc();
      batch.set(docRef, notifications);
    });
    await batch.commit();
  } catch (error) {
    console.error("Error sending bulk notifications:", error);
    throw new Error("Failed to send bulk notifications");
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const notificationRef = db.collection("notifications").doc(notificationId);
    if (!notificationRef) {
      throw new Error("Notification not found");
    }
    await notificationRef.update({ read: true });
    await notificationRef.delete();
    return true;
  } catch (error) {
    console.log("Error marking notification as read:", error);
    throw new Error("Failed to mark notification as read");
  }
}
