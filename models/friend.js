const mongodb = require("mongodb");
const getDb = require("../utility/database").getDb;
const Chats = require("./chat");

class Friend {
  constructor(
    username,
    currentFriend = [],
    sentFriendRequest = [],
    receivedFriendRequest = []
  ) {
    this.username = username;
    this.currentFriend = currentFriend;
    this.sentFriendRequest = sentFriendRequest;
    this.receivedFriendRequest = receivedFriendRequest;
  }

  save() {
    const db = getDb();
    return db.collection("friends").insertOne(this);
  }

  static getFriendLists(_username) {
    const db = getDb();
    return db
      .collection("friends")
      .findOne({ username: _username })
      .then((user) => {
        return user.currentFriend;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static findById(_username) {
    const db = getDb();
    return db
      .collection("friends")
      .findOne({ username: _username })
      .then((user) => {
        console.log(user);
        return user;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static sendFriendRequest(from, to) {
    //check if friendRequest AleadySend or they are alredy my friend
    //check if both users exists
    //also check that you are not sending friend request to yourself

    const db = getDb();
    db.collection("friends")
      .updateOne({ username: from }, { $addToSet: { sentFriendRequest: to } })
      .then(() => {
        console.log("Friend Request sent Successfully");
      })
      .catch((err) => {
        console.log(err);
      });
    return db
      .collection("friends")
      .updateOne(
        { username: to },
        { $addToSet: { receivedFriendRequest: from } }
      )
      .then(() => {
        console.log("Friend Request Received Successfully");
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static loadAllFriendRequests(_username) {
    const db = getDb();
    return db
      .collection("friends")
      .findOne({ username: _username })
      .then((friend) => {
        return {
          sentRequest: friend.sentFriendRequest,
          receivedRequest: friend.receivedFriendRequest,
        };
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static loadReceivedFriendRequests(_username) {
    const db = getDb();
    return db
      .collection("friends")
      .findOne({ username: _username })
      .then((friend) => {
        return friend.receivedFriendRequest;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static loadSentFriendRequests(_username) {
    const db = getDb();
    return db
      .collection("friends")
      .findOne({ username: _username })
      .then((friend) => {
        return friend.sentFriendRequest;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static AcceptFriendRequest(senderUsername, myUsername) {
    const db = getDb();
    db.collection("friends")
      .updateMany(
        { username: senderUsername },
        { $pull: { sentFriendRequest: myUsername } }
      )
      .then(() => {
        console.log("Friend Request Removed Successfully");
      })
      .catch((err) => {
        console.log(err);
      });
    db.collection("friends")
      .updateMany(
        { username: myUsername },
        { $pull: { receivedFriendRequest: senderUsername } }
      )
      .then(() => {
        console.log("Friend Request Removed Successfully");
      })
      .catch((err) => {
        console.log(err);
      });
    db.collection("friends")
      .updateOne(
        { username: myUsername },
        { $addToSet: { currentFriend: senderUsername } }
      )
      .then(() => {
        console.log("FriendAdded");
      })
      .catch((err) => {
        console.log(err);
      });
    return db
      .collection("friends")
      .updateOne(
        { username: senderUsername },
        { $addToSet: { currentFriend: myUsername } }
      )
      .then(() => {
        console.log("FriendAdded");
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static CancelFriendRequest(senderUsername, myUsername) {
    const db = getDb();
    db.collection("friends")
      .updateMany(
        { username: myUsername },
        { $pull: { sentFriendRequest: senderUsername } }
      )
      .then(() => {
        console.log("Friend Request Removed Successfully");
      })
      .catch((err) => {
        console.log(err);
      });
    return db
      .collection("friends")
      .updateMany(
        { username: senderUsername },
        { $pull: { receivedFriendRequest: myUsername } }
      )
      .then(() => {
        console.log("Friend Request Removed Successfully");
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static RejectFriendRequest(senderUsername, myUsername) {
    const db = getDb();
    db.collection("friends")
      .updateMany(
        { username: myUsername },
        { $pull: { receivedFriendRequest: senderUsername } }
      )
      .then(() => {
        console.log("Friend Request Removed Successfully");
      })
      .catch((err) => {
        console.log(err);
      });
    return db
      .collection("friends")
      .updateMany(
        { username: senderUsername },
        { $pull: { sentFriendRequest: myUsername } }
      )
      .then(() => {
        console.log("Friend Request Removed Successfully");
      })
      .catch((err) => {
        console.log(err);
      });
  }
}

module.exports = Friend;
