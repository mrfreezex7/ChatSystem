const mongodb = require("mongodb");
const getDb = require("../utility/database").getDb;

class Chat {
  constructor(username1, username2, chats = [], newChatCount = []) {
    this.username1 = username1;
    this.username2 = username2;
    this.chats = chats;
    this.newChatCount = newChatCount;
  }

  save() {
    const db = getDb();
    return db.collection("chats").insertOne(this);
  }

  static GetChatLists(_username1, _username2) {
    const db = getDb();
    return db
      .collection("chats")
      .findOne({
        $or: [
          { $and: [{ username1: _username1 }, { username2: _username2 }] },
          { $and: [{ username1: _username2 }, { username2: _username1 }] },
        ],
      })
      .then((data) => {
        return data.chats;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static SaveChat(_username1, _username2, _chats) {
    const db = getDb();
    return db
      .collection("chats")
      .findOne({
        $or: [
          { $and: [{ username1: _username1 }, { username2: _username2 }] },
          { $and: [{ username1: _username2 }, { username2: _username1 }] },
        ],
      })
      .then((data) => {
        return db
          .collection("chats")
          .updateOne({ _id: data._id }, { $addToSet: { chats: _chats } })
          .then(() => {
            console.log("Chat Added to DB");
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static UpdateLastChatMsg(_username1, _username2, _lastChats) {
    const db = getDb();
    return db
      .collection("chats")
      .findOne({
        $or: [
          { $and: [{ username1: _username1 }, { username2: _username2 }] },
          { $and: [{ username1: _username2 }, { username2: _username1 }] },
        ],
      })
      .then((data) => {
        return db
          .collection("chats")
          .updateOne(
            { _id: data._id, "newChatCount.ns": _lastChats.ns },
            { $set: { "newChatCount.$": _lastChats } }
          )
          .then(() => {
            console.log("Chat Added to DB");
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static GetLastChatCounter(_username1, _username2, forUsername) {
    const db = getDb();
    return db
      .collection("chats")
      .findOne(
        {
          $or: [
            {
              $and: [{ username1: _username1 }, { username2: _username2 }],
            },
            {
              $and: [
                { username1: _username2 },
                {
                  username2: _username1,
                },
              ],
            },
          ],
        },
        { chats: 0 }
      )
      .then((data) => {
        return data.newChatCount;
      })
      .catch((err) => {
        console.log(err);
      });
  }
}

module.exports = Chat;
