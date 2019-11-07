const functions = require("firebase-functions");
const app = require("express")();

const FBAuth = require("./utils/firebaseAuth");
const { db } = require("./utils/admin");
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
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead

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
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);

exports.api = functions.region("europe-west1").https.onRequest(app);

exports.createNotificationOnLike = functions.region('europe-west1').firestore.document('likes/{id}')
  .onCreate((snapshot) => {
    db.doc(`/buzzes/${snapshot.data().buzzId}`).get()
      .then(doc => {
        if(doc.exists){
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'like',
            read: false,
            buzzId: doc.id
          });
        }
      })
      .then(() => {
        return;
      })
      .catch(err => {
        console.error(err);
        return;
      })
  });

  exports.deleteNotificationOnUnlike = functions
    .region('europe-west1')
    .firestore.document('likes/{id}')
    .onDelete((snapshot) => {
      db.doc(`/notifications/${snapshot.id}`)
        .delete()
        .then(() => {
          return;
        })
        .catch(err => {
          console.error(err);
          return;
        })
  })

exports.createNotificationOnComment = functions.region('europe-west1').firestore.document('comments/{id}')
.onCreate((snapshot) => {
  db.doc(`/buzzes/${snapshot.data().buzzId}`).get()
    .then(doc => {
      if(doc.exists){
        return db.doc(`/notifications/${snapshot.id}`).set({
          createdAt: new Date().toISOString(),
          recipient: doc.data().userHandle,
          sender: snapshot.data().userHandle,
          type: 'comment',
          read: false,
          buzzId: doc.id
        });
      }
    })
    .then(() => {
      return;
    })
    .catch(err => {
      console.error(err);
      return;
    })
})