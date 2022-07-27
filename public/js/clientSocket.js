let userSocket = "";
let username = document.getElementById("mainUsername").innerHTML.trim();
let myEndpoint = "";
let friendEndpoint = "";
let friendList = "";

let socket = io();

socket.on("connect", () => {
  socket.emit("JoinUser", username);

  socket.on("JoinUser", () => {
    JoinUser(username);
  });
});

function JoinUser(endpoint) {
  myEndpoint = "/" + endpoint;
  console.log();
  if (userSocket) {
    userSocket.close();
  }
  userSocket = io(`localhost:7777/${endpoint}`, {
    query: {
      username,
    },
  });

  userSocket.on("connect", () => {
    console.log("connected To the Socket");
    userSocket.emit("login", { userId: endpoint });

    vm.myEndpoint = myEndpoint;
    SetOnlineStatus();
    ManageFriendList();
    ManageChats();
    ManageFriendRequests();
  });

  userSocket.on("disconnect", (reason) => {
    if (reason === "io server disconnect") {
      socket.connect();
    }
    console.log("disconnected from socket");
  });
}

function GetOnlineStatus(friendNs) {
  console.log("-sendns-" + friendNs);
  userSocket.emit("GetOnlineStatus", { endpoint: friendNs });
}

function SetOnlineStatus() {
  userSocket.on("SetOnlineStatus", (data) => {
    for (let i = 0; i < friendList.length; i++) {
      if (
        data.ns === vm.$refs.friends[i].friend.endpoint &&
        data.status === "online"
      ) {
        vm.$refs.friends[i].SwitchStatus(true);
      } else if (
        data.ns === vm.$refs.friends[i].friend.endpoint &&
        data.status === "offline"
      ) {
        vm.$refs.friends[i].SwitchStatus(false);
      }
    }
  });
}

function ManageFriendRequests() {
  userSocket.on("LoadSentFriendRequest", (data) => {
    vm.ShowSentFriendRequest(data.sentRequest);
  });

  userSocket.on("LoadReceivedFriendRequest", (data) => {
    vm.ShowReceivedFriendRequest(data.receivedRequest);
  });

  userSocket.on("updateSentRequest", (data, callback) => {
    if (data.sentRequest != "") {
      vm.ShowSentFriendRequest(data.sentRequest);
      vm.ReturnToManageFriendTab();
      callback();
    }
  });

  userSocket.on("updateReceivedRequest", (data) => {
    if (data.receiveRequest != "") {
      console.log("friendRequest Received");
      console.log(data.receivedRequest);
      vm.ShowReceivedFriendRequest(data.receivedRequest);
    }
  });

  userSocket.on("RemoveUnavaliableFriendRequest", (data) => {
    vm.RemoveUnavaliableRequest("/" + data);
  });

  userSocket.on("ShowAcceptedFriendInList", (user) => {
    vm.ShowFriendList(user);
  });
}

function AcceptFriendRequest(fromUser, toUser) {
  senderUsername = toUser;
  myUsername = fromUser;

  userSocket.emit(
    "AcceptFriendRequest",
    { senderName: senderUsername, myName: myUsername },
    (result) => {
      userSocket.emit("RemoveUnavaliableFriendRequest", {
        senderName: senderUsername,
        myName: myUsername,
      });
      vm.CancelReceivedRequest("/" + senderUsername);
      userSocket.emit("GetAcceptedFriendInList", {
        senderName: senderUsername,
        myName: myUsername,
      });
    }
  );
}

function CancelFriendRequest(fromUser, toUser) {
  senderUsername = toUser;
  myUsername = fromUser;

  userSocket.emit(
    "CancelFriendRequest",
    { senderName: senderUsername, myName: myUsername },
    () => {
      userSocket.emit("RemoveUnavaliableFriendRequest", {
        senderName: senderUsername,
        myName: myUsername,
      });
      vm.RemoveUnavaliableRequest("/" + senderUsername);
    }
  );
}

function RejectFriendRequest(fromUser, toUser) {
  senderUsername = toUser;
  myUsername = fromUser;

  userSocket.emit(
    "RejectFriendRequest",
    { senderName: senderUsername, myName: myUsername },
    () => {
      userSocket.emit("RemoveUnavaliableFriendRequest", {
        senderName: senderUsername,
        myName: myUsername,
      });
      vm.RemoveUnavaliableRequest("/" + senderUsername);
    }
  );
}

function ManageFriendList() {
  console.log("ask for friendlist");
  userSocket.emit("getFriendList", { username });

  userSocket.on("sendFriedsList", (data) => {
    console.log(data.friendList);
    friendList = data.friendList;
    friendList.forEach((user) => {
      if (user) {
        vm.ShowFriendList(user);
      }
    });
  });
}

function GetLastMsg(username) {
  userSocket.emit("GetLastMsg", { username }, (result) => {
    console.log("result");
    console.log(username + " last msg was " + result.text);
  });
}

function GetAllChats(friendEndpoint) {
  userSocket.emit(
    "JoinFriendEndpoint",
    { sender: myEndpoint, receiver: friendEndpoint },
    (chats) => {
      let latestChats = chats.slice(chats.length - 50, chats.length);

      vm.ShowAllChats(latestChats);
      console.log(latestChats);
    }
  );
}

function AddClickEventToFriendList() {
  let roomNodes = document.getElementsByClassName("room");
  console.log(roomNodes);
  Array.from(roomNodes).forEach((elem) => {
    elem.addEventListener("click", (e) => {
      ClearChats();
      friendEndpoint = e.currentTarget.getAttribute("ns");
      userSocket.emit(
        "JoinFriendEndpoint",
        { sender: myEndpoint, receiver: friendEndpoint },
        (chats) => {
          let latestChats = chats.slice(chats.length - 50, chats.length);
          latestChats.forEach((data) => {
            CreateMsg(data, myEndpoint);
            return;
          });
        }
      );
    });
  });
}

function ManageChats() {
  userSocket.on("messageToClient", (fullMsg) => {
    console.log(fullMsg);
    console.log(friendEndpoint);
    if (fullMsg.ns === friendEndpoint) {
      console.log("message received");
      vm.ShowMessage(fullMsg);
    } else {
      //showNotification if online
    }
  });
}
