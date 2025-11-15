(function() {
    const STORAGE_KEY = 'navigate_tutor_messages';
    
    document.addEventListener('DOMContentLoaded', () => {
        const messagesEl = document.getElementById('tutor-messages');
        const form = document.getElementById('messenger-form');
        const input = document.getElementById('messenger-input');
        const statusEl = document.getElementById('tutor-status');
        const micBtn = form ? form.querySelector('.mic-btn') : null;

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

        // Voice-to-text for mic button (Web Speech API)
        if (micBtn && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            micBtn.addEventListener('click', function () {
                recognition.start();
                micBtn.classList.add('listening');
            });

            recognition.onresult = function (event) {
                const transcript = event.results[0][0].transcript;
                input.value += (input.value ? ' ' : '') + transcript;
                input.focus();
            };

            recognition.onend = function () {
                micBtn.classList.remove('listening');
            };

            recognition.onerror = function () {
                micBtn.classList.remove('listening');
            };
        }

        // Initial status
        updateTutorStatus();
        setInterval(updateTutorStatus, 60000);

        // Welcome message
        appendMessage("Welcome! Our tutors are here to help with your questions.", 'System');
    });
})();


// ...existing code...

// === Voice controls (mic + speaker) for Tutor Messenger ===
(() => {
  if (window.__messengerVoiceInit) return; window.__messengerVoiceInit = true;

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canSTT = !!Recognition;
  const canTTS = !!window.speechSynthesis;

  const q = (sels) => sels.map(s => document.querySelector(s)).find(Boolean) || null;

  const input = q(['#messenger-input', '#message-input', '.messenger-input', '.chat-input', 'textarea.chat-input']);
  const messages = q(['#messenger-thread', '#messages', '.messages', '.chat-messages', '#chat-messages']);
  const sendBtn = q(['#messenger-send', '.messenger-send', '#send', '.chat-send', 'button[type="submit"]']);
  if (!input) return;

  if (input.nextElementSibling?.classList?.contains('voice-toolbar')) return;

  const bar = document.createElement('div');
  bar.className = 'voice-toolbar';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Voice controls');

  const mic = document.createElement('button');
  mic.type = 'button';
  mic.className = 'icon-btn mic-btn';
  mic.title = 'Voice input';
  mic.ariaLabel = 'Voice input';
  mic.innerHTML = '<span class="material-icons" aria-hidden="true">mic</span>';
  mic.disabled = !canSTT;

  const spk = document.createElement('button');
  spk.type = 'button';
  spk.className = 'icon-btn tts-btn';
  spk.title = 'Speaker off';
  spk.ariaLabel = 'Speaker off';
  spk.innerHTML = '<span class="material-icons" aria-hidden="true">volume_off</span>';
  spk.disabled = !canTTS;

  input.insertAdjacentElement('afterend', bar);
  bar.append(mic, spk);

  let recognition = null;
  let listening = false;
  let ttsOn = false;
  const spokenSet = new WeakSet();

  function speakNow(text) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = document.documentElement.lang || 'en-US';
    const vs = window.speechSynthesis.getVoices();
    const pref = vs.find(v => /en-/i.test(v.lang)) || vs[0];
    if (pref) u.voice = pref;
    window.speechSynthesis.speak(u);
  }
  function speak(text) {
    if (!canTTS || !ttsOn || !text) return;
    const vs = window.speechSynthesis.getVoices();
    if (!vs || vs.length === 0) {
      const once = () => { window.speechSynthesis.removeEventListener('voiceschanged', once); speakNow(text); };
      window.speechSynthesis.addEventListener('voiceschanged', once);
      setTimeout(() => { speakNow(text); }, 700);
      return;
    }
    speakNow(text);
  }
  function textOf(node) {
    if (!node) return '';
    const tutorMsg = node.matches?.('.bot, .assistant, [data-from="tutor"], [data-role="tutor"]')
      ? node
      : node.querySelector?.('.bot, .assistant, [data-from="tutor"], [data-role="tutor"]');
    return (tutorMsg || node).textContent.trim();
  }
  function readLastTutorMessage() {
    if (!messages) return;
    const nodes = messages.querySelectorAll('.bot, .assistant, [data-from="tutor"], [data-role="tutor"], .message, .msg');
    const last = nodes[nodes.length - 1];
    if (last) speak(textOf(last));
  }

  if (messages && canTTS) {
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (!(n instanceof HTMLElement)) continue;
          const isTutor = n.matches?.('.bot, .assistant, [data-from="tutor"], [data-role="tutor"]') ||
                          n.querySelector?.('.bot, .assistant, [data-from="tutor"], [data-role="tutor"]');
          if (isTutor && !spokenSet.has(n)) {
            spokenSet.add(n);
            speak(textOf(n));
          }
        }
      }
    });
    obs.observe(messages, { childList: true, subtree: true });
  }

  function startListening() {
    if (!canSTT || listening) return;
    recognition = new Recognition();
    recognition.lang = document.documentElement.lang || 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    listening = true;
    mic.classList.add('recording');
    mic.innerHTML = '<span class="material-icons" aria-hidden="true">mic_off</span>';

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0]?.transcript).join(' ').trim();
      if (!transcript) return;
      if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
        input.value = (input.value ? input.value + ' ' : '') + transcript;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      // sendBtn?.click();
    };
    recognition.onerror = () => stopListening();
    recognition.onend = () => stopListening();
    try { recognition.start(); } catch { stopListening(); }
  }
  function stopListening() {
    if (!listening) return;
    listening = false;
    try { recognition?.stop(); } catch {}
    mic.classList.remove('recording');
    mic.innerHTML = '<span class="material-icons" aria-hidden="true">mic</span>';
  }

  mic.addEventListener('click', () => listening ? stopListening() : startListening());
  spk.addEventListener('click', () => {
    if (!canTTS) return;
    ttsOn = !ttsOn;
    if (!ttsOn) {
      window.speechSynthesis.cancel();
      spk.innerHTML = '<span class="material-icons" aria-hidden="true">volume_off</span>';
      spk.title = 'Speaker off'; spk.ariaLabel = spk.title;
    } else {
      spk.innerHTML = '<span class="material-icons" aria-hidden="true">volume_up</span>';
      spk.title = 'Speaker on'; spk.ariaLabel = spk.title;
      readLastTutorMessage();
    }
  });
})();

// ...existing code...