(function() {
  const STORAGE_KEY = 'navigate_tutor_messages';

  document.addEventListener('DOMContentLoaded', () => {
    // Be flexible: different pages use different ids/classes for the messenger form
    const messagesEl = document.getElementById('tutor-messages') || document.getElementById('messenger-thread') || document.querySelector('.messenger-messages') || document.querySelector('.chat-messages');
    let form = document.getElementById('messenger-form') || document.getElementById('tutor-form');
    const input = document.getElementById('messenger-input') || document.querySelector('.messenger-input') || document.querySelector('.chat-input') || document.querySelector('#message-input') || document.querySelector('textarea.chat-input');
    const statusEl = document.getElementById('tutor-status') || null;
    // If we couldn't find a form by id, try to locate it from the input element
    if (!form && input) form = input.closest('form');
    const micBtn = form ? form.querySelector('.mic-btn') : null;

    // Require at minimum the messages container and the input
    if (!messagesEl || !input) return;

    function formatTime(date) {
      return new Intl.DateTimeFormat('en', {
        hour: 'numeric',
        minute: 'numeric'
      }).format(date);
    }

    // Use the same bubble markup and classes as the Chatbot for visual parity
    function appendMessage(text, sender = 'System', time = new Date()) {
      const msg = document.createElement('div');
      const from = (sender === 'You' || sender === 'user') ? 'user' : (sender === 'Tutor' || sender === 'tutor' ? 'tutor' : 'system');
      msg.className = 'chat-msg ' + (from === 'user' ? 'chat-user' : 'chat-bot');
      msg.dataset.from = from === 'user' ? 'user' : (from === 'tutor' ? 'tutor' : 'system');
      msg.classList.add('message');
      // Keep a small meta block similar to chatbot
      msg.innerHTML = `<div class="message-text">${text}</div>`;
      messagesEl.appendChild(msg);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function updateTutorStatus() {
      const hr = new Date().getHours();
      const isAvailable = hr >= 9 && hr < 17;
      if (statusEl) {
        statusEl.className = `tutor-status ${isAvailable ? '' : 'offline'}`;
        // Friendly human-readable status text when the element exists
        statusEl.textContent = isAvailable ? 'Online • A tutor will respond shortly' : 'Offline • Leave a message';
      }
      return isAvailable;
    }

    // Attach submit handler if we have a form (or fallback to listening to keydown on input)
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        appendMessage(text, 'You');
        input.value = '';
        // show typing indicator if present
        const typing = document.getElementById('typing-tutor');
        if (typing) typing.style.display = 'inline-flex';
        setTimeout(() => {
          if (typing) typing.style.display = 'none';
          // Always accept messages; provide an auto-reply depending on hours
          if (!updateTutorStatus()) {
            appendMessage("Thanks — our tutors are currently offline. They'll respond during business hours (9 AM - 5 PM).", 'System');
          } else {
            appendMessage("Thanks for your message. A tutor will see this shortly.", 'System');
          }
        }, 900);
      });
    } else {
      // Fallback: allow enter key to send when there's no form element
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const text = input.value.trim();
          if (!text) return;
          appendMessage(text, 'You');
          input.value = '';
          const typing = document.getElementById('typing-tutor');
          if (typing) typing.style.display = 'inline-flex';
          setTimeout(() => {
            if (typing) typing.style.display = 'none';
            if (!updateTutorStatus()) {
              appendMessage("Thanks — our tutors are currently offline. They'll respond during business hours (9 AM - 5 PM).", 'System');
            } else {
              appendMessage("Thanks for your message. A tutor will see this shortly.", 'System');
            }
          }, 900);
        }
      });
    }

    // Voice-to-text (mic)
    if (micBtn && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      micBtn.addEventListener('click', () => {
        recognition.start();
        micBtn.classList.add('listening');
      });

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        input.value += (input.value ? ' ' : '') + transcript;
        input.focus();
      };
      recognition.onend = () => micBtn.classList.remove('listening');
      recognition.onerror = () => micBtn.classList.remove('listening');
    }

    updateTutorStatus();
    setInterval(updateTutorStatus, 60000);
    appendMessage("Welcome! Our tutors are here to help with your questions.", 'System');
  });
})();

// === Voice controls (mic + speaker) for Tutor Messenger (TTS auto-read) ===
(() => {
  if (window.__messengerVoiceInit) return;
  window.__messengerVoiceInit = true;

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canSTT = !!Recognition;
  const canTTS = !!window.speechSynthesis;

  const pick = (sels) => sels.map(s => document.querySelector(s)).find(Boolean) || null;

  const input = pick(['#messenger-input', '.messenger-input', '#message-input', '.chat-input', 'textarea.chat-input']);
  const messages = pick(['#tutor-messages', '#messenger-thread', '.messages', '.chat-messages', '#messages', '#chat-messages']);
  if (!input || !messages) return;

  if (input.nextElementSibling?.classList?.contains('voice-toolbar')) return;

  const bar = document.createElement('div');
  bar.className = 'voice-toolbar';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Voice controls');

  const mic = document.createElement('button');
  mic.type = 'button';
  mic.className = 'icon-btn mic-btn';
  mic.title = 'Voice input';
  mic.innerHTML = '<span class="material-icons" aria-hidden="true">mic</span>';
  mic.disabled = !canSTT;

  const spk = document.createElement('button');
  spk.type = 'button';
  spk.className = 'icon-btn tts-btn';
  spk.title = 'Speaker off';
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
    const voices = window.speechSynthesis.getVoices();
    const pref = voices.find(v => /en-/i.test(v.lang)) || voices[0];
    if (pref) u.voice = pref;
    window.speechSynthesis.speak(u);
  }

  function speak(text) {
    if (!canTTS || !ttsOn || !text) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      const once = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', once);
        speakNow(text);
      };
      window.speechSynthesis.addEventListener('voiceschanged', once);
      setTimeout(() => speakNow(text), 600);
      return;
    }
    speakNow(text);
  }

  function extractText(node) {
    if (!node) return '';
    const txtEl = node.querySelector?.('.message-text') || node.querySelector?.('.chat-msg, .chat-bot, .chat-user');
    return (txtEl ? txtEl.textContent : node.textContent || '').trim();
  }

  function readLastTutorMessage() {
    const tutorNodes = messages.querySelectorAll('.chat-bot, .chat-msg[data-from="system"], .chat-msg[data-from="tutor"]');
    const last = tutorNodes[tutorNodes.length - 1];
    if (last) speak(extractText(last));
  }

  if (messages && canTTS) {
    const obs = new MutationObserver(muts => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (!(n instanceof HTMLElement)) continue;
          const isTutor = n.matches('.chat-bot, .chat-msg[data-from="system"], .chat-msg[data-from="tutor"]') || n.querySelector?.('.chat-bot, .chat-msg[data-from="system"], .chat-msg[data-from="tutor"]');
          if (isTutor && !spokenSet.has(n)) {
            spokenSet.add(n);
            speak(extractText(n));
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
    };
    recognition.onerror = stopListening;
    recognition.onend = stopListening;
    try { recognition.start(); } catch { stopListening(); }
  }

  function stopListening() {
    if (!listening) return;
    listening = false;
    try { recognition?.stop(); } catch {}
    mic.classList.remove('recording');
    mic.innerHTML = '<span class="material-icons" aria-hidden="true">mic</span>';
  }

  mic.addEventListener('click', () => (listening ? stopListening() : startListening()));

  spk.addEventListener('click', () => {
    if (!canTTS) return;
    ttsOn = !ttsOn;
    if (!ttsOn) {
      window.speechSynthesis.cancel();
      spk.innerHTML = '<span class="material-icons" aria-hidden="true">volume_off</span>';
      spk.title = 'Speaker off';
    } else {
      spk.innerHTML = '<span class="material-icons" aria-hidden="true">volume_up</span>';
      spk.title = 'Speaker on';
      readLastTutorMessage();
    }
  });
})();