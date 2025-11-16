// Chatbot module with Text-to-Speech support.

(() => {
  // State
  let chatbotSpeechEnabled = true;

  // DOM refs (adjust selectors as needed)
  const inputEl = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');
  const messagesEl = document.getElementById('chatbotMessages');
  const speechToggleBtn = document.getElementById('chatbotSpeechToggle');

  // TTS
  function speakText(text, voiceName = 'Google US English') {
    if (!chatbotSpeechEnabled || !text) return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    const startSpeak = () => {
      const voices = synth.getVoices();
      const voice =
        voices.find(v => v.name === voiceName) ||
        voices.find(v => /english/i.test(v.lang)) ||
        voices[0];
      if (synth.speaking) synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.voice = voice || null;
      utter.rate = 1;
      utter.pitch = 1;
      utter.onerror = e => console.warn('Chatbot TTS error', e);
      synth.speak(utter);
    };
    if (synth.getVoices().length === 0) {
      synth.onvoiceschanged = startSpeak;
    } else {
      startSpeak();
    }
  }

  // Toggle
  function updateSpeechToggleUI() {
    if (!speechToggleBtn) return;
    speechToggleBtn.textContent = chatbotSpeechEnabled ? '🔊 Voice On' : '🔇 Voice Off';
  }
  speechToggleBtn?.addEventListener('click', () => {
    chatbotSpeechEnabled = !chatbotSpeechEnabled;
    updateSpeechToggleUI();
  });

  // Rendering
  function appendMessage(role, text) {
    if (!messagesEl) return;
    const row = document.createElement('div');
    row.className = `chat-row chat-${role}`;
    row.innerHTML = `<div class="chat-bubble">${escapeHtml(text)}</div>`;
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function escapeHtml(str = '') {
    return str.replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }

  // Simulated backend call (replace with real)
  async function getBotReply(userText) {
    // Placeholder: echo or simple logic
    await delay(150);
    if (/hello/i.test(userText)) return 'Hi there! How can I assist you today?';
    return `You said: "${userText}".`;
  }

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // Flow
  async function sendUserMessage() {
    const text = (inputEl?.value || '').trim();
    if (!text) return;
    appendMessage('user', text);
    inputEl.value = '';
    sendBtn && (sendBtn.disabled = true);
    try {
      const botReply = await getBotReply(text);
      appendMessage('bot', botReply);
      speakText(botReply);
    } catch (e) {
      console.warn('Chatbot send error', e);
      appendMessage('bot', 'Sorry, an error occurred.');
    } finally {
      sendBtn && (sendBtn.disabled = false);
      inputEl?.focus();
    }
  }

  // Events
  sendBtn?.addEventListener('click', sendUserMessage);
  inputEl?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage();
    }
  });

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    updateSpeechToggleUI();
    // Optional greeting
    const greet = 'Hello! I am your study assistant.';
    appendMessage('bot', greet);
    speakText(greet);
  });
})();