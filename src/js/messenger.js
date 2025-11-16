// Messenger module with Text-to-Speech for incoming messages.

(() => {
  let messengerSpeechEnabled = true;

  // DOM refs (adjust selectors)
  const threadEl = document.getElementById('messagesThread');
  const inputEl = document.getElementById('messageInput');
  const sendBtn = document.getElementById('messageSendBtn');
  const speechToggleBtn = document.getElementById('messengerSpeechToggle');

  // TTS
  function speakText(text, voiceName = 'Google US English') {
    if (!messengerSpeechEnabled || !text) return;
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
      utter.onerror = e => console.warn('Messenger TTS error', e);
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
    speechToggleBtn.textContent = messengerSpeechEnabled ? '🔊 Voice On' : '🔇 Voice Off';
  }
  speechToggleBtn?.addEventListener('click', () => {
    messengerSpeechEnabled = !messengerSpeechEnabled;
    updateSpeechToggleUI();
  });

  // Rendering
  function renderMessage(from, text, outbound = false) {
    if (!threadEl) return;
    const row = document.createElement('div');
    row.className = `msg-row ${outbound ? 'msg-out' : 'msg-in'}`;
    row.innerHTML = `
      <div class="msg-bubble">
        <div class="msg-meta">${escapeHtml(from)}</div>
        <div class="msg-text">${escapeHtml(text)}</div>
      </div>`;
    threadEl.appendChild(row);
    threadEl.scrollTop = threadEl.scrollHeight;
  }

  function escapeHtml(str = '') {
    return str.replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }

  // Simulated send (replace with real API/socket)
  async function sendMessage() {
    const text = (inputEl?.value || '').trim();
    if (!text) return;
    renderMessage('Me', text, true);
    inputEl.value = '';
    sendBtn && (sendBtn.disabled = true);
    try {
      // Simulate server echo / other user
      const reply = await fakeRemoteReply(text);
      onMessageReceived({ from: 'Tutor', content: reply });
    } catch (e) {
      console.warn('Messenger send error', e);
    } finally {
      sendBtn && (sendBtn.disabled = false);
      inputEl?.focus();
    }
  }

  function fakeRemoteReply(userText) {
    return new Promise(r => setTimeout(() => {
      if (/help|question/i.test(userText)) {
        r('Sure, send your question and I will assist.');
      } else {
        r('Got it: ' + userText);
      }
    }, 300));
  }

  // Incoming handler
  function onMessageReceived(msg) {
    renderMessage(msg.from, msg.content, false);
    speakText(msg.content);
  }

  // Events
  sendBtn?.addEventListener('click', sendMessage);
  inputEl?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    updateSpeechToggleUI();
    const welcome = 'Messenger ready.';
    renderMessage('System', welcome, false);
    speakText(welcome);
  });

  // Expose minimal API if needed globally
  window.MessengerAPI = {
    speak: speakText,
    toggleSpeech(on) { messengerSpeechEnabled = !!on; updateSpeechToggleUI(); },
    receive(msg) { onMessageReceived(msg); }
  };
})();