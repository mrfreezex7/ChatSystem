var chatComponent = {
  props: {
    chat: {
      type: Object,
      required: true,
    },
    myEndpoint: {
      type: String,
      required: true,
    },
  },
  template: `<article :class="[ myEndpoint==chat.ns ? 'right' : '' ]">
    <img :src="'/'+chat.avatar" alt="">
    <div class="msg">
        <p>{{chat.text}}</p>
    </div>
</article>`,
};

var searchedFriendComponent = {
  props: {
    searchedFriend: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      fromUser: username,
      toUser: this.searchedFriend.username,
    };
  },
  methods: {
    SendFriendRequest: function () {
      userSocket.emit("SendFriendRequest", {
        fromUser: this.fromUser,
        toUser: this.toUser,
      });
    },
  },
  template: `<li class="friendTemplate">
    <div class="avatar">
        <img :src="searchedFriend.image" alt="img">
    </div>
    <div class="friend-detail">
        <h1>{{searchedFriend.username}}</h1>
        <p>Game Developer</p>
    </div>
    <div>
        <button @click="SendFriendRequest">Send</button>
    </div>
    <p class="friend-last-time-stamp">
    </p>
</li>`,
};

var sentFriendRequestComponent = {
  props: {
    friendRequest: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      fromUser: username,
      toUser: this.friendRequest.username,
    };
  },
  methods: {
    CancelSentRequest: function () {
      CancelFriendRequest(this.fromUser, this.toUser);
    },
  },
  template: `<li class="friendTemplate">
    <div class="avatar">
        <img :src="'/'+friendRequest.image" alt="img">
    </div>
    <div class="friend-detail">
        <h1>{{friendRequest.username}}</h1>
    </div>
    <button class="round-button" @click="CancelSentRequest">cancel</button>
</li>`,
};

var receivedFriendRequestComponent = {
  props: {
    friendRequest: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      fromUser: username,
      toUser: this.friendRequest.username,
    };
  },
  methods: {
    AcceptReceivedRequest: function () {
      AcceptFriendRequest(this.fromUser, this.toUser);
    },
    CancelReceivedRequest: function () {
      RejectFriendRequest(this.fromUser, this.toUser);
      console.log("runing");
    },
  },
  template: ` <li class="friendTemplate">
        <div class="avatar">
            <img :src="'/'+friendRequest.image" alt="img">
        </div>
        <div class="friend-detail">
            <h1>{{friendRequest.username}}</h1>
        </div>
        <button class="round-button" @click="AcceptReceivedRequest">Accept</button>
        <button class="round-button" @click="CancelReceivedRequest">cancel</button>
    </li>`,
};

var friendComponent = {
  props: {
    friend: {
      type: Object,
      required: true,
    },
    selectedFriend: {
      type: Object,
    },
  },
  data: function () {
    return {
      friendData: this.friend,
      isOnline: false,
    };
  },
  methods: {
    SwitchStatus: function (status) {
      this.isOnline = status;
    },
    select: function () {
      if (this.selectedFriend === this.friendData)
        console.log("already Selected");
      else this.$emit("select", this.friendData);
    },
  },
  computed: {
    isSelected: function () {
      if (this.selectedFriend === null) return;
      return this.friendData.endpoint === this.selectedFriend.endpoint;
    },
  },
  mounted() {
    GetOnlineStatus(this.friendData.endpoint);
  },
  template: `<li class="friendTemplate" :class="[ isSelected ? 'selected' : 'hover' ]" @click="select">
    <div class="avatar">
        <img :src="friend.image" alt="img">
        <div class="status" :class="[ isOnline ? 'online' : 'offline' ]"></div>
    </div>
    <div class="friend-detail">
        <h1>{{friend.username}}</h1>
        <p>Game Developer</p>
    </div>
    <p class="friend-last-time-stamp">
    </p>
</li>`,
};

var vm = new Vue({
  el: "#container",
  data() {
    return {
      myEndpoint: "",
      friends: [],
      selectedFriend: null,
      chats: [],
      TabType: 0, //0=friend list //1=manage //2=settings
      searchString: "",
      FriendSearchResult: [],
      SentFriendRequest: [],
      ReceivedFriendRequest: [],
    };
  },
  methods: {
    ShowFriendList: function (friend) {
      this.friends.push(friend);
    },
    SelectFriend: function (friendData) {
      this.selectedFriend = friendData;
      this.SetupChat(friendData);
      friendEndpoint = friendData.endpoint;
      this.scrollToEnd();
    },
    SetupChat: function (friendData) {
      console.log(friendData);
      GetAllChats(friendData.endpoint);
    },
    ShowAllChats: function (chats) {
      this.chats = [];
      this.chats = chats;
    },
    SendMessage: function () {
      const Message = document.getElementById("input-msg").value.trim();
      if (Message == "") return;
      userSocket.emit(
        "newMsgToServer",
        {
          sender: this.myEndpoint,
          receiver: this.selectedFriend.endpoint,
          text: Message,
        },
        (newMsg) => {
          this.ShowMessage(newMsg);
          document.getElementById("input-msg").value = "";
        }
      );
    },
    ShowMessage: function (message) {
      this.chats.push(message);
      this.scrollToEnd();
    },
    SetTabType: function (TabType) {
      this.TabType = TabType;
    },
    SearchFriends: function (event) {
      const SearchString = event.target.value.trim();
      if (SearchString == "") {
        this.FriendSearchResult = [];
      } else {
        userSocket.emit(
          "GetSearchedFriend",
          { sender: this.myEndpoint, searchString: SearchString },
          (searchResult) => {
            this.FriendSearchResult = [];
            searchResult.forEach((user) => {
              console.log(user);
              this.FriendSearchResult.push(user);
            });
          }
        );
      }
    },
    ShowSentFriendRequest: function (username) {
      this.SentFriendRequest.push(username);
    },
    ShowReceivedFriendRequest: function (username) {
      this.ReceivedFriendRequest.push(username);
    },
    CancelSentRequest: function (endpoint) {
      for (let i = 0; i < this.SentFriendRequest.length; i++) {
        console.log(endpoint + "===" + this.SentFriendRequest[i].endpoint);
        if (this.SentFriendRequest[i].endpoint === endpoint) {
          this.SentFriendRequest.splice(this.SentFriendRequest[i], 1);
        }
      }
    },
    CancelReceivedRequest: function (endpoint) {
      for (let i = 0; i < this.ReceivedFriendRequest.length; i++) {
        console.log(endpoint + "===" + this.ReceivedFriendRequest[i].endpoint);
        if (this.ReceivedFriendRequest[i].endpoint === endpoint) {
          this.ReceivedFriendRequest.splice(this.SentFriendRequest[i], 1);
        }
      }
    },
    RemoveUnavaliableRequest: function (endpoint) {
      for (let i = 0; i < this.SentFriendRequest.length; i++) {
        console.log(endpoint + "===" + this.SentFriendRequest[i].endpoint);
        if (this.SentFriendRequest[i].endpoint === endpoint) {
          this.SentFriendRequest.splice(this.SentFriendRequest[i], 1);
        }
      }
      for (let i = 0; i < this.ReceivedFriendRequest.length; i++) {
        console.log(endpoint + "===" + this.ReceivedFriendRequest[i].endpoint);
        if (this.ReceivedFriendRequest[i].endpoint === endpoint) {
          this.ReceivedFriendRequest.splice(this.SentFriendRequest[i], 1);
        }
      }
    },
    ReturnToManageFriendTab: function () {
      this.FriendSearchResult = [];
    },
    scrollToEnd: function () {
      var chatView = document.getElementById("chat-view");
      setTimeout(() => {
        chatView.scrollTop = chatView.scrollHeight;
      }, 0);
    },
  },
  components: {
    Friend: friendComponent,
    SearchedFriend: searchedFriendComponent,
    Chat: chatComponent,
    SentFriend: sentFriendRequestComponent,
    ReceivedFriend: receivedFriendRequestComponent,
  },
});
