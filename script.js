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
    localStorage.setItem("aiChats", JSON.stringify(chats));
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = "en-US";

recognition.onresult = function(event){
    const transcript = event.results[0][0].transcript;
    messageInput.value = transcript;
};

voiceBtn.addEventListener("click", () => {
    voiceBtn.classList.add("recording");
    recognition.start();
});

recognition.onend = () => {
    voiceBtn.classList.remove("recording");
};

function loadChats() {
    const savedChats = localStorage.getItem("aiChats");
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
    const mode = modeSelect ? modeSelect.value.toLowerCase() : "quick"; 

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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: finalPrompt })
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
        console.error("Fetch Error:", error);
    }
}

function addMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");

    if (sender === "user") {
        messageDiv.classList.add("user-message");
    } else {
        messageDiv.classList.add("bot-message");
    }

    // Add the actual text inside a span so it formats cleanly
    const textSpan = document.createElement("span");
    textSpan.innerText = text;
    messageDiv.appendChild(textSpan);

    // ==========================================
    // 1. BUTTONS FOR BOT MESSAGES
    // ==========================================
    if (sender === "bot") {
        const speakBtn = document.createElement("button");
        speakBtn.innerText = "🔊";
        speakBtn.classList.add("speak-btn");
        speakBtn.onclick = () => {
            if (currentSpeech) {
                speechSynthesis.cancel();
                currentSpeech = null;
                if (currentSpeakBtn) currentSpeakBtn.innerText = "🔊";
                if (currentSpeakBtn === speakBtn) {
                    currentSpeakBtn = null;
                    return;
                }
            }
            const speech = new SpeechSynthesisUtterance(text);
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

        const copyBtn = document.createElement("button");
        copyBtn.innerText = "📋";
        copyBtn.classList.add("copy-btn");
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(text);
            copyBtn.innerText = "✅";
            setTimeout(() => { copyBtn.innerText = "📋"; }, 1500);
        };

        messageDiv.appendChild(speakBtn);
        messageDiv.appendChild(copyBtn);
    }

    // ==========================================
    // 2. BUTTON FOR USER MESSAGES
    // ==========================================
    if (sender === "user") {
        console.log("SUCCESS: Loading user copy button logic."); // Debugger
        const copyUserBtn = document.createElement("button");
        copyUserBtn.innerText = "📋";
        copyUserBtn.classList.add("copy-btn", "copy-question-btn"); 
        
        copyUserBtn.onclick = () => {
            navigator.clipboard.writeText(text);
            copyUserBtn.innerText = "✅";
            setTimeout(() => { copyUserBtn.innerText = "📋"; }, 1500);
        };

        messageDiv.appendChild(copyUserBtn);
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
    const typingDiv = document.createElement("div");
    typingDiv.classList.add("message", "bot-message");
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
newChatBtn.addEventListener("click", createNewChat);

loadChats();
if(chats.length === 0){
    createNewChat();
}

// ==========================================
// LIVE ACADEMIC DASHBOARD LOGIC
// ==========================================
async function loadAcademicProfile() {
    try {
        // 1. Fetch the live data from your backend route
        const response = await fetch("http://localhost:3000/profile");
        const profile = await response.json();
        
        // 2. Find or create the dashboard container in the sidebar
        let dashboard = document.getElementById("academicDashboard");
        if (!dashboard) {
            dashboard = document.createElement("div");
            dashboard.id = "academicDashboard";
            dashboard.style.padding = "20px";
            dashboard.style.borderBottom = "1px solid rgba(255, 255, 255, 0.1)";
            dashboard.style.marginBottom = "10px";
            dashboard.style.background = "rgba(0, 0, 0, 0.2)";
            
            // Insert it right above the Chat List in the sidebar
            chatList.parentNode.insertBefore(dashboard, chatList);
        }

        // 3. Create the clickable tags for weak points
        let weakPointsHtml = profile.weak_points.map(wp => `
            <span onclick="markAsLearned('${wp}')" 
                  style="display: inline-flex; align-items: center; background: rgba(255, 80, 80, 0.15); border: 1px solid rgba(255, 80, 80, 0.3); color: #ffcccc; padding: 4px 10px; border-radius: 12px; font-size: 11px; margin: 4px 4px 0 0; cursor: pointer; transition: all 0.2s ease;" 
                  title="Click to mark as mastered!"
                  onmouseover="this.style.background='rgba(74, 222, 128, 0.2)'; this.style.borderColor='rgba(74, 222, 128, 0.5)'; this.style.color='#4ade80';"
                  onmouseout="this.style.background='rgba(255, 80, 80, 0.15)'; this.style.borderColor='rgba(255, 80, 80, 0.3)'; this.style.color='#ffcccc';">
                ${wp} <span class="material-symbols-outlined" style="font-size: 12px; margin-left: 4px;">check_circle</span>
            </span>
        `).join('');

        // 4. Render the HTML
        dashboard.innerHTML = `
            <div style="font-size: 11px; color: #a3a3a3; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 5px;">
                <span class="material-symbols-outlined" style="font-size: 14px;">school</span> Academic Profile
            </div>
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #ffffff;">
                Target: ${profile.target_exam}
            </div>
            <div style="font-size: 12px; color: #a3a3a3; margin-bottom: 6px;">Focus Areas (Click to Master):</div>
            <div>${weakPointsHtml || '<span style="color: #4ade80; font-size: 12px; display: flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 14px;">verified</span> All caught up!</span>'}</div>
        `;
    } catch (error) {
        console.error("Could not load academic profile", error);
    }
}

// Function triggered when you click a tag
async function markAsLearned(topic) {
    try {
        await fetch("http://localhost:3000/update-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mastered_topic: topic })
        });
        
        // Reload the dashboard instantly to show the tag disappearing
        loadAcademicProfile(); 
    } catch(err) {
        console.error(err);
    }
}

// Fire the function immediately when the app loads
loadAcademicProfile();