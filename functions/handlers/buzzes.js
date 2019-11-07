const { db } = require("../utils/admin");

exports.getAllBuzzes = (req, res) => {
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
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.postBuzz = (req, res) => {
  const newBuzz = {
    userHandle: req.user.handle,
    body: req.body.body,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0
  };

  db.collection("buzzes")
    .add(newBuzz)
    .then(doc => {
      const resBuzz = newBuzz;
      resBuzz.buzzId = doc.id;
      res.json(resBuzz);
    })
    .catch(err => {
      res.status(500).json({ error: "Something went wrong" });
      console.error(err);
    });
};

exports.getBuzz = (req, res) => {
  let buzzData = {};
  db.doc(`/buzzes/${req.params.buzzId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Buzz not found" });
      }
      buzzData = doc.data();
      buzzData.buzzId = doc.id;
      return db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("buzzId", "==", req.params.buzzId)
        .get();
    })
    .then(data => {
      buzzData.comments = [];
      data.forEach(doc => {
        buzzData.comments.push(doc.data());
      });
      return res.json(buzzData);
    })
    .catch(err => {
      console.error(err);
      res.status(500).jso({ error: err.code });
    });
};

//Comment on a buzz
exports.commentOnBuzz = (req, res) => {
  if (req.body.body.trim() === "")
    return res.status(400).json({ error: "Must not be empty" });

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    buzzId: req.params.buzzId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl
  };
  db.doc(`/buzzes/${req.params.buzzId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Buzz not found" });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      return res.json(newComment);
    })
    .catch(err => {
      console.log(err);
      return res.status(500).json({ error: "Something went wrong" });
    });
};

//like a buzz
exports.likeBuzz = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("buzzId", "==", req.params.buzzId)
    .limit(1);

  const buzzDocument = db.doc(`/buzzes/${req.params.buzzId}`);

  let buzzData;

  buzzDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        buzzData = doc.data();
        buzzData.buzzId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Buzz not found" });
      }
    })
    .then(data => {
      if (data.empty) {
        return db
          .collection("likes")
          .add({
            buzzId: req.params.buzzId,
            userHandle: req.user.handle
          })
          .then(() => {
            buzzData.likeCount++;
            return buzzDocument.update({ likeCount: buzzData.likeCount });
          })
          .then(() => {
            return res.json(buzzData);
          });
      } else {
        return res.status(400).json({ error: "Buzz already liked" });
      }
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// unlike comment
exports.unlikeBuzz = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("buzzId", "==", req.params.buzzId)
    .limit(1);

  const buzzDocument = db.doc(`/buzzes/${req.params.buzzId}`);

  let buzzData;

  buzzDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        buzzData = doc.data();
        buzzData.buzzId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Buzz not found" });
      }
    })
    .then(data => {
      if (data.empty) {
        return res.status(400).json({ error: "Buzz not liked" });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            buzzData.likeCount--;
            return buzzDocument.update({ likeCount: buzzData.likeCount });
          })
          .then(() => {
            res.json(buzzData);
          });
      }
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

//delete buzz
exports.deleteBuzz = (req, res) => {
  const document = db.doc(`/buzzes/${req.params.buzzId}`);
  document
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Buzz not found" });
      }
      if (doc.data().userHandle !== req.user.handle) {
        return res.status(403).json({ error: "Unauthorized" });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: "Buzz deleted successfully" });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
