const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT);

if (process.env.NODE_ENV === "development") {
  process.env['FIRESTORE_EMULATOR_HOST'] = `${process.env.FIRESTORE_EMULATOR_IP}:${process.env.FIRESTORE_EMULATOR_PORT}`;
}

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

module.exports = {
    db
}