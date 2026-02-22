const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
// It reads your serviceAccountKey.json from the root of the backend folder
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Helper: convert Firestore doc snapshot to plain object with _id field
// This keeps your frontend working without changes (it expects _id like MongoDB)
const docToObj = (doc) => {
  if (!doc.exists) return null;
  return { _id: doc.id, ...doc.data() };
};

// Helper: convert a query snapshot to array of plain objects
const snapshotToArray = (snapshot) => {
  return snapshot.docs.map((doc) => ({ _id: doc.id, ...doc.data() }));
};

module.exports = { db, admin, docToObj, snapshotToArray };
