let chats = [];
let currentChatId = null;
const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const chatList = document.getElementById("chatList");
const voiceBtn = document.getElementById("voiceBtn");
let currentSpeech = null;
let currentSpeakBtn = null;

function saveChats() {
    localStorage.setItem(
        "aiChats",
        JSON.stringify(chats)
    );
}





const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

const recognition =
    new SpeechRecognition();

recognition.lang = "en-US";

recognition.onresult = function(event){

    const transcript =
        event.results[0][0].transcript;

    messageInput.value = transcript;

};

voiceBtn.addEventListener("click", () => {

    voiceBtn.classList.add("recording");

    recognition.start();

});
recognition.onend = () => {

    voiceBtn.classList.remove(
        "recording"
    );

};

function loadChats() {

    const savedChats =
        localStorage.getItem("aiChats");

    if(savedChats){

        chats = JSON.parse(savedChats);

        renderChatList();

        if(chats.length > 0){

            currentChatId = chats[0].id;

            loadChat(currentChatId);

        }

    }

}

async function sendMessage() {
    const rawMessage = messageInput.value.trim();

    if(rawMessage === "") return;

    // 1. Show the user's normal typed text in the chat UI
    addMessage(rawMessage, "user");
    
    const currentChat = chats.find(c => c.id === currentChatId);

    if(currentChat){
        currentChat.messages.push({
            sender: "user",
            text: rawMessage
        });
        saveChats();
    }

    messageInput.value = "";
    showTyping();

    // 2. Grab the selected mode from the HTML dropdown
    const modeSelect = document.getElementById("modeSelect");
    const mode = modeSelect.value.toLowerCase(); 

    // 3. Format the hidden prompt based on the mode
    let finalPrompt = rawMessage;

    if(mode === "quick"){
        finalPrompt = "Answer briefly:\n\n" + rawMessage;
    } else if(mode === "think"){
        finalPrompt = "Think step-by-step and explain:\n\n" + rawMessage;
    } else if(mode === "research"){
        finalPrompt = "Provide a detailed research-style answer:\n\n" + rawMessage;
    }

    try {
        const response = await fetch("http://localhost:3000/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                // Send the modified finalPrompt to the AI, not the raw message
                message: finalPrompt 
            })
        });

        const data = await response.json();
        removeTyping();

        const botReply = data.reply;
        addMessage(botReply, "bot");

        if(currentChat){
            currentChat.messages.push({
                sender:"bot",
                text:botReply
            });
            saveChats();
        }

    } catch(error){
        removeTyping();
        addMessage("Error contacting AI.", "bot");
        console.error(error);
    }
}

function addMessage(text, sender){

    const messageDiv = document.createElement("div");

    messageDiv.classList.add("message");

    if(sender === "user"){
        messageDiv.classList.add("user-message");
    }else{
        messageDiv.classList.add("bot-message");
    }

    messageDiv.innerHTML = `
    <span>${text}</span>
`;
if(sender === "bot"){

    const speakBtn =
        document.createElement("button");

    speakBtn.innerText = "🔊";

    speakBtn.classList.add("speak-btn");

    speakBtn.onclick = () => {

        // If this message is already speaking, stop it
        if(currentSpeech){

            speechSynthesis.cancel();

            currentSpeech = null;

            if(currentSpeakBtn){
                currentSpeakBtn.innerText = "🔊";
            }

            // If same button clicked, just stop
            if(currentSpeakBtn === speakBtn){
                currentSpeakBtn = null;
                return;
            }
        }

        const speech =
            new SpeechSynthesisUtterance(text);

        currentSpeech = speech;
        currentSpeakBtn = speakBtn;

        speakBtn.innerText = "⏹";

        speech.onend = () => {

            speakBtn.innerText = "🔊";

            currentSpeech = null;
            currentSpeakBtn = null;

        };

        speechSynthesis.speak(speech);

    };

    const copyBtn =
        document.createElement("button");

    copyBtn.innerText = "📋";

    copyBtn.classList.add("copy-btn");

    copyBtn.onclick = () => {

        navigator.clipboard.writeText(text);

        copyBtn.innerText = "✅";

        setTimeout(() => {
            copyBtn.innerText = "📋";
        }, 1500);

    };

    messageDiv.appendChild(speakBtn);
    messageDiv.appendChild(copyBtn);
}


    chatBox.appendChild(messageDiv);

    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {

    const typingDiv = document.createElement("div");

    typingDiv.classList.add("message");
    typingDiv.classList.add("bot-message");

    typingDiv.id = "typingIndicator";

    typingDiv.innerText = "AI is typing...";

    chatBox.appendChild(typingDiv);

    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {

    const typing = document.getElementById("typingIndicator");

    if(typing){
        typing.remove();
    }

}

function createNewChat() {

    const chatId = Date.now();

    const chat = {
        id: chatId,
        title: `Chat ${chats.length + 1}`,
        messages: []
    };

    chats.push(chat);
    saveChats();

    currentChatId = chatId;

    renderChatList();

    chatBox.innerHTML = "";
}

function renderChatList() {

    chatList.innerHTML = "";

    chats.forEach(chat => {

        const chatItem = document.createElement("div");

        chatItem.classList.add("chat-item");

        chatItem.innerText = chat.title;

        chatItem.onclick = () => {
            currentChatId = chat.id;
            loadChat(chat.id);
        };

        chatList.appendChild(chatItem);

    });

}

function loadChat(chatId) {

    const chat = chats.find(c => c.id === chatId);

    if (!chat) return;

    chatBox.innerHTML = "";

    chat.messages.forEach(msg => {
        addMessage(msg.text, msg.sender);
    });

}
sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keypress", function(e){

    if(e.key === "Enter"){
        sendMessage();
    }

});
newChatBtn.addEventListener(
    "click",
    createNewChat
);
loadChats();

if(chats.length === 0){
    createNewChat();
}
