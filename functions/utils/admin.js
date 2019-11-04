const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseUrl: "https://monkey-buzz-2019.firebaseio.com",
  storageBucket: "monkey-buzz-2019.appspot.com",
});

const db = admin.firestore();

module.exports = { admin, db };
