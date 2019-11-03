const functions = require("firebase-functions");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const app = require("express")();
const firebase = require("firebase");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseUrl: "https://monkey-buzz-2019.firebaseio.com"
});
const firebaseConfig = {
  apiKey: process.env.APIKEY,
  authDomain: "monkey-buzz-2019.firebaseapp.com",
  databaseURL: process.env.DATABASEUR,
  projectId: "monkey-buzz-2019",
  storageBucket: "monkey-buzz-2019.appspot.com",
  messagingSenderId: "175703200110",
  appId: "1:175703200110:web:121b212f5e683724a9f17f"
};

firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

app.get("/buzzes", (req, res) => {
  db.collection("buzzes")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let buzzes = [];
      data.forEach(doc => {
        buzzes.push({
          buzzId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
          commentCount: doc.data().commentCount,
          likeCount: doc.data().likeCount
        });
      });
      return res.json(buzzes);
    })
    .catch(error => console.error(err));
});

app.post("/buzzes", (req, res) => {
  const newBuzz = {
    userHandle: req.body.userHandle,
    body: req.body.body,
    createdAt: new Date().toISOString()
  };

  db.collection("buzzes")
    .add(newBuzz)
    .then(doc => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch(err => {
      res.status(500).json({ error: "Something went wrong" });
      console.error(err);
    });
});

exports.api = functions.region("europe-west1").https.onRequest(app);
