import admin from "firebase-admin";
import { ServiceAccount } from "firebase-admin";

const isProduction = process.env.NODE_ENV === "production";
let serviceAccount: ServiceAccount;

if (isProduction) {
  serviceAccount = require("/etc/secrets/firebase-admin.json");
} else {
  serviceAccount = require("./firebase-admin.json");
}

export const manager = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = manager.firestore();
