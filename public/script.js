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
    if(themeIcon) themeIcon.innerText = "dark_mode";
}

if(themeToggle) {
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("light-mode");
        if (document.body.classList.contains("light-mode")) {
            localStorage.setItem("theme", "light");
            if(themeIcon) themeIcon.innerText = "dark_mode";
        } else {
            localStorage.setItem("theme", "dark");
            if(themeIcon) themeIcon.innerText = "light_mode";
        }
    });
}

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
    const chat = { id: chatId, title: `Chat ${chats.length + 1}`, messages: [] };
    chats.push(chat);
    saveChats();
    currentChatId = chatId;
    renderChatList();
    showWelcomeScreen();
}

function renderChatList(searchTerm = "") {
    if(!chatList) return;
    chatList.innerHTML = "";
    
    const filteredChats = chats.filter(chat => {
        const lowerTerm = searchTerm.toLowerCase();
        return chat.title.toLowerCase().includes(lowerTerm) || chat.messages.some(msg => msg.text.toLowerCase().includes(lowerTerm));
    });

    if (filteredChats.length === 0 && searchTerm !== "") {
        chatList.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 15px; font-size: 13px;">No results found for "${searchTerm}"</div>`;
        return;
    }

    filteredChats.forEach(chat => {
        const chatItem = document.createElement("div");
        chatItem.classList.add("chat-item");
        if (chat.id === currentChatId) chatItem.classList.add("active");

        const titleSpan = document.createElement("span");
        titleSpan.classList.add("chat-title");
        titleSpan.innerText = chat.title;

        const actionsDiv = document.createElement("div");
        actionsDiv.classList.add("chat-actions");

        const editBtn = document.createElement("button");
        editBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px;">edit</span>`;
        editBtn.classList.add("action-btn");
        editBtn.title = "Rename Chat";
        editBtn.onclick = (e) => { e.stopPropagation(); renameChat(chat.id); };

        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px;">delete</span>`;
        deleteBtn.classList.add("action-btn", "delete-btn");
        deleteBtn.title = "Delete Chat";
        deleteBtn.onclick = (e) => { e.stopPropagation(); deleteChat(chat.id); };

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        chatItem.appendChild(titleSpan);
        chatItem.appendChild(actionsDiv);

        chatItem.onclick = () => {
            currentChatId = chat.id;
            loadChat(chat.id);
            renderChatList(searchInput ? searchInput.value : ""); 
        };
        chatList.appendChild(chatItem);
    });
}

function loadChat(chatId) {
    const glare = document.getElementById("glareEffect");
    if (glare) glare.classList.remove("active-welcome");
    const chat = chats.find(c => c.id === chatId);
    if (!chat || !chatBox) return;
    
    chatBox.innerHTML = "";
    if (chat.messages.length === 0) showWelcomeScreen();
    else chat.messages.forEach(msg => { addMessage(msg.text, msg.sender, false); });
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
    if (!confirm("Are you sure you want to delete this chat permanently?")) return;
    chats = chats.filter(c => c.id !== chatId);
    saveChats();
    if (chats.length === 0) createNewChat();
    else {
        if (currentChatId === chatId) { currentChatId = chats[0].id; loadChat(currentChatId); }
        renderChatList(); 
    }
}

// ==========================================
// Settings & Voice Logic
// ==========================================
function loadVoices() {
    availableVoices = speechSynthesis.getVoices();
    if(!voiceSelect) return;
    voiceSelect.innerHTML = "";
    availableVoices.forEach(voice => {
        const option = document.createElement("option");
        option.value = voice.voiceURI;
        option.textContent = `${voice.name} (${voice.lang})`;
        if (voice.voiceURI === selectedVoiceURI) option.selected = true;
        voiceSelect.appendChild(option);
    });
    if (!selectedVoiceURI && availableVoices.length > 0) selectedVoiceURI = availableVoices[0].voiceURI;
}
speechSynthesis.onvoiceschanged = loadVoices;

if(settingsBtn) settingsBtn.addEventListener("click", () => { if (availableVoices.length === 0) loadVoices(); settingsModal.classList.add("show"); });
if(closeSettingsBtn) closeSettingsBtn.addEventListener("click", () => settingsModal.classList.remove("show"));
if(voiceSelect) voiceSelect.addEventListener("change", (e) => { selectedVoiceURI = e.target.value; localStorage.setItem("aiVoiceURI", selectedVoiceURI); });

// ==========================================
// Image Upload (Vision) Handling
// ==========================================
if(attachBtn && fileInput) {
    attachBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            if(imagePreview) imagePreview.src = e.target.result;
            if(imagePreviewContainer) imagePreviewContainer.style.display = "block";
            currentImageData = e.target.result.split(',')[1];
            currentImageMimeType = file.type;
        };
        reader.readAsDataURL(file);
    });
}
if(removeImageBtn) removeImageBtn.addEventListener("click", clearImagePreview);

function clearImagePreview() {
    if(fileInput) fileInput.value = "";
    if(imagePreview) imagePreview.src = "";
    if(imagePreviewContainer) imagePreviewContainer.style.display = "none";
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
    recognition.onresult = function(event) { if(messageInput) messageInput.value = event.results[0][0].transcript; };
    if(voiceBtn) voiceBtn.addEventListener("click", () => { voiceBtn.classList.add("recording"); recognition.start(); });
    recognition.onend = () => { if(voiceBtn) voiceBtn.classList.remove("recording"); };
} else {
    console.warn("Speech recognition is not supported in this browser.");
    if(voiceBtn) voiceBtn.style.display = "none";
}

// ==========================================
// Messaging Logic (Phase 1 & 3 Integration)
// ==========================================
async function sendMessage() {
    if(!messageInput) return;
    const rawMessage = messageInput.value.trim();
    if (rawMessage === "" && !currentImageData) return;

    const welcomeScreen = document.getElementById("welcomeScreen");
    if (welcomeScreen) welcomeScreen.remove();

    let displayHtml = rawMessage;
    if (currentImageData) displayHtml = `<img src="data:${currentImageMimeType};base64,${currentImageData}" alt="User Image" style="max-width: 200px; border-radius: 8px; display: block; margin-bottom: 8px;">` + rawMessage;

    addMessage(displayHtml, "user", true);
    messageInput.value = "";
    showTyping();

    // PHASE 1: 1-TURN MEMORY HACK
    let memoryContext = "";
    const currentChat = chats.find(c => c.id === currentChatId);
    if (currentChat && currentChat.messages.length > 1) {
        for (let i = currentChat.messages.length - 2; i >= 0; i--) {
            if (currentChat.messages[i].sender === "bot") {
                memoryContext = `[Context from your previous reply: "${currentChat.messages[i].text}"]\n\n`;
                break; 
            }
        }
    }

    let combinedMessage = rawMessage;
    if (memoryContext !== "") combinedMessage = memoryContext + `[My follow-up question]: ${rawMessage}`;

    const mode = modeSelect ? modeSelect.value.toLowerCase() : "standard";
    let finalPrompt = combinedMessage; 

    if (rawMessage !== "") {
        if (mode === "quick") finalPrompt = "Answer briefly:\n\n" + combinedMessage;
        else if (mode === "think") finalPrompt = "Think step-by-step and explain:\n\n" + combinedMessage;
        else if (mode === "research") finalPrompt = "Provide a detailed research-style answer formatted cleanly:\n\n" + combinedMessage;
    } else if (currentImageData) finalPrompt = "Please describe what is in this image.";

    const payload = { message: finalPrompt, image: currentImageData ? { data: currentImageData, mimeType: currentImageMimeType } : null };
    clearImagePreview();

    try {
        const response = await fetch("http://localhost:3000/chat", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        });

        const data = await response.json();
        removeTyping();
        let botReply = data.reply || data.response;

        // PHASE 3: AUTONOMOUS PROFILE UPDATING
        const weaknessMatch = botReply.match(/\[NEW_WEAKNESS:\s*(.+?)\]/);
        if (weaknessMatch) {
            const newTopic = weaknessMatch[1];
            botReply = botReply.replace(weaknessMatch[0], '').trim();
            fetch("http://localhost:3000/update-profile", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ new_weakness: newTopic })
            }).then(() => setTimeout(loadAcademicProfile, 500)).catch(err => console.error(err));
        }

        addMessage(botReply, "bot", true);

    } catch (error) {
        removeTyping();
        addMessage("Error contacting AI server. Is your backend running?", "bot", false);
        console.error(error);
    }
}

// ==========================================
// UI Rendering & Message Bubbles
// ==========================================
function showWelcomeScreen() {
    const glare = document.getElementById("glareEffect");
    if (glare) glare.classList.add("active-welcome");
    const currentHour = new Date().getHours();
    let greeting = "Welcome";

    if (currentHour >= 5 && currentHour < 12) greeting = "Good Morning";
    else if (currentHour >= 12 && currentHour < 17) greeting = "Good Afternoon";
    else if (currentHour >= 17 && currentHour < 22) greeting = "Good Evening";
    else greeting = "Hello, Night Owl";

    if(chatBox) chatBox.innerHTML = `
        <div class="welcome-screen" id="welcomeScreen">
            <div class="welcome-logo-container"><img src="assets/images/logo.JPEG" alt="PRABHADRI Logo" class="welcome-logo" onerror="this.style.display='none'"></div>
            <h1 class="welcome-title" style="margin-bottom: 5px;">PRABHADRI AI</h1>
            <p style="color: var(--accent); font-weight: 500; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px;">${greeting}</p>
            <p class="welcome-subtitle">How can I help you accelerate today?</p>
        </div>
    `;
}

function addMessage(text, sender, saveToHistory = false) {
    if(!chatBox) return;
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");

    if (sender === "user") {
        messageDiv.classList.add("user-message");
        messageDiv.style.display = "flex"; messageDiv.style.alignItems = "center"; messageDiv.style.justifyContent = "flex-end"; messageDiv.style.gap = "10px";
        messageDiv.innerHTML = `<span>${text}</span>`;
        
        const userCopyBtn = document.createElement("button");
        userCopyBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px;">content_copy</span>`;
        userCopyBtn.style.cssText = "background: transparent; border: none; color: inherit; cursor: pointer; opacity: 0.6; display: flex; align-items: center;";
        userCopyBtn.onmouseover = () => userCopyBtn.style.opacity = "1";
        userCopyBtn.onmouseout = () => userCopyBtn.style.opacity = "0.6";
        userCopyBtn.onclick = () => {
            navigator.clipboard.writeText(text);
            userCopyBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px;">check</span>`;
            setTimeout(() => userCopyBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px;">content_copy</span>`, 2000);
        };
        messageDiv.appendChild(userCopyBtn);
    } else {
        messageDiv.classList.add("bot-message");
        messageDiv.innerHTML = marked.parse(text); 
        
        const controlsDiv = document.createElement("div");
        controlsDiv.style.cssText = "margin-top: 15px; display: flex; gap: 8px;";

        const playPauseBtn = document.createElement("button");
        playPauseBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">play_circle</span> Play`;
        playPauseBtn.classList.add("speak-btn");

        const stopBtn = document.createElement("button");
        stopBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">stop_circle</span> Stop`;
        stopBtn.classList.add("speak-btn"); stopBtn.style.display = "none";

        let speech = null;
        playPauseBtn.onclick = () => {
            if (speechSynthesis.speaking && speech) {
                if (speechSynthesis.paused) { speechSynthesis.resume(); playPauseBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">pause_circle</span> Pause`; }
                else { speechSynthesis.pause(); playPauseBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">play_circle</span> Resume`; }
            } else {
                speechSynthesis.cancel(); 
                const tempDiv = document.createElement("div"); tempDiv.innerHTML = marked.parse(text);
                speech = new SpeechSynthesisUtterance(tempDiv.textContent || tempDiv.innerText || "");
                if (selectedVoiceURI) { const chosenVoice = availableVoices.find(v => v.voiceURI === selectedVoiceURI); if (chosenVoice) speech.voice = chosenVoice; }
                speech.onstart = () => { playPauseBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">pause_circle</span> Pause`; stopBtn.style.display = "inline-flex"; };
                speech.onend = () => { playPauseBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">play_circle</span> Play`; stopBtn.style.display = "none"; speech = null; };
                speechSynthesis.speak(speech);
            }
        };

        stopBtn.onclick = () => { speechSynthesis.cancel(); playPauseBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">play_circle</span> Play`; stopBtn.style.display = "none"; speech = null; };

        const copyBtn = document.createElement("button");
        copyBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">content_copy</span> Copy`;
        copyBtn.classList.add("copy-btn");
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(text);
            copyBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">check</span> Copied`;
            setTimeout(() => copyBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">content_copy</span> Copy`, 2000);
        };

        controlsDiv.appendChild(playPauseBtn); controlsDiv.appendChild(stopBtn); controlsDiv.appendChild(copyBtn); messageDiv.appendChild(controlsDiv);
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (saveToHistory) {
        const currentChat = chats.find(c => c.id === currentChatId);
        if (currentChat) { currentChat.messages.push({ sender: sender, text: text }); saveChats(); }
    }
}

function showTyping() {
    if (!document.getElementById("typingAnimationCss")) {
        const style = document.createElement("style"); style.id = "typingAnimationCss";
        style.innerHTML = `
            .typing-dots { display: flex; gap: 6px; padding: 4px 2px; align-items: center; height: 20px; }
            .typing-dots .dot { width: 8px; height: 8px; border-radius: 50%; background-color: #4ade80; opacity: 0.3; animation: prabhadriPulse 1.4s infinite ease-in-out; }
            .typing-dots .dot:nth-child(1) { animation-delay: 0s; } .typing-dots .dot:nth-child(2) { animation-delay: 0.2s; } .typing-dots .dot:nth-child(3) { animation-delay: 0.4s; }
            @keyframes prabhadriPulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 10px rgba(74, 222, 128, 0.8); } }
        `;
        document.head.appendChild(style);
    }
    const typingDiv = document.createElement("div"); typingDiv.classList.add("message", "bot-message"); typingDiv.id = "typingIndicator";
    typingDiv.innerHTML = `<div class="typing-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
    if (chatBox) { chatBox.appendChild(typingDiv); chatBox.scrollTop = chatBox.scrollHeight; }
}

function removeTyping() { const typing = document.getElementById("typingIndicator"); if (typing) typing.remove(); }

// ==========================================
// Basic Listeners
// ==========================================
if(sendBtn) sendBtn.addEventListener("click", sendMessage);
if(messageInput) messageInput.addEventListener("keypress", function(e) { if (e.key === "Enter") sendMessage(); });
if(searchInput) searchInput.addEventListener("input", (e) => renderChatList(e.target.value));

if(newChatBtn) newChatBtn.addEventListener("click", () => {
    const glare = document.getElementById("glareEffect");
    if (glare) { glare.classList.remove("burst"); void glare.offsetWidth; glare.classList.add("burst"); setTimeout(() => glare.classList.remove("burst"), 1500); }
    createNewChat();
});

const closeSidebarBtn = document.getElementById("closeSidebarBtn");
const openSidebarBtn = document.getElementById("openSidebarBtn");
const sidebar = document.querySelector(".sidebar");
if (closeSidebarBtn && openSidebarBtn && sidebar) {
    closeSidebarBtn.addEventListener("click", () => sidebar.classList.add("collapsed"));
    openSidebarBtn.addEventListener("click", () => sidebar.classList.remove("collapsed"));
}

// ==========================================
// LIVE ACADEMIC DASHBOARD, SKILL TREE & GAMIFICATION
// ==========================================

function getSkillTreeData() { return JSON.parse(localStorage.getItem("prabhadri_skill_tree") || "{}"); }

async function loadAcademicProfile() {
    try {
        const response = await fetch("http://localhost:3000/profile");
        const profile = await response.json();
        const targetExam = profile.target_exam; 
        
        const dashboard = document.getElementById("academicDashboard");
        if (!dashboard) return;

        dashboard.style.padding = "15px";
        dashboard.style.background = "rgba(0, 0, 0, 0.2)";
        dashboard.style.borderBottom = "1px solid rgba(255, 255, 255, 0.1)";

        const xpData = getSkillTreeData();
        const currentXP = xpData[targetExam] || 0; 
        let currentLevel = Math.floor(currentXP / 100) + 1;
        let xpProgress = currentXP % 100;

        let weakPointsHtml = profile.weak_points.map(wp => `
            <span onclick="triggerXPGain('${wp}', '${targetExam}')" 
                  style="display: inline-flex; align-items: center; background: rgba(255, 80, 80, 0.15); border: 1px solid rgba(255, 80, 80, 0.3); color: #ffcccc; padding: 4px 10px; border-radius: 12px; font-size: 11px; margin: 4px 4px 0 0; cursor: pointer; transition: all 0.2s ease;"
                  title="Click to mark as mastered!">
                ${wp} <span class="material-symbols-outlined" style="font-size: 12px; margin-left: 4px;">check_circle</span>
            </span>
        `).join('');

        dashboard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="font-size: 11px; color: #a3a3a3; text-transform: uppercase; letter-spacing: 1.5px; display: flex; align-items: center; gap: 5px;">
                    <span class="material-symbols-outlined" style="font-size: 14px;">school</span> Academic Profile
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <span class="material-symbols-outlined" onclick="exportReport()" title="Export Progress Report" style="font-size: 16px; cursor: pointer; color: #3b82f6; transition: all 0.2s;" onmouseover="this.style.color='#93c5fd'" onmouseout="this.style.color='#3b82f6'">download</span>
                    
                    <div style="font-size: 11px; color: #4ade80; font-weight: bold; background: rgba(74, 222, 128, 0.1); padding: 2px 6px; border-radius: 4px;">
                        Lvl ${currentLevel}
                    </div>
                </div>
            </div>
            
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #ffffff; display: flex; justify-content: space-between; align-items: center;">
                <span>Target: ${targetExam}</span>
                <span class="material-symbols-outlined" onclick="editTargetExam('${targetExam}')" style="font-size: 16px; cursor: pointer; color: #a3a3a3; transition: all 0.2s;">edit</span>
            </div>

            <div style="background: rgba(255, 255, 255, 0.1); border-radius: 8px; height: 6px; width: 100%; margin-bottom: 4px; overflow: hidden;">
                <div id="xpBarFill" style="background: #4ade80; height: 100%; width: ${xpProgress}%; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 10px rgba(74, 222, 128, 0.8);"></div>
            </div>
            <div style="font-size: 10px; color: #a3a3a3; text-align: right; margin-bottom: 12px;">${xpProgress} / 100 XP</div>

            <div style="font-size: 12px; color: #a3a3a3; margin-bottom: 6px;">Focus Areas:</div>
            <div id="tagsContainer">${weakPointsHtml || '<span style="color: #4ade80; font-size: 12px; display: flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 14px;">verified</span> All caught up!</span>'}</div>

            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <div style="font-size: 11px; color: #a3a3a3; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
                    <span class="material-symbols-outlined" style="font-size: 14px; color: #ef4444;">local_fire_department</span> Focus Session
                </div>
                <div id="focusUI"></div>
            </div>

            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <div style="font-size: 11px; color: #a3a3a3; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
                    <span class="material-symbols-outlined" style="font-size: 14px; color: #fbbf24;">military_tech</span> Recent Badges
                </div>
                <div id="badgeContainer" style="display: flex; gap: 8px; flex-wrap: wrap;"></div>
            </div>
        `;

        loadBadges();
        initFocusMode();

    } catch (error) { console.error("Could not load academic profile", error); }
}

// ==========================================
// BADGES LOGIC
// ==========================================
function loadBadges() {
    const badgeContainer = document.getElementById("badgeContainer");
    if (!badgeContainer) return;
    const earnedBadges = JSON.parse(localStorage.getItem("prabhadri_badges") || "[]");

    if (earnedBadges.length === 0) {
        badgeContainer.innerHTML = `<span style="font-size: 10px; color: rgba(255,255,255,0.3); font-style: italic;">No badges earned yet. Ace a test!</span>`;
        return;
    }

    badgeContainer.innerHTML = earnedBadges.map(b => `
        <div style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.05)); border: 1px solid rgba(251, 191, 36, 0.4); border-radius: 8px; padding: 5px 8px; display: flex; align-items: center; gap: 5px; box-shadow: 0 0 8px rgba(251, 191, 36, 0.2);">
            <span class="material-symbols-outlined" style="font-size: 16px; color: #fbbf24;">${b.icon}</span><span style="font-size: 10px; color: #fde68a; font-weight: 600;">${b.name}</span>
        </div>
    `).join('');
}

// ==========================================
// AUTOMATED STUDY PLAYLIST MANAGER
// ==========================================
let focusInterval = null;

function getPlaylist() {
    return JSON.parse(localStorage.getItem("prabhadri_playlist") || "null");
}

async function initFocusMode() {
    const focusUI = document.getElementById("focusUI");
    if (!focusUI) return;

    const playlist = getPlaylist();
    const activeSession = JSON.parse(localStorage.getItem("prabhadri_focus") || "null");

    // STATE 0: No Playlist Exists
    if (!playlist) {
        focusUI.innerHTML = `
            <div style="background: rgba(59, 130, 246, 0.1); border: 1px dashed rgba(59, 130, 246, 0.4); padding: 10px; border-radius: 6px; text-align: center;">
                <div style="color: #93c5fd; font-size: 11px; margin-bottom: 8px;">No active study plan.</div>
                <button onclick="createPlaylist()" style="background: rgba(59, 130, 246, 0.2); border: 1px solid #3b82f6; color: #93c5fd; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; width: 100%; transition: all 0.2s ease;">
                    <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">format_list_bulleted</span> Load AI Study Plan
                </button>
            </div>
        `;
        if (focusInterval) clearInterval(focusInterval);
        return;
    }

    // STATE 1: Playlist is Complete!
    if (playlist.currentIndex >= playlist.tasks.length) {
        focusUI.innerHTML = `
            <div style="background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.5); padding: 10px; border-radius: 6px; text-align: center; box-shadow: 0 0 15px rgba(251, 191, 36, 0.2);">
                <div style="color: #fbbf24; font-size: 14px; font-weight: bold; margin-bottom: 4px;">Plan Conquered! 🏆</div>
                <div style="color: #fde68a; font-size: 10px; margin-bottom: 10px;">You completed all ${playlist.tasks.length} tasks.</div>
                <button onclick="finishPlaylist()" style="background: #fbbf24; color: #000; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; width: 100%;">
                    Claim +500 Bonus XP & Reset
                </button>
            </div>
        `;
        if (focusInterval) clearInterval(focusInterval);
        return;
    }

    // Calculate overall progress
    const progressPercent = Math.round((playlist.currentIndex / playlist.tasks.length) * 100);
    const currentTaskName = playlist.tasks[playlist.currentIndex];

    // STATE 2: Playlist Active, Ready to start a task
    if (!activeSession) {
        focusUI.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; font-size: 10px; color: #a3a3a3;">
                    <span>Overall Progress: ${playlist.currentIndex}/${playlist.tasks.length}</span>
                    <span style="color: #4ade80;">${progressPercent}%</span>
                </div>
                <div style="background: rgba(255, 255, 255, 0.1); border-radius: 4px; height: 4px; width: 100%; overflow: hidden;">
                    <div style="background: #4ade80; height: 100%; width: ${progressPercent}%; transition: width 0.3s;"></div>
                </div>
                
                <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); padding: 8px; border-radius: 6px;">
                    <div style="font-size: 9px; color: #ef4444; text-transform: uppercase;">Up Next:</div>
                    <div style="font-size: 12px; color: white; font-weight: bold; margin-bottom: 8px;">${currentTaskName}</div>
                    
                    <div style="display: flex; gap: 5px;">
                        <input type="number" id="focusTimeInput" placeholder="Mins" value="30" style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 6px; border-radius: 4px; font-size: 11px; width: 50px;">
                        <button onclick="startPlaylistSession('${currentTaskName}')" style="flex: 1; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">
                            Start Timer
                        </button>
                    </div>
                </div>
                <button onclick="cancelPlaylist()" style="background: transparent; border: none; color: rgba(255,255,255,0.4); font-size: 10px; cursor: pointer; text-align: center;">Cancel Study Plan</button>
            </div>
        `;
        if (focusInterval) clearInterval(focusInterval);
        return;
    }

    const now = Date.now();
    const timeLeft = activeSession.endTime - now;

    // STATE 3: Task Timer is Finished (Quiz & Reward)
    if (timeLeft <= 0) {
        focusUI.innerHTML = `
            <div style="background: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.3); padding: 8px; border-radius: 6px; display: flex; flex-direction: column; gap: 6px;">
                <div style="color: #4ade80; font-size: 11px; font-weight: bold; text-align: center;">Task ${playlist.currentIndex + 1} Complete!</div>
                <div style="font-size: 12px; color: white; text-align: center; margin-bottom: 4px;">${activeSession.topic}</div>
                <button onclick="requestQuiz('${activeSession.topic}')" style="background: rgba(59, 130, 246, 0.2); border: 1px solid #3b82f6; color: #93c5fd; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">
                    1. Generate Pop Quiz
                </button>
                <button onclick="claimTaskReward()" style="background: #4ade80; color: #000; border: none; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">
                    2. I Passed! Next Task
                </button>
            </div>
        `;
        if (focusInterval) clearInterval(focusInterval);
    } 
    // STATE 4: Live Ticking Countdown
        const mins = Math.floor(timeLeft / 60000); const secs = Math.floor((timeLeft % 60000) / 1000);
        focusUI.innerHTML = `
            <div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; display: flex; flex-direction: column; border: 1px solid rgba(239, 68, 68, 0.3);">
                <div style="display: flex; justify-content: space-between; font-size: 10px; color: #a3a3a3; margin-bottom: 6px;">
                    <span>Task ${playlist.currentIndex + 1} of ${playlist.tasks.length}</span>
                    
                    <span id="lofiBtn" onclick="toggleLofi()" class="material-symbols-outlined" style="font-size: 14px; cursor: pointer; color: ${lofiAudio.paused ? '#a3a3a3' : '#4ade80'}; transition: color 0.3s;" title="Toggle Focus Audio">headphones</span>
                    
                </div>
                <div style="color: white; font-size: 12px; font-weight: bold; margin-bottom: 4px;">${activeSession.topic}</div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="color: #fca5a5; font-size: 16px; font-weight: bold; display: flex; align-items: center; gap: 5px;">
                        <span class="material-symbols-outlined" style="font-size: 18px;">hourglass_top</span>${mins}:${secs < 10 ? '0' : ''}${secs}
                    </div>
                    <button onclick="failTaskSession()" style="background: transparent; border: 1px solid #ef4444; color: #ef4444; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-size: 10px;">Give Up</button>
                </div>
            </div>
        `;
        if (!focusInterval) focusInterval = setInterval(initFocusMode, 1000);
}

// ---------------------------------
// Playlist Logic Functions
// ---------------------------------
function createPlaylist() {
    const input = prompt("Paste the AI's study plan topics, separated by commas (e.g., Thermodynamics, Kinetics, Entropy):");
    if (input && input.trim() !== "") {
        // Split by comma, trim whitespace, remove empty items
        const tasksArray = input.split(",").map(t => t.trim()).filter(t => t.length > 0);
        if (tasksArray.length > 0) {
            const playlist = { tasks: tasksArray, currentIndex: 0 };
            localStorage.setItem("prabhadri_playlist", JSON.stringify(playlist));
            initFocusMode();
        }
    }
}

function startPlaylistSession(topic) {
    let minutes = parseFloat(document.getElementById("focusTimeInput").value) || 30;
    // Cheat for hackathon: typing 0.1 gives 6 seconds
    localStorage.setItem("prabhadri_focus", JSON.stringify({ endTime: Date.now() + (minutes * 60000), topic: topic }));
    initFocusMode();
}

function requestQuiz(topic) {
    const msgInput = document.getElementById("messageInput");
    if (msgInput) { msgInput.value = `I just finished studying "${topic}". Give me a fast, 1-question pop quiz to test my knowledge!`; sendMessage(); }
}

async function claimTaskReward() {
    stopLofi();
    localStorage.removeItem("prabhadri_focus");
    
    // Advance the playlist
    const playlist = getPlaylist();
    if (playlist) {
        playlist.currentIndex += 1;
        localStorage.setItem("prabhadri_playlist", JSON.stringify(playlist));
    }

    // Award XP
    try {
        const response = await fetch("http://localhost:3000/profile");
        const profile = await response.json();
        let xpData = getSkillTreeData();
        if (typeof xpData[profile.target_exam] === "undefined") xpData[profile.target_exam] = 0; 
        xpData[profile.target_exam] += 50; // 50 XP per task
        localStorage.setItem("prabhadri_skill_tree", JSON.stringify(xpData));
        loadAcademicProfile(); 
    } catch (e) { console.error(e); }
}

function failTaskSession() {
    stopLofi();
    if(confirm("Are you sure? You will fail this task and get zero XP!")) {
        localStorage.removeItem("prabhadri_focus");
        initFocusMode(); // Goes back to the start button for the SAME task
    }
}

function cancelPlaylist() {
    stopLofi();
    if(confirm("Delete the current study plan?")) {
        localStorage.removeItem("prabhadri_playlist");
        localStorage.removeItem("prabhadri_focus");
        initFocusMode();
    }
}

async function finishPlaylist() {
    localStorage.removeItem("prabhadri_playlist");
    
    // Huge Bonus XP for finishing the whole plan!
    try {
        const response = await fetch("http://localhost:3000/profile");
        const profile = await response.json();
        let xpData = getSkillTreeData();
        if (typeof xpData[profile.target_exam] === "undefined") xpData[profile.target_exam] = 0; 
        xpData[profile.target_exam] += 500; 
        localStorage.setItem("prabhadri_skill_tree", JSON.stringify(xpData));
        loadAcademicProfile(); 
    } catch (e) { console.error(e); }
}

// ==========================================
// CORE API UPDATERS (Tags & Target Exams)
// ==========================================
async function triggerXPGain(topic, currentTarget) {
    try {
        let xpData = getSkillTreeData();
        if (typeof xpData[currentTarget] === "undefined") xpData[currentTarget] = 0; 
        xpData[currentTarget] += 50; 
        localStorage.setItem("prabhadri_skill_tree", JSON.stringify(xpData));

        const xpBar = document.getElementById("xpBarFill");
        if (xpBar) { xpBar.style.background = "#ffffff"; setTimeout(() => { xpBar.style.background = "#4ade80"; }, 200); }

        await fetch("http://localhost:3000/update-profile", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mastered_topic: topic })
        });
        setTimeout(loadAcademicProfile, 300); 
    } catch(err) { console.error("Failed to update XP or Profile:", err); }
}

async function editTargetExam(currentExam) {
    const newExam = prompt("Enter an existing Subject to switch to, or a new Subject to create it:", currentExam);
    if (newExam && newExam.trim() !== "" && newExam !== currentExam) {
        try {
            await fetch("http://localhost:3000/update-profile", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ new_target: newExam.trim() })
            });
            loadAcademicProfile(); 
        } catch(err) { console.error("Failed to update target exam", err); }
    }
}

// ==========================================
// START THE APP
// ==========================================
loadChats();
if (chats.length === 0) createNewChat();
loadAcademicProfile();

// Force the Sidebar UI to space out properly
const sidebarElement = document.querySelector(".sidebar");
const chatListElement = document.getElementById("chatList");
const settingsBtnElement = document.getElementById("settingsBtn");

if (sidebarElement && chatListElement && settingsBtnElement) {
    sidebarElement.style.display = "flex";
    sidebarElement.style.flexDirection = "column";
    
    // Make chat list take all empty space and scroll
    chatListElement.style.flexGrow = "1";
    chatListElement.style.overflowY = "auto";
    
    // Push settings button to the bottom
    settingsBtnElement.style.marginTop = "auto";
    settingsBtnElement.style.marginBottom = "20px";
}

// ==========================================
// SIDEBAR SQUISH FIX
// ==========================================
if (!document.getElementById("sidebarFixCss")) {
    const style = document.createElement("style");
    style.id = "sidebarFixCss";
    style.innerHTML = `
        .sidebar {
            overflow-y: auto !important; /* Allows scrolling if the dashboard gets tall */
            display: flex !important;
            flex-direction: column !important;
        }
        #chatList {
            min-height: 250px !important; /* Forces the chat list to stay visible */
            flex-shrink: 0 !important;    /* Refuses to let the dashboard crush it */
            overflow-y: auto !important;  /* Adds an inner scrollbar just for chats */
        }
        #academicDashboard {
            flex-shrink: 0 !important;    /* Keeps the dashboard components intact */
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// EXPORT STUDY REPORT ENGINE
// ==========================================
async function exportReport() {
    try {
        const response = await fetch("/profile");
        const profile = await response.json();
        const xpData = getSkillTreeData();
        const badges = JSON.parse(localStorage.getItem("prabhadri_badges") || "[]");
        const targetXP = xpData[profile.target_exam] || 0;

        let report = `======================================\n`;
        report += `      PRABHADRI AI STUDY REPORT       \n`;
        report += `======================================\n\n`;
        report += `TARGET EXAM: ${profile.target_exam}\n`;
        report += `CURRENT LEVEL: ${Math.floor(targetXP / 100) + 1}\n`;
        report += `TOTAL XP: ${targetXP}\n\n`;

        report += `MASTERED TOPICS:\n`;
        if (profile.weak_points && profile.weak_points.length > 0) {
            profile.weak_points.forEach(wp => report += `[x] ${wp}\n`);
        } else {
             report += `- All caught up!\n`;
        }

        report += `\nEARNED TROPHIES:\n`;
        if (badges.length > 0) {
            badges.forEach(b => report += `🏆 ${b.name}\n`);
        } else {
            report += `- Keep studying to earn badges!\n`;
        }
        
        report += `\nGenerated by PRABHADRI AI Copilot`;

        // Create the file and force browser download
        const blob = new Blob([report], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Prabhadri_Report_${profile.target_exam.replace(/\s+/g, '_')}.txt`;
        link.click();
    } catch (e) {
        console.error("Failed to generate report", e);
    }
}

// ==========================================
// LOFI AMBIENCE ENGINE
// ==========================================
const lofiAudio = new Audio("https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg");
lofiAudio.loop = true;
lofiAudio.volume = 0.2; // Soft background volume

function toggleLofi() {
    const lofiBtn = document.getElementById("lofiBtn");
    if (lofiAudio.paused) {
        lofiAudio.play();
        if(lofiBtn) lofiBtn.style.color = "#4ade80"; // Turn green when playing
    } else {
        lofiAudio.pause();
        if(lofiBtn) lofiBtn.style.color = "#a3a3a3"; // Turn grey when paused
    }
}

// Function to safely stop audio when tasks finish
function stopLofi() {
    lofiAudio.pause();
    lofiAudio.currentTime = 0;
}