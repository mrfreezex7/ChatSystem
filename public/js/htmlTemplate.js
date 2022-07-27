function ClearChats() {
    document.getElementById("messages").innerHTML = "";
}

function CreateMsg(fullMsg, myEndpoint) {

    if (fullMsg.ns === myEndpoint) {
        document.getElementById("messages").innerHTML += `<article class="right">
        <div class="avatar">
            <img src="${fullMsg.avatar}" alt="">
        </div>
        <div class="msg">
            <div class="pointer"></div>
            <div class="inner-msg">
                <p>${fullMsg.text}</p>
            </div>
        </div>
    </article>`
    } else {
        document.getElementById("messages").innerHTML += `<article>
    <div class="avatar">
        <img src="${fullMsg.image}" alt="">
    </div>
    <div class="msg">
        <div class="pointer"></div>
        <div class="inner-msg">
            <p>${fullMsg.text}</p>
        </div>
    </div>
</article>`
    }


}

function ShowFriendList(user) {

    document.getElementById("userListSpawnPoint").innerHTML += `
    <li  class="room" ns=${user.endpoint} rm=${user.endpoint}>
    <div class="avatar top">
        <img src="/${user.image}" alt="">
        <div class="status online"></div>
    </div>
    <div class="users-list">
        <div class="username">
            <p>${user.username}</p>
        </div>
        <div class="text">
            <p>${user.text}</p>
        </div>
    </div>
    <div class="timestamp">
        <p>---</p>
    </div>
</li>`

}

function ShowReceivedFriendRequest(username) {
    document.getElementById("ReceivedbuttonSpawnPoint").innerHTML +=
        `<button id="${username}" onclick="AcceptFriendRequest(this)">${username}</button>`;
}

function ShowSentFriendRequest(username) {
    document.getElementById("SendbuttonSpawnPoint").innerHTML +=
        `<button id="${username}" onclick="CancelFriendRequest(this)">${username}</button>`;
}
