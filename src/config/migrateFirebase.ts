import { PrismaClient } from "@prisma/client";
import admin from "firebase-admin";
import { ServiceAccount } from "firebase-admin";

let serviceAccount: ServiceAccount;
serviceAccount = require("./firebase-admin.json");

const prisma = new PrismaClient();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function migrateFirebase() {
  const usersWithoutFirebase = await prisma.users.findMany({
    where: { firebaseId: null },
  });

  for (const user of usersWithoutFirebase) {
    try {
      const firebaseUser = await admin.auth().createUser({
        displayName: user.username,
      });

      await prisma.users.update({
        where: { id: user.id },
        data: { firebaseId: firebaseUser.uid },
      });
      console.log(
        `User ${user.username} updated with Firebase UID: ${firebaseUser.uid}`
      );
    } catch (error) {
      console.error(
        `Failed to create Firebase user for ${user.username}:`,
        error
      );
    }
  }
}

migrateFirebase()
  .then(() => {
    console.log("Firebase migration completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration error:", error);
    process.exit(1);
  });
