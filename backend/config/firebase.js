const admin = require('firebase-admin');

// Supports BOTH local (serviceAccountKey.json) AND Lambda (env vars)
let firebaseConfig;

if (process.env.IS_LAMBDA) {
  // On Lambda: credentials come from environment variables
  firebaseConfig = {
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  };
} else {
  // Local dev: use serviceAccountKey.json file
  const path = require('path');
  const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
  firebaseConfig = {
    credential: admin.credential.cert(serviceAccount),
  };
}

// Only init once (important for Lambda warm starts)
if (!admin.apps.length) {
  admin.initializeApp(firebaseConfig);
}

const db = admin.firestore();

const docToObj = (doc) => {
  if (!doc.exists) return null;
  return { _id: doc.id, ...doc.data() };
};

const snapshotToArray = (snapshot) => {
  return snapshot.docs.map((doc) => ({ _id: doc.id, ...doc.data() }));
};

module.exports = { db, admin, docToObj, snapshotToArray };
