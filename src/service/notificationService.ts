import { db } from "../config/firebase";
import admin from "firebase-admin";

interface Notification {
  userId: number;
  title: string;
  message: string;
  createdAt: FirebaseFirestore.Timestamp;
  read: boolean;
}

export async function sendNotification(
  userId: number,
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
  userIds: number[],
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
