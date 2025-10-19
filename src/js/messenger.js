(function() {
    const STORAGE_KEY = 'navigate_tutor_messages';
    
    document.addEventListener('DOMContentLoaded', () => {
        const messagesEl = document.getElementById('tutor-messages');
        const form = document.getElementById('messenger-form');
        const input = document.getElementById('messenger-input');
        const statusEl = document.getElementById('tutor-status');
        
        if (!messagesEl || !form || !input) return;

        function formatTime(date) {
            return new Intl.DateTimeFormat('en', {
                hour: 'numeric',
                minute: 'numeric'
            }).format(date);
        }

        function appendMessage(text, sender, time = new Date()) {
            const msg = document.createElement('div');
            msg.className = 'messenger-message';
            msg.innerHTML = `
                <div class="message-avatar">
                    <span class="material-icons">${sender === 'You' ? 'person' : 'school'}</span>
                </div>
                <div class="message-content">
                    <div class="message-sender">${sender}</div>
                    <div class="message-text">${text}</div>
                    <div class="message-time">${formatTime(time)}</div>
                </div>
            `;
            messagesEl.appendChild(msg);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        // Simulate tutor availability
        function updateTutorStatus() {
            const isAvailable = new Date().getHours() >= 9 && new Date().getHours() < 17;
            statusEl.className = `tutor-status ${isAvailable ? '' : 'offline'}`;
            return isAvailable;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (!text) return;
            
            appendMessage(text, 'You');
            input.value = '';
            
            // Simulate tutor response
            setTimeout(() => {
                if (!updateTutorStatus()) {
                    appendMessage("Our tutors are currently offline. They'll respond during business hours (9 AM - 5 PM).", 'System');
                    return;
                }
                appendMessage("Thanks for your message. A tutor will respond shortly.", 'System');
            }, 1000);
        });

        // Initial status
        updateTutorStatus();
        setInterval(updateTutorStatus, 60000);

        // Welcome message
        appendMessage("Welcome! Our tutors are here to help with your questions.", 'System');
    });
})();