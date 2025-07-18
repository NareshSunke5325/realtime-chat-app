let typingTimeout;
let stompClient = null;
let isConnected = false;
let globalSenderId = "";
let currentTopic = "";

function connect() {
    const senderId = document.getElementById('senderId').value.trim();
    const receiverId = document.getElementById('receiverId').value.trim();
    if (!senderId || !receiverId || isConnected) return;

    globalSenderId = senderId;
    const sorted = [senderId, receiverId].sort();
    currentTopic = "/topic/conversation/" + sorted[0] + "_" + sorted[1];

    document.getElementById("receiverHeader").innerText = "Chat with: " + receiverId;

    const socket = new SockJS('/chat');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function () {
        isConnected = true;

        stompClient.subscribe(currentTopic, function (message) {
            const msg = JSON.parse(message.body);
            const typingBubble = document.getElementById("typing-bubble");
            if (typingBubble) typingBubble.remove();

            const li = document.createElement("li");
            li.classList.add("message");

            if (msg.senderId === globalSenderId) {
                li.classList.add("sender");
            } else {
                li.classList.add("receiver");
            }

            li.innerText = msg.content;
            document.getElementById("messages").appendChild(li);
            scrollToBottom();
        });

        stompClient.subscribe(currentTopic + "/typing", function (typingMsg) {
            const typingData = JSON.parse(typingMsg.body);
            if (typingData.senderId !== globalSenderId) {
                const existingBubble = document.getElementById("typing-bubble");
                if (existingBubble) existingBubble.remove();

                const typingLi = document.createElement("li");
                typingLi.id = "typing-bubble";
                typingLi.classList.add("message", "receiver");
                typingLi.style.fontStyle = "italic";
                typingLi.style.color = "gray";
                typingLi.innerText = typingData.senderId + " is typing...";

                document.getElementById("messages").appendChild(typingLi);

                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    const bubble = document.getElementById("typing-bubble");
                    if (bubble) bubble.remove();
                }, 1500);

                scrollToBottom();
            }
        });
    });
}

function scrollToBottom() {
    const chatArea = document.getElementById("chatArea");
    chatArea.scrollTop = chatArea.scrollHeight;
}

function sendMessage() {
    const senderId = document.getElementById('senderId').value.trim();
    const receiverId = document.getElementById('receiverId').value.trim();
    const content = document.getElementById('message').value.trim();

    if (!content) return;

    if (stompClient && stompClient.connected) {
        stompClient.send("/app/chat.send", {}, JSON.stringify({
            senderId: senderId,
            receiverId: receiverId,
            content: content
        }));
        document.getElementById('message').value = "";
    } else {
        alert("Not connected to WebSocket");
    }
}

function tryAutoConnect() {
    const sender = document.getElementById("senderId").value.trim();
    const receiver = document.getElementById("receiverId").value.trim();
    if (sender && receiver) {
        connect();
    }
}

function sendTypingNotification() {
    const senderId = document.getElementById('senderId').value.trim();
    const receiverId = document.getElementById('receiverId').value.trim();
    if (!senderId || !receiverId || !stompClient?.connected) return;

    stompClient.send("/app/chat.typing", {}, JSON.stringify({
        senderId: senderId,
        receiverId: receiverId
    }));
}

window.onload = () => {
    document.getElementById("receiverId").addEventListener("blur", tryAutoConnect);
    document.getElementById("senderId").addEventListener("blur", tryAutoConnect);
    document.getElementById("sendBtn").onclick = sendMessage;

    document.getElementById("message").addEventListener("keypress", function (e) {
        if (e.key === "Enter") sendMessage();
    });

    document.getElementById("message").addEventListener("input", function () {
        sendTypingNotification();
    });
};
