(function() {
    const STORAGE_KEY = 'navigate_chat_history_v1';
    
    document.addEventListener('DOMContentLoaded', () => {
        const messagesEl = document.getElementById('chat-messages');
        const form = document.getElementById('chat-form');
        const input = document.getElementById('chat-input');
        
        if (!messagesEl || !form || !input) return;

        function appendMessage(text, from) {
            const msg = document.createElement('div');
            msg.className = 'chat-msg ' + (from === 'user' ? 'chat-user' : 'chat-bot');
            msg.textContent = text;
            messagesEl.appendChild(msg);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        function botReply(text) {
            const t = text.toLowerCase();
            if (t.includes('schedule') || t.includes('session')) {
                return "To view or book sessions, check the Schedule page. You can filter by topic and time.";
            }
            if (t.includes('resources') || t.includes('materials')) {
                return "Visit the Resources page to find study materials and handouts.";
            }
            if (t.includes('dashboard')) {
                return "The Dashboard shows your progress and completed sessions. Sign in to view it.";
            }
            return "I can help with scheduling, resources, and joining sessions. What would you like to know?";
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (!text) return;
            
            appendMessage(text, 'user');
            input.value = '';
            
            setTimeout(() => {
                appendMessage(botReply(text), 'bot');
            }, 500);
        });

        // Initial greeting
        appendMessage("Hi! I'm Navigate Bot. Ask me about sessions, resources, or using Navigate.", 'bot');
    });
})();