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
app.get("/user/:handle", getUserDetails);
app.post("/notifications", FBAuth, markNotificationsRead);

exports.api = functions.region("europe-west1").https.onRequest(app);

exports.createNotificationOnLike = functions
  .region("europe-west1")
  .firestore.document("likes/{id}")
  .onCreate(snapshot => {
    return db
      .doc(`/buzzes/${snapshot.data().buzzId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "like",
            read: false,
            buzzId: doc.id
          });
        }
      })
      .catch(err => console.error(err));
  });

exports.deleteNotificationOnUnlike = functions
  .region("europe-west1")
  .firestore.document("likes/{id}")
  .onDelete(snapshot => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch(err => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions
  .region("europe-west1")
  .firestore.document("comments/{id}")
  .onCreate(snapshot => {
    return db
      .doc(`/buzzes/${snapshot.data().buzzId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "comment",
            read: false,
            buzzId: doc.id
          });
        }
      })
      .catch(err => {
        console.error(err);
        return;
      });
  });

exports.onUserImageChange = functions
  .region("europe-west1")
  .firestore.document("/users/{userId}")
  .onUpdate(change => {
    console.log(change.before.data());
    console.log(change.after.data());
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      const batch = db.batch();
      return db
        .collection("buzzes")
        .where("userHandle", "==", change.before.data().handle)
        .get()
        .then(data => {
          data.forEach(doc => {
            const buzz = db.doc(`/buzzes/${doc.id}`);
            batch.update(buzz, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

exports.onBuzzDelete = functions
  .region("europe-west1")
  .firestore.document("/buzzes/{buzzId}")
  .onDelete((snapshot, context) => {
    const buzzId = context.params.buzzId;
    const batch = db.batch();
    return db
      .collection("comments")
      .where("buzzId", "==", buzzId)
      .get()
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db
          .collection("likes")
          .where("buzzId", "==", buzzId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection("notifications")
          .where("buzzId", "==", buzzId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch(err => console.log(err));
  });
