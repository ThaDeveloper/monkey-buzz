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

const isEmpty = (string) =>{
  if(string.trim()  === '') return true;
  else return false;
};

const isEmail = (email) => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if(email.match(regEx)) return true;
  else return false; 
}

//Signup
app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  //validate
  let errors = {};
  
  if(isEmpty(newUser.email)){
    errors.email = 'Must not be empty';
  } else if(!isEmail(newUser.email)){
    errors.email = 'Email is invalid';
  }
  
  if(isEmpty(newUser.password)) errors.password = 'Must not be mepty';
  if(newUser.password !== newUser.confirmPassword) errors.confirmPassword ='Passwords don\'t match';
  if(isEmpty(newUser.handle)) errors.handle = 'Must not be mepty';
  
  if(Object.keys(errors).length > 0) return res.status(400).json(errors);

  let token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then((doc) =>{
      if(doc.exists){
        return res.status(400).json({handle: 'handle already taken'});
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) =>{
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() =>{
      return res.status(201).json({token});
    })
    .catch(err => {
      console.error(err);
      if(err.code === 'auth/email-already-in-use'){
        return res.status(400).json({email: 'Email is already in use'});
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
});

app.post('/login', (req, res) =>{
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  let errors = {};

  if(isEmpty(user.email)) errors.email = 'Must not be empty';
  if(isEmpty(user.password)) errors.password = 'Must not be empty';

  if(Object.keys(errors).length > 0) return res.status(400).json(errors);

  firebase
  .auth()
  .signInWithEmailAndPassword(user.email, user.password)
  .then(data => {
    return data.user.getIdToken();
  })
  .then(token =>{
    return res.json({token});
  })
  .catch(err =>{
    console.error(err)
    if(err.code === 'auth/wrong-password'){
      return res.status(403).json({general: 'Wrong credentials, please retry'})
    } else {
      return res.status(500).json({error: err.code})
    }
  })
});

exports.api = functions.region("europe-west1").https.onRequest(app);
