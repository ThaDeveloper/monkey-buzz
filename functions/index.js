const functions = require("firebase-functions");
const app = require("express")();

const FBAuth = require("./utils/firebaseAuth");
const { getAllBuzzes, postBuzz } = require("./handlers/buzzes");
const { signUp, login } = require("./handlers/users");

//Buzz routes
app.get("/buzzes", getAllBuzzes);
app.post("/buzzes", FBAuth, postBuzz);

//Auth routes
app.post("/signup", signUp);
app.post("/login", login);

exports.api = functions.region("europe-west1").https.onRequest(app);
