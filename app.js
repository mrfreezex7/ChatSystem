const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const shortid = require("shortid");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const socketio = require("socket.io");
const fs = require("node:fs");

const Users = require("./models/user");
const Friends = require("./models/friend");
const Chats = require("./models/chat");

const app = express();
const store = new MongoDBStore({
  uri: "mongodb://localhost:27017/chatSystem",
  collection: "sessions",
});

app.set("view engine", "ejs");
app.set("views", "views");

const mongoConnect = require("./utility/database").mongoConnect;

fs.exists("./images", (exists) => {
  console.log(exists, "yes");
  if (!exists) {
    fs.mkdirSync(path.join(__dirname, "images"));
  } else {
    console.log("images directory exists");
  }
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./images/");
  },
  filename: (req, file, cb) => {
    cb(null, shortid.generate() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

const errorController = require("./controllers/error");
const Routes = require("./routes/routes");

app.use(Routes);

app.use(errorController.get404Page);

mongoConnect(() => {
  const expressServer = app.listen(8888);
  const io = socketio(expressServer);
  console.log("Express and Socket Server Started on Port 8888");
  ListningOnSocket(io);
  ListningOnEndpoint(io);
});

var users = {};

function ListningOnSocket(io) {
  io.on("connection", (socket) => {
    socket.on("JoinUser", (username) => {
      console.log(username);
      Users.findById(username)
        .then((user) => {
          if (user) {
            console.log(Object.keys(io.nsps).indexOf(user.endpoint));
            if (
              Object.keys(io.nsps).indexOf(user.endpoint) > 0 &&
              users[user.username]
            ) {
              socket.emit("JoinUser");
              return;
            }
            const userEndpoint = io.of(user.endpoint);
            console.log(user.endpoint);
            socket.emit("JoinUser");
            userEndpoint.on("connection", (userSocket) => {
              var id = "";

              console.log("A User Connected");
              userSocket.on("login", (data) => {
                id = data.userId;
                users[id] = id;
                console.log(users);
              });
              const username = user.username;

              ManageFriendRequests(io, userSocket, username);
              ManageFriendLists(userSocket, username);
              ManageFriends(
                io,
                userSocket,
                username,
                user.image,
                user.endpoint
              );
              GetOnlineStatus(io, userSocket);
              SetOnlineStatus(io, username);

              userSocket.on("disconnect", () => {
                console.log("A User Disconnected");
                SetOnlineStatus(io, username);
                if (Object.keys(io.nsps).indexOf(user.endpoint) === -1) {
                  delete users[username];
                }
              });
            });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    });
  });
}

function ListningOnEndpoint(io) {}

function ManageFriendLists(socket, username) {
  socket.on("GetLastMsg", (data, callback) => {
    console.log("Got Last Socket");
    console.log(data.username);

    const friendUsername = data.username;

    Chats.GetLastChatCounter(friendUsername, username, friendUsername)
      .then((data) => {
        if ("/" + username === data[0].ns) {
          callback(data[0]);
        } else if ("/" + username === data[1].ns) {
          callback(data[1]);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });

  socket.on("getFriendList", (data) => {
    const userlist = [];

    Friends.getFriendLists(data.username)
      .then((friend) => {
        let friendsName = friend;
        let friendlistLength = friendsName.length;
        let counter = 0;
        friendsName.forEach((username) => {
          Users.findById(username)
            .then((user) => {
              counter++;
              userlist.push(user);
              if (counter >= friendlistLength) {
                Chats.GetLastChatCounter(
                  data.username,
                  user.username,
                  data.username
                )
                  .then((data) => {
                    console.log(data);
                  })
                  .catch((err) => {
                    console.log(err);
                  });

                console.log(userlist.length);

                socket.emit("sendFriedsList", {
                  friendList: userlist,
                });
              }
            })
            .catch((err) => {
              console.log(err);
            });
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
}

function GetOnlineStatus(io, socket) {
  socket.on("GetOnlineStatus", (friendNs) => {
    const object = io.of(friendNs.endpoint).connected;
    const OnlineStatus =
      Object.keys(object).length === 0 && object.constructor === Object
        ? "offline"
        : "online";
    socket.emit("SetOnlineStatus", {
      status: OnlineStatus,
      ns: friendNs.endpoint,
    });
  });
}

function SetOnlineStatus(io, username) {
  console.log("connected again" + username);
  Friends.getFriendLists(username)
    .then((data) => {
      console.log(data);
      data.forEach((friendName) => {
        friendEndpoint = io.of("/" + friendName);
        const object = io.of("/" + username).connected;
        const OnlineStatus =
          Object.keys(object).length === 0 && object.constructor === Object
            ? "offline"
            : "online";
        friendEndpoint.emit("SetOnlineStatus", {
          status: OnlineStatus,
          ns: "/" + username,
        });
      });
    })
    .catch((err) => {
      console.log(err);
    });
}

function ManageFriendRequests(io, socket, username) {
  LoadAllFriendRequests(socket, username);

  socket.on("SendFriendRequest", (data) => {
    Friends.sendFriendRequest(data.fromUser, data.toUser) // request stored in db as send and received friend request
      .then(() => {
        Users.findById(data.toUser)
          .then((user) => {
            socket.emit("updateSentRequest", { sentRequest: user }, () => {
              Users.findById(data.fromUser)
                .then((user) => {
                  console.log("=============");
                  console.log(data.fromUser);
                  console.log(user);
                  io.of("/" + data.toUser).emit("updateReceivedRequest", {
                    receivedRequest: user,
                  });
                })
                .catch((err) => {
                  console.log(err);
                });
            });
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  });

  socket.on("AcceptFriendRequest", (data, callback) => {
    Friends.AcceptFriendRequest(data.senderName, data.myName)
      .then(() => {
        console.log("Friend Request Accepted Successfully");

        const newChatCountSchema = [
          {
            ns: "/" + data.senderName,
            text: "",
            counter: 0,
          },
          {
            ns: "/" + data.myName,
            text: "",
            counter: 0,
          },
        ];

        const Chat = new Chats(
          data.senderName,
          data.myName,
          [],
          newChatCountSchema
        );
        Chat.save()
          .then(() => {
            console.log("Chat DB Created");
          })
          .catch((err) => {
            console.log(err);
          });

        callback();
      })
      .catch((err) => {
        console.log(err);
      });
  });

  socket.on("CancelFriendRequest", (data, callback) => {
    Friends.CancelFriendRequest(data.senderName, data.myName)
      .then(() => {
        console.log("Friend Request Cancelled Successfully");
        callback();
      })
      .catch((err) => {
        console.log(err);
      });
  });

  socket.on("RejectFriendRequest", (data, callback) => {
    Friends.RejectFriendRequest(data.senderName, data.myName)
      .then(() => {
        console.log("Friend Request Cancelled Successfully");
        callback();
      })
      .catch((err) => {
        console.log(err);
      });
  });

  socket.on("RemoveUnavaliableFriendRequest", (data) => {
    io.of("/" + data.senderName).emit(
      "RemoveUnavaliableFriendRequest",
      data.myName
    );
  });

  socket.on("GetAcceptedFriendInList", (data) => {
    Users.findById(data.senderName)
      .then((user) => {
        socket.emit("ShowAcceptedFriendInList", user);
      })
      .catch((err) => {
        console.log(err);
      });

    Users.findById(data.myName)
      .then((user) => {
        io.of("/" + data.senderName).emit("ShowAcceptedFriendInList", user);
      })
      .catch((err) => {
        console.log(err);
      });
  });
}

function LoadAllFriendRequests(socket, username) {
  Friends.loadSentFriendRequests(username)
    .then((sentRequests) => {
      const SentRequests = sentRequests;

      SentRequests.forEach((username) => {
        console.log(username);
        Users.findById(username)
          .then((user) => {
            socket.emit("LoadSentFriendRequest", {
              sentRequest: user,
            });
          })
          .catch((err) => {
            console.log(err);
          });
      });
    })
    .catch((err) => {
      console.log(err);
    });

  Friends.loadReceivedFriendRequests(username)
    .then((receivedRequests) => {
      const ReceivedRequests = receivedRequests;

      ReceivedRequests.forEach((username) => {
        console.log(username);
        Users.findById(username)
          .then((user) => {
            socket.emit("LoadReceivedFriendRequest", {
              receivedRequest: user,
            });
          })
          .catch((err) => {
            console.log(err);
          });
      });
    })
    .catch((err) => {
      console.log(err);
    });
}

function ManageFriends(io, socket, username, avatar, endpoint) {
  let friendEndpoint = "";
  let friendNs = "";

  socket.on("JoinFriendEndpoint", (data, callback) => {
    friendEndpoint = io.of(data.receiver);
    friendNs = data.receiver;
    const senderEndpoint = endpoint.replace("/", "");
    const receiverEndpoint = friendNs.replace("/", "");

    Chats.GetChatLists(senderEndpoint, receiverEndpoint)
      .then((chats) => {
        callback(chats);
      })
      .catch((err) => {
        console.log(err);
      });
  });

  socket.on("newMsgToServer", (data, callback) => {
    const fullChat = {
      ns: endpoint,
      text: data.text,
      time: Date.now(),
      username: username,
      avatar: avatar,
    };

    const senderEndpoint = endpoint.replace("/", "");
    const receiverEndpoint = friendNs.replace("/", "");

    const object = friendEndpoint.connected;

    if (Object.keys(object).length === 0 && object.constructor === Object) {
      //store message counter, last messages and sendername to db;

      Chats.GetLastChatCounter(senderEndpoint, receiverEndpoint, username)
        .then((lastChat) => {
          let counter = 0;
          if ("/" + senderEndpoint === lastChat[0].ns) {
            counter = Number(lastChat[0].counter);
          } else if ("/" + receiverEndpoint === lastChat[1].ns) {
            counter = Number(lastChat[1].counter);
          }

          counter++;

          const lastMsg = {
            ns: endpoint,
            text: data.text,
            counter: counter,
          };
          console.log(lastMsg.text + "==" + lastMsg.counter);

          Chats.UpdateLastChatMsg(senderEndpoint, receiverEndpoint, lastMsg)
            .then(() => {
              console.log("last msg updated");
            })
            .catch((err) => {
              console.log(err);
            });
        })
        .catch((err) => {
          console.log(err);
        });
    }

    Chats.SaveChat(senderEndpoint, receiverEndpoint, fullChat)
      .then(() => {
        friendEndpoint.emit("messageToClient", fullChat);
        callback(fullChat);
      })
      .catch((err) => {
        console.log(err);
      });
  });

  socket.on("GetSearchedFriend", (data, callback) => {
    console.log(data.searchString);
    var FinalSearchResult = [];
    Users.GetSearchedFriend(data.searchString)
      .then((results) => {
        results.forEach((user) => {
          if (data.sender === user.endpoint) return;
          FinalSearchResult.push(user);
        });
        callback(FinalSearchResult);
      })
      .catch((err) => {
        console.log(err);
      });
  });
}
