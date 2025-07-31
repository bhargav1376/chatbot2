const chatBody = document.getElementById("chat-body");
const chatInput = document.getElementById("chat-input");

window.onload = () => {
    toggleChatbot(true);
    loadChatHistory();
    showWelcomeMessage();
};

function toggleChatbot(openDirect = false) {
    const chatbot = document.getElementById("chatbot-container");
    const icon = document.getElementById("chatbot-icon");

    if (openDirect || !chatbot.classList.contains("active")) {
        chatbot.classList.add("active");
        icon.style.display = "none";
    } else {
        chatbot.classList.remove("active");
        icon.style.display = "flex";
    }
}

function addMessage(text, type, save = true) {
    if (type === 'bot') {
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper';
        const avatar = document.createElement('img');
        avatar.src = "https://cdn-icons-png.flaticon.com/512/4712/4712035.png";
        avatar.className = "avatar";
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'bot-message');
        msgDiv.innerText = text;
        wrapper.appendChild(avatar);
        wrapper.appendChild(msgDiv);
        chatBody.appendChild(wrapper);
    } else {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'user-message');
        msgDiv.innerText = text;
        chatBody.appendChild(msgDiv);
    }
    chatBody.scrollTop = chatBody.scrollHeight;
    if (save) saveChatHistory();
}

function animateMessage(text, callback) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper word-animate';
    const avatar = document.createElement('img');
    avatar.src = "https://cdn-icons-png.flaticon.com/512/4712/4712035.png";
    avatar.className = "avatar";
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'bot-message');

    text.split("").forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.style.animationDelay = `${index * 50}ms`;
        msgDiv.appendChild(span);
    });

    wrapper.appendChild(avatar);
    wrapper.appendChild(msgDiv);
    chatBody.appendChild(wrapper);
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(callback, 1500);
}

function showWelcomeMessage() {
    const welcome = "Hello! How can I assist you today?";
    animateMessage(welcome, () => showMainButtons());
}

function showMainButtons() {
    const options = ["Attendance", "Leave", "Claims", "Other Issues"];
    options.forEach((opt, i) => {
        setTimeout(() => {
            const btn = document.createElement("button");
            btn.className = "option-btn";
            btn.style.background = "linear-gradient(45deg,#36d1dc,#5b86e5)";
            btn.innerText = opt;
            btn.onclick = () => handleMainOption(opt);
            chatBody.appendChild(btn);
            chatBody.scrollTop = chatBody.scrollHeight;
        }, i * 500);
    });
}

function handleMainOption(option) {
    addMessage(option, "user");
    if (option === "Other Issues") {
        const issues = ["Payroll Issue", "Technical Issue", "HR Policy"];
        issues.forEach(issue => {
            const btn = document.createElement("button");
            btn.className = "option-btn";
            btn.style.background = "linear-gradient(45deg,#ff512f,#dd2476)";
            btn.innerText = issue;
            btn.onclick = () => addMessage(`Selected: ${issue}`, "user");
            chatBody.appendChild(btn);
        });
        const connectBtn = document.createElement("button");
        connectBtn.className = "option-btn";
        connectBtn.style.background = "linear-gradient(45deg,#00b09b,#96c93d)";
        connectBtn.innerText = "Connect Support";
        connectBtn.onclick = () => window.location.href = "helpful.html";
        chatBody.appendChild(connectBtn);
    } else {
        askHelpful();
    }
}

function askHelpful() {
    addMessage("Was this information helpful? (Yes/No)", "bot");
}

function handleKey(e) {
    if (e.key === "Enter") sendMessage();
}

function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    addMessage(text, "user");
    chatInput.value = "";

    // Custom update logic
    const updateThingMatch = text.match(/update my ([a-zA-Z0-9_ ]+) to ([^\.\!\?]+)/i);
    if (updateThingMatch) {
        const key = updateThingMatch[1].trim().replace(/ /g, "_");
        const value = updateThingMatch[2].trim();
        localStorage.setItem(key, value);
        chatBody.lastChild.remove();
        addMessage(`Your ${updateThingMatch[1].trim()} has been updated to ${value}.`, "bot");
        return;
    }
    const whatThingMatch = text.match(/what('?s| is) my ([a-zA-Z0-9_ ]+)/i);
    if (whatThingMatch) {
        const key = whatThingMatch[2].trim().replace(/ /g, "_");
        const value = localStorage.getItem(key);
        chatBody.lastChild.remove();
        addMessage(value ? `Your ${whatThingMatch[2].trim()} is ${value}.` 
                         : `I don't know your ${whatThingMatch[2].trim()} yet. Please tell me by saying 'Update my ${whatThingMatch[2].trim()} to ...'`, "bot");
        return;
    }

    if (text.toLowerCase() === "no") {
        window.location.href = "helpful.html";
    }
}

// function saveChatHistory() {
//     const history = [];
//     document.querySelectorAll(".message").forEach(msg => history.push({text: msg.innerText}));
//     localStorage.setItem("chatHistory", JSON.stringify(history));
// }
// function loadChatHistory() {
//     const history = JSON.parse(localStorage.getItem("chatHistory")) || [];
//     history.forEach(msg => addMessage(msg.text, "bot", false));
// }
function clearChatHistory() {
    localStorage.removeItem("chatHistory");
    chatBody.innerHTML = "";
    showWelcomeMessage();
}