import admin from "firebase-admin";
import { ServiceAccount } from "firebase-admin";

const serviceAccount: ServiceAccount = JSON.parse(
  process.env.FIREBASE_ADMIN_CREDENTIALS as string
);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();
