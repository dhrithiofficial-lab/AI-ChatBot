// ==========================================
// Global Variables & DOM Elements
// ==========================================
let chats = [];
let currentChatId = null;

const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const chatList = document.getElementById("chatList");
const voiceBtn = document.getElementById("voiceBtn");
const modeSelect = document.getElementById("modeSelect");
const searchInput = document.getElementById("searchInput");

// Image Upload Variables
const fileInput = document.getElementById("fileInput");
const attachBtn = document.getElementById("attachBtn");
const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const imagePreview = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImageBtn");
let currentImageData = null; 
let currentImageMimeType = null; 

// Settings & Voice Variables
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const voiceSelect = document.getElementById("voiceSelect");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
let availableVoices = [];
let selectedVoiceURI = localStorage.getItem("aiVoiceURI") || "";

// ==========================================
// Local Storage & Chat History
// ==========================================
if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-mode");
    themeIcon.innerText = "dark_mode";
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    
    // Save preference
    if (document.body.classList.contains("light-mode")) {
        localStorage.setItem("theme", "light");
        themeIcon.innerText = "dark_mode";
    } else {
        localStorage.setItem("theme", "dark");
        themeIcon.innerText = "light_mode";
    }
});

function saveChats() {
    localStorage.setItem("aiChats", JSON.stringify(chats));
}

function loadChats() {
    const savedChats = localStorage.getItem("aiChats");
    if (savedChats) {
        chats = JSON.parse(savedChats);
        renderChatList();
        if (chats.length > 0) {
            currentChatId = chats[0].id;
            loadChat(currentChatId);
        }
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
    showWelcomeScreen();
}

function renderChatList(searchTerm = "") {
    chatList.innerHTML = "";
    
    // 1. Filter the chats based on the search term
    const filteredChats = chats.filter(chat => {
        const lowerTerm = searchTerm.toLowerCase();
        // Check if the title matches
        const titleMatch = chat.title.toLowerCase().includes(lowerTerm);
        // Check if any message inside the chat matches
        const messageMatch = chat.messages.some(msg => msg.text.toLowerCase().includes(lowerTerm));
        
        return titleMatch || messageMatch;
    });

    // 2. Show a "No results" message if nothing matches
    if (filteredChats.length === 0 && searchTerm !== "") {
        chatList.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 15px; font-size: 13px;">No results found for "${searchTerm}"</div>`;
        return;
    }

    // 3. Render the filtered list
    filteredChats.forEach(chat => {
        const chatItem = document.createElement("div");
        chatItem.classList.add("chat-item");
        
        if (chat.id === currentChatId) {
            chatItem.classList.add("active");
        }

        const titleSpan = document.createElement("span");
        titleSpan.classList.add("chat-title");
        titleSpan.innerText = chat.title;

        const actionsDiv = document.createElement("div");
        actionsDiv.classList.add("chat-actions");

        const editBtn = document.createElement("button");
        editBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px;">edit</span>`;
        editBtn.classList.add("action-btn");
        editBtn.title = "Rename Chat";
        editBtn.onclick = (e) => {
            e.stopPropagation(); 
            renameChat(chat.id);
        };

        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px;">delete</span>`;
        deleteBtn.classList.add("action-btn", "delete-btn");
        deleteBtn.title = "Delete Chat";
        deleteBtn.onclick = (e) => {
            e.stopPropagation(); 
            deleteChat(chat.id);
        };

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        chatItem.appendChild(titleSpan);
        chatItem.appendChild(actionsDiv);

        chatItem.onclick = () => {
            currentChatId = chat.id;
            loadChat(chat.id);
            renderChatList(searchInput.value); // Keep filter active when clicking
        };

        chatList.appendChild(chatItem);
    });
}

function loadChat(chatId) {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    
    chatBox.innerHTML = "";
    
    if (chat.messages.length === 0) {
        showWelcomeScreen();
    } else {
        chat.messages.forEach(msg => {
            addMessage(msg.text, msg.sender, false); 
        });
    }
}

function renameChat(chatId) {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    const newName = prompt("Enter a new name for this chat:", chat.title);
    if (newName && newName.trim() !== "") {
        chat.title = newName.trim();
        saveChats();
        renderChatList(); 
    }
}

function deleteChat(chatId) {
    const confirmDelete = confirm("Are you sure you want to delete this chat permanently?");
    if (!confirmDelete) return;

    chats = chats.filter(c => c.id !== chatId);
    saveChats();

    if (chats.length === 0) {
        createNewChat();
    } else {
        if (currentChatId === chatId) {
            currentChatId = chats[0].id;
            loadChat(currentChatId);
        }
        renderChatList(); 
    }
}

// ==========================================
// Settings & Voice Logic
// ==========================================
function loadVoices() {
    availableVoices = speechSynthesis.getVoices();
    voiceSelect.innerHTML = "";

    availableVoices.forEach(voice => {
        const option = document.createElement("option");
        option.value = voice.voiceURI;
        option.textContent = `${voice.name} (${voice.lang})`;
        if (voice.voiceURI === selectedVoiceURI) {
            option.selected = true;
        }
        voiceSelect.appendChild(option);
    });

    if (!selectedVoiceURI && availableVoices.length > 0) {
        selectedVoiceURI = availableVoices[0].voiceURI;
    }
}

speechSynthesis.onvoiceschanged = loadVoices;

settingsBtn.addEventListener("click", () => {
    if (availableVoices.length === 0) loadVoices(); 
    settingsModal.classList.add("show");
});

closeSettingsBtn.addEventListener("click", () => {
    settingsModal.classList.remove("show");
});

voiceSelect.addEventListener("change", (e) => {
    selectedVoiceURI = e.target.value;
    localStorage.setItem("aiVoiceURI", selectedVoiceURI);
});

// ==========================================
// Image Upload (Vision) Handling
// ==========================================
if(attachBtn && fileInput) {
    attachBtn.addEventListener("click", () => {
        fileInput.click();
    });

    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreviewContainer.style.display = "block";
            const base64String = e.target.result.split(',')[1];
            currentImageData = base64String;
            currentImageMimeType = file.type;
        };
        reader.readAsDataURL(file);
    });
}

if(removeImageBtn) {
    removeImageBtn.addEventListener("click", clearImagePreview);
}

function clearImagePreview() {
    fileInput.value = "";
    imagePreview.src = "";
    imagePreviewContainer.style.display = "none";
    currentImageData = null;
    currentImageMimeType = null;
}

// ==========================================
// Voice Input (Speech-to-Text)
// ==========================================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";

    recognition.onresult = function(event) {
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
} else {
    console.warn("Speech recognition is not supported in this browser.");
    voiceBtn.style.display = "none";
}

// ==========================================
// Messaging Logic
// ==========================================
async function sendMessage() {
    const rawMessage = messageInput.value.trim();
    if (rawMessage === "" && !currentImageData) return;

    const welcomeScreen = document.getElementById("welcomeScreen");
    if (welcomeScreen) welcomeScreen.remove();

    let displayHtml = rawMessage;
    if (currentImageData) {
        displayHtml = `<img src="data:${currentImageMimeType};base64,${currentImageData}" alt="User Image" style="max-width: 200px; border-radius: 8px; display: block; margin-bottom: 8px;">` + rawMessage;
    }

    addMessage(displayHtml, "user", true);
    messageInput.value = "";
    showTyping();

    const mode = modeSelect.value.toLowerCase();
    let finalPrompt = rawMessage;

    if (rawMessage !== "") {
        if (mode === "quick") {
            finalPrompt = "Answer briefly:\n\n" + rawMessage;
        } else if (mode === "think") {
            finalPrompt = "Think step-by-step and explain:\n\n" + rawMessage;
        } else if (mode === "research") {
            finalPrompt = "Provide a detailed research-style answer formatted cleanly:\n\n" + rawMessage;
        }
    } else if (currentImageData) {
        finalPrompt = "Please describe what is in this image.";
    }

    const payload = {
        message: finalPrompt,
        image: currentImageData ? {
            data: currentImageData,
            mimeType: currentImageMimeType
        } : null
    };

    clearImagePreview();

    try {
        const response = await fetch("http://localhost:3000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        removeTyping();
        addMessage(data.reply, "bot", true);

    } catch (error) {
        removeTyping();
        addMessage("Error contacting AI server. Is your backend running?", "bot", false);
        console.error(error);
    }
}

// ==========================================
// UI Rendering
// ==========================================
function showWelcomeScreen() {
    const currentHour = new Date().getHours();
    let greeting = "Welcome";

    if (currentHour >= 5 && currentHour < 12) {
        greeting = "Good Morning";
    } else if (currentHour >= 12 && currentHour < 17) {
        greeting = "Good Afternoon";
    } else if (currentHour >= 17 && currentHour < 22) {
        greeting = "Good Evening";
    } else {
        greeting = "Hello, Night Owl";
    }

    chatBox.innerHTML = `
        <div class="welcome-screen" id="welcomeScreen">
            <div class="welcome-icon">
                <span class="material-symbols-outlined" style="font-size: 40px; color: var(--accent);">
                    hub
                </span>
            </div>
            <h1 class="welcome-title" style="margin-bottom: 5px;">PRABHADRI AI</h1>
            <p style="color: var(--accent); font-weight: 500; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px;">
                ${greeting}
            </p>
            <p class="welcome-subtitle">How can I help you accelerate today?</p>
        </div>
    `;
}

function addMessage(text, sender, saveToHistory = false) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");

    if (sender === "user") {
        messageDiv.classList.add("user-message");
        messageDiv.innerHTML = `<span>${text}</span>`;
    } else {
        messageDiv.classList.add("bot-message");
        messageDiv.innerHTML = marked.parse(text); 
    }

    if (sender === "bot") {
        const controlsDiv = document.createElement("div");
        controlsDiv.style.marginTop = "15px";
        controlsDiv.style.display = "flex";
        controlsDiv.style.gap = "8px";

        const playPauseBtn = document.createElement("button");
        playPauseBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">play_circle</span> Play`;
        playPauseBtn.classList.add("speak-btn");

        const stopBtn = document.createElement("button");
        stopBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">stop_circle</span> Stop`;
        stopBtn.classList.add("speak-btn");
        stopBtn.style.display = "none";

        let speech = null;

        playPauseBtn.onclick = () => {
            if (speechSynthesis.speaking && speech) {
                if (speechSynthesis.paused) {
                    speechSynthesis.resume();
                    playPauseBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">pause_circle</span> Pause`;
                } else {
                    speechSynthesis.pause();
                    playPauseBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">play_circle</span> Resume`;
                }
            } else {
                speechSynthesis.cancel(); 
                
                // Fixed declaration here!
                // Convert the raw AI markdown into HTML, then extract ONLY the pure spoken words
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = marked.parse(text);
                const cleanText = tempDiv.textContent || tempDiv.innerText || "";

                speech = new SpeechSynthesisUtterance(cleanText);
                
                if (selectedVoiceURI) {
                    const chosenVoice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
                    if (chosenVoice) speech.voice = chosenVoice;
                }
                
                speech.onstart = () => {
                    playPauseBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">pause_circle</span> Pause`;
                    stopBtn.style.display = "inline-flex";
                };
                
                speech.onend = () => {
                    playPauseBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">play_circle</span> Play`;
                    stopBtn.style.display = "none";
                    speech = null;
                };

                speechSynthesis.speak(speech);
            }
        };

        stopBtn.onclick = () => {
            speechSynthesis.cancel();
            playPauseBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">play_circle</span> Play`;
            stopBtn.style.display = "none";
            speech = null;
        };

        const copyBtn = document.createElement("button");
        copyBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">content_copy</span> Copy`;
        copyBtn.classList.add("copy-btn");

        copyBtn.onclick = () => {
            navigator.clipboard.writeText(text);
            copyBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">check</span> Copied`;
            setTimeout(() => {
                copyBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">content_copy</span> Copy`;
            }, 2000);
        };

        controlsDiv.appendChild(playPauseBtn);
        controlsDiv.appendChild(stopBtn);
        controlsDiv.appendChild(copyBtn);
        messageDiv.appendChild(controlsDiv);
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (saveToHistory) {
        const currentChat = chats.find(c => c.id === currentChatId);
        if (currentChat) {
            currentChat.messages.push({ sender: sender, text: text });
            saveChats();
        }
    }
}

function showTyping() {
    const typingDiv = document.createElement("div");
    typingDiv.classList.add("message", "bot-message");
    typingDiv.id = "typingIndicator";
    typingDiv.innerHTML = `<span style="opacity: 0.7;">AI is typing...</span>`;
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
    const typing = document.getElementById("typingIndicator");
    if (typing) typing.remove();
}

// ==========================================
// Event Listeners & Initialization
// ==========================================
sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

// Search Bar Listener
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        renderChatList(e.target.value);
    });
}

newChatBtn.addEventListener("click", createNewChat);

// Init
loadChats();
if (chats.length === 0) {
    createNewChat();
}