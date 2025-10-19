(function () {
    const STORAGE_KEY = 'navigate_chat_history_v1';
    function $(id) { return document.getElementById(id); }

    document.addEventListener('DOMContentLoaded', () => {
        const messagesEl = $('chat-messages');
        const form = $('chat-form');
        const input = $('chat-input');
        if (!messagesEl || !form || !input) return;

        function loadHistory() {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            try {
                const items = JSON.parse(raw);
                items.forEach(m => appendMessage(m.text, m.from));
            } catch (e) { /* ignore */ }
        }

        function saveMessage(text, from) {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            arr.push({ text: text, from: from, ts: Date.now() });
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-50)));
        }

        function appendMessage(text, from) {
            const msg = document.createElement('div');
            msg.className = 'chat-msg ' + (from === 'user' ? 'chat-user' : 'chat-bot');
            msg.textContent = text;
            messagesEl.appendChild(msg);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        function botReply(userText) {
            const t = (userText || '').trim().toLowerCase();
            if (!t) return "Please type a question so I can help.";
            if (t.includes('schedule') || t.includes('session') || t.includes('book')) {
                return "To view or book sessions, open the Schedule page. You can filter by topic and time there.";
            }
            if (t.includes('resources') || t.includes('resource') || t.includes('materials')) {
                return "Resources are on the Resources page. You can search by topic or download handouts.";
            }
            if (t.includes('dashboard') || t.includes('progress')) {
                return "Your Dashboard shows progress and completed sessions. Sign in to see personalized data.";
            }
            if (t.includes('join') || t.includes('meet') || t.includes('link')) {
                return "To join a live session, open the Live Sessions page and click the Join button.";
            }
            if (t.includes('help') || t.includes('how do') || t.includes('how to')) {
                return "Ask me about scheduling, joining sessions, or finding materials. Example: 'How do I book a session?'.";
            }

            const fallback = [
                "I can help with scheduling, resources, and joining sessions. What would you like to do?",
                "Sorry, I didn't catch that — try asking about schedules, resources, or the dashboard.",
                "Try: 'How do I book a session?' or 'Where are the study resources?'"
            ];
            return fallback[Math.floor(Math.random() * fallback.length)];
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const text = input.value.trim();
            if (!text) return;
            appendMessage(text, 'user');
            saveMessage(text, 'user');
            input.value = '';
            setTimeout(() => {
                const reply = botReply(text);
                appendMessage(reply, 'bot');
                saveMessage(reply, 'bot');
            }, 350);
        });

        loadHistory();
        if (!messagesEl.children.length) {
            const greeting = "Hi! I'm Navigate Bot. Ask me about sessions, resources, or the dashboard.";
            appendMessage(greeting, 'bot');
            saveMessage(greeting, 'bot');
        }
    });
})();