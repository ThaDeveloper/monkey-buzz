const functions = require("firebase-functions");
const app = require("express")();

const FBAuth = require("./utils/firebaseAuth");
const {
  getAllBuzzes,
  postBuzz,
  getBuzz,
  commentOnBuzz,
  likeBuzz,
  unlikeBuzz,
  deleteBuzz
} = require("./handlers/buzzes");
const {
  signUp,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser
} = require("./handlers/users");

//Buzz routes
app.get("/buzzes", getAllBuzzes);
app.post("/buzzes", FBAuth, postBuzz);
app.get("buzzes/:buzzId", getBuzz);
app.delete("/buzzes/:buzzId", FBAuth, deleteBuzz);
app.get("/buzzes/:buzzId/like", FBAuth, likeBuzz);
app.get("/buzzes/:buzzId/unlike", FBAuth, unlikeBuzz);
app.post("/buzzes/:buzzId/comments", FBAuth, commentOnBuzz);

//Auth routes
app.post("/signup", signUp);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);

exports.api = functions.region("europe-west1").https.onRequest(app);
