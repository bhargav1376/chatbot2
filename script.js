let recognition;
let isBotTyping = false; // <-- prevent sending while typing

function openMicModal() {
    document.getElementById('mic-modal').classList.add('show');
    document.getElementById('mic-status').innerText = 'Listening...';
    startVoice();
}
function closeMicModal() {
    document.getElementById('mic-modal').classList.remove('show');
    if (window.recognition) window.recognition.abort();
    document.getElementById('mic-status').innerText = '';
}
function startVoice() {
    if (!('webkitSpeechRecognition' in window)) {
        document.getElementById('mic-status').innerText = 'Speech Recognition not supported!';
        return;
    }
    recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
        document.getElementById('mic-status').innerText = 'Processing...';
        document.getElementById('chat-input').value = event.results[0][0].transcript;
        closeMicModal();
        sendMessage();
    };
    recognition.onerror = () => document.getElementById('mic-status').innerText = 'Error. Try again.';
    recognition.onend = () => {
        if (document.getElementById('mic-modal').classList.contains('show'))
            document.getElementById('mic-status').innerText = 'No input detected.';
    };
    recognition.start();
}

const mainOptions = ["Attendance", "Leave", "Claims", "Other Issues"];
const otherIssues = ["HR Policies", "HR Details", "Profile & Documents", "Training & Appraisal", "Connect Support"];
const responses = {
    "Leave": [
        "Leave Balance: You have 10 casual leaves and 5 sick leaves remaining.",
        "Leave Carry Forward: Your company allows 5 leaves to be carried forward.",
        "Leave Status: Approved leaves from 2nd to 5th August."
    ],
    "Attendance": ["Attendance Summary: You have 95% attendance this month."],
    "Claims": ["Expense Status: ₹5,000 travel expense is under processing."],
    "Other Issues": ["Choose from HR Policies, HR Details, Profile & Documents, Training & Appraisal or Connect Support."]
};
const pages = {
    "Attendance": "attendance.html",
    "Leave": "leave.html",
    "Claims": "claims.html",
    "Connect Support": "support.html"
};

let lastTopic = null;
let userName = localStorage.getItem("userName") || null;

// --- Append Message with typing animation ---
function appendMessage(message, sender, callback) {
    const chatBody = document.getElementById('chat-body');
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper';

    if (sender === 'bot') {
        const avatar = document.createElement('img');
        avatar.src = "https://cdn-icons-png.flaticon.com/512/4712/4712035.png";
        avatar.className = "avatar";
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'bot-message');
        wrapper.appendChild(avatar);
        wrapper.appendChild(msgDiv);

        let index = 0;
        isBotTyping = true;
        disableUserInput(true);

        const interval = setInterval(() => {
            msgDiv.textContent = message.substring(0, index++);
            chatBody.scrollTop = chatBody.scrollHeight;
            if (index > message.length) {
                clearInterval(interval);
                isBotTyping = false;
                disableUserInput(false);
                playSound();
                if (callback) callback();
            }
        }, 40);
    } else {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'user-message');
        msgDiv.innerText = message;
        wrapper.appendChild(msgDiv);
        if (callback) callback();
    }
    chatBody.appendChild(wrapper);
    chatBody.scrollTop = chatBody.scrollHeight;
}

// --- Disable Input when bot typing ---
function disableUserInput(disable) {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    input.disabled = disable;
    if (sendBtn) sendBtn.disabled = disable;
}

// --- Sequential Bot Messages ---
function sendBotMessages(messages, callback) {
    if (!messages.length) return callback && callback();
    const first = messages.shift();
    appendMessage(first, "bot", () => sendBotMessages(messages, callback));
}

// --- Show Options ---
function showMainOptionsAnimated() {
    const chatBody = document.getElementById("chat-body");
    const optionsDiv = document.createElement("div");
    optionsDiv.className = "options-container";
    chatBody.appendChild(optionsDiv);

    let delay = 0;
    mainOptions.forEach(option => {
        setTimeout(() => {
            const btn = document.createElement("button");
            btn.innerText = option;
            btn.className = "option-btn";
            btn.onclick = () => selectOption(option);
            optionsDiv.appendChild(btn);
        }, delay);
        delay += 200;
    });
    chatBody.scrollTop = chatBody.scrollHeight;
}

function selectOption(option) {
    lastTopic = option;
    appendMessage(option, 'user');
    if (option === "Other Issues") showOtherIssues();
    else showResponses(option);
}

function showOtherIssues() {
    appendMessage("Select an issue:", "bot", () => {
        const chatBody = document.getElementById('chat-body');
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'options-container';
        otherIssues.forEach(issue => {
            const btn = document.createElement('button');
            btn.innerText = issue;
            btn.className = 'option-btn';
            btn.onclick = () => handleOtherIssue(issue);
            optionsDiv.appendChild(btn);
        });
        chatBody.appendChild(optionsDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    });
}

function handleOtherIssue(issue) {
    appendMessage(issue, "user");
    if (issue === "Connect Support") return redirectToPage("Connect Support");
    appendMessage("You selected " + issue + ".", "bot", () => askHelpful(issue));
}

function showResponses(option) {
    const items = [...(responses[option] || ["No data available."])];
    sendBotMessages(items, () => askHelpful(option));
}

// --- Helpful Feedback ---
function askHelpful(option) {
    appendMessage("Was this helpful?", "bot", () => {
        const chatBody = document.getElementById("chat-body");
        const optionsDiv = document.createElement("div");
        optionsDiv.className = "options-container";

        const yesBtn = document.createElement("button");
        yesBtn.innerText = "👍 Yes, I am";
        yesBtn.className = "option-btn";
        yesBtn.onclick = () => {
            appendMessage("👍 Yes, I am", "user");
            optionsDiv.remove();
            appendMessage("Thanks for your feedback!", "bot");
        };

        const noBtn = document.createElement("button");
        noBtn.innerText = "👎 Not yet";
        noBtn.className = "option-btn";
        noBtn.onclick = () => {
            appendMessage("👎 Not yet", "user");
            optionsDiv.remove();
            forwardToPage(option);
        };

        optionsDiv.appendChild(yesBtn);
        optionsDiv.appendChild(noBtn);
        chatBody.appendChild(optionsDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    });
}

function forwardToPage(option) {
    appendMessage(`Forwarding to ${option} page in 2 seconds...`, "bot");
    setTimeout(() => window.location.href = pages[option] || "support.html", 2000);
}

function redirectToPage(option) {
    let count = 5;
    const interval = setInterval(() => {
        appendMessage(`Connecting support in ${count}s...`, "bot");
        count--;
        if (count < 0) {
            clearInterval(interval);
            window.location.href = pages[option];
        }
    }, 1000);
}

// --- Handle Name & Date/Time ---
function handleNameDateTime(text) {
    const lower = text.toLowerCase();

    // Hi response
    if (["hi", "hello", "hey"].includes(lower)) {
        appendMessage(userName ? `Hello ${userName}! How can I assist you today?`
                               : `Hello! How can I assist you today?`, "bot");
        return true;
    }

    // Menu
    if (lower.includes("menu") || lower.includes("options")) {
        showMainOptionsAnimated();
        return true;
    }

    // My name is ...
    const nameMatch = text.match(/my name is ([a-zA-Z ]+)/i);
    if (nameMatch) {
        userName = nameMatch[1].trim();
        localStorage.setItem("userName", userName);
        appendMessage(`Nice to meet you, ${userName}!`, "bot");
        return true;
    }

    // What's my name
    if (/what('?s| is) my name/i.test(lower)) {
        appendMessage(userName ? `Your name is ${userName}.` 
                               : `I don't know your name yet. Please tell me by saying 'My name is ...'`, "bot");
        return true;
    }

    // Date & Time handling
    const now = new Date();
    if (lower.includes("date") && lower.includes("time")) {
        appendMessage(`Current date and time is: ${now.toLocaleString()}`, "bot");
        return true;
    }
    if (lower.includes("date")) {
        appendMessage(`Today's date is: ${now.toLocaleDateString()}`, "bot");
        return true;
    }
    if (lower.includes("time")) {
        appendMessage(`Current time is: ${now.toLocaleTimeString()}`, "bot");
        return true;
    }
    return false;
}

function showWelcomeMessage() {
    appendMessage("Hello! How can I assist you today?", "bot", () => showMainOptionsAnimated());
}

function sendMessage() {
    if (isBotTyping) return; // block while typing
    const chatInput = document.getElementById("chat-input");
    const text = chatInput.value.trim();
    if (!text) return showErrorToast("Please enter a message!");
    appendMessage(text, "user");
    chatInput.value = "";

    if (handleNameDateTime(text)) return;

    appendMessage("I didn't understand that. Please use options.", "bot", () => showMainOptionsAnimated());
}

function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function showErrorToast(msg) {
    const toast = document.getElementById('error-toast');
    toast.innerText = msg;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.style.display = 'none', 400);
    }, 3000);
}

function toggleChatbot() {
    const chatbotContainer = document.getElementById("chatbot-container");
    const chatbotToggle = document.getElementById("chatbot-toggle");
    if (chatbotContainer.style.display !== "flex") {
        chatbotContainer.style.display = "flex";
        chatbotToggle.style.animation = "hideDown 0.4s forwards";
        setTimeout(() => chatbotToggle.style.display = "none", 400);
        // Clear chat before showing welcome message to avoid duplicates
        document.getElementById('chat-body').innerHTML = '';
        showWelcomeMessage();
    } else {
        chatbotContainer.style.display = "none";
        chatbotToggle.style.display = "flex";
        chatbotToggle.style.animation = "showUp 0.4s";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) chatInput.addEventListener('keydown', handleKey);
});
function addMessage(text, sender, animate = true) {
    const chatBody = document.getElementById("chat-body");
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;
    messageDiv.innerText = text;
    chatBody.appendChild(messageDiv);
    
    if (animate) {
        messageDiv.classList.add("typing-animation");
        setTimeout(() => messageDiv.classList.remove("typing-animation"), 1500);
    }
    chatBody.scrollTop = chatBody.scrollHeight;
    if (sender === "user") {
        const chatInput = document.getElementById("chat-input");
        chatInput.value = ""; // Clear input after sending
    }   
    if (sender === "bot") {
        // Simulate bot typing
        setTimeout(() => {
            messageDiv.classList.remove("typing-animation");
            messageDiv.innerText = text; // Replace with actual bot response
        }, 1000);
    }
    chatBody.scrollTop = chatBody.scrollHeight;
    if (sender === "user") {
        const chatInput = document.getElementById("chat-input");
        chatInput.value = ""; // Clear input after sending
    }
    if (sender === "bot") {
        // Simulate bot typing
        setTimeout(() => {
            messageDiv.classList.remove("typing-animation");
            messageDiv.innerText = text; // Replace with actual bot response
        }, 1000);
    }
}

let soundEnabled = true;

// --- Dropdown ---
function toggleDropdown() {
    const menu = document.getElementById("dropdown-menu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}
function toggleSound(el) { soundEnabled = el.checked; }

// --- Play Sound on Bot Message ---
function playSound() {
    if (!soundEnabled) return;
    new Audio('notification.mp3').play();
}

// --- Clear Chat ---
function clearChat() {
    document.getElementById('dropdown-menu').style.display = 'none';
    document.getElementById('chat-body').innerHTML = '';
    showWelcomeMessage();
}

// --- Countdown for support (single message update) ---
function redirectToPage(option) {
    let count = 5;
    const msgId = `support-msg-${Date.now()}`;
    appendMessage(`Connecting support in ${count}s...`, "bot", null, msgId);

    const interval = setInterval(() => {
        count--;
        const msgDiv = document.getElementById(msgId);
        if (msgDiv) msgDiv.textContent = `Connecting support in ${count}s...`;
        if (count <= 0) {
            clearInterval(interval);
            window.location.href = pages[option];
        }
    }, 1000);
}

// --- Append Message (supports id for updating) ---
function appendMessage(message, sender, callback, msgId = null) {
    const chatBody = document.getElementById('chat-body');
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper';

    if (sender === 'bot') {
        const avatar = document.createElement('img');
        avatar.src = "https://cdn-icons-png.flaticon.com/512/4712/4712035.png";
        avatar.className = "avatar";
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'bot-message');
        if (msgId) msgDiv.id = msgId;
        wrapper.appendChild(avatar);
        wrapper.appendChild(msgDiv);

        let index = 0;
        isBotTyping = true;
        disableUserInput(true);

        const interval = setInterval(() => {
            msgDiv.textContent = message.substring(0, index++);
            chatBody.scrollTop = chatBody.scrollHeight;
            if (index > message.length) {
                clearInterval(interval);
                isBotTyping = false;
                disableUserInput(false);
                playSound();
                if (callback) callback();
            }
        }, 40);
    } else {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'user-message');
        msgDiv.innerText = message;
        wrapper.appendChild(msgDiv);
        if (callback) callback();
    }
    chatBody.appendChild(wrapper);
    chatBody.scrollTop = chatBody.scrollHeight;
}

// --- Disable input while typing ---
function disableUserInput(disable) {
    document.getElementById('chat-input').disabled = disable;
    document.getElementById('send-btn').disabled = disable;
}

// --- Sequential Messages ---
function sendBotMessages(messages, callback) {
    if (!messages.length) return callback && callback();
    const first = messages.shift();
    appendMessage(first, "bot", () => sendBotMessages(messages, callback));
}

// --- Welcome ---
function showWelcomeMessage() {
    appendMessage("Hello! How can I assist you today?", "bot", () => showMainOptionsAnimated());
}

// --- Blank input error ---
function sendMessage() {
    if (isBotTyping) return;
    const chatInput = document.getElementById("chat-input");
    const text = chatInput.value.trim();
    if (!text) return showErrorToast("Please enter a message!");
    appendMessage(text, "user");
    chatInput.value = "";

    if (handleNameDateTime(text)) return;
    appendMessage("I didn't understand that. Please use options.", "bot", () => showMainOptionsAnimated());
}

function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// --- Error Toast ---
function showErrorToast(msg) {
    const toast = document.getElementById('error-toast');
    toast.innerText = msg;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.style.display = 'none', 400);
    }, 3000);
}
