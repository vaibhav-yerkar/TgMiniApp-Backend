import admin from "firebase-admin";
import { ServiceAccount } from "firebase-admin";

// const serviceAccount: ServiceAccount = require("./firebase-admin.json");
const serviceAccount: ServiceAccount = require("/etc/secrets/firebase-admin.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();
