const { db } = require('../utils/admin');

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
          res.status(500).json({error: err.code});
      });
  }

exports.postBuzz = (req, res) => {
    const newBuzz = {
      userHandle: req.user.handle,
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
  }
