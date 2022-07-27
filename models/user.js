const mongodb = require("mongodb");
const getDb = require("../utility/database").getDb;
const Chats = require("./chat");

class User {
  constructor(username, email, image, password) {
    this.username = username;
    this.email = email;
    this.image = image;
    this.password = password;
    this.endpoint = "/" + username;
  }

  save() {
    const db = getDb();
    return db.collection("users").insertOne(this);
  }

  static fetchAllUsers() {
    const db = getDb();
    return db
      .collection("users")
      .find()
      .toArray()
      .then((user) => {
        return user;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static findById(_username) {
    const db = getDb();
    return db
      .collection("users")
      .findOne({ username: _username })
      .then((user) => {
        return user;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static GetSearchedFriend(searchString) {
    const db = getDb();
    return db
      .collection("users")
      .find({ username: new RegExp(searchString, "i") })
      .toArray()
      .then((users) => {
        return users;
      })
      .catch((err) => console.log(err));
  }
}

module.exports = User;
