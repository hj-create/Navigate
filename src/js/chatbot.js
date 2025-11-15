(function() {
    const STORAGE_KEY = 'navigate_chat_history_v1';

    document.addEventListener('DOMContentLoaded', () => {
        const messagesEl = document.getElementById('chat-messages');
        const form = document.getElementById('chat-form');
        const input = document.getElementById('chat-input');
        const micBtn = form ? form.querySelector('.mic-btn') : null;

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

        // Voice-to-text for mic button (Web Speech API)
        if (micBtn && window.SpeechRecognition || window.webkitSpeechRecognition) {
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
                input.value = transcript;
                input.focus();
            };

            recognition.onend = function () {
                micBtn.classList.remove('listening');
            };

            recognition.onerror = function () {
                micBtn.classList.remove('listening');
            };
        }

        // Initial greeting
        appendMessage("Hi! I'm Navigate Bot. Ask me about sessions, resources, or using Navigate.", 'bot');
    });
})();


// ...existing code...

// === Voice controls (mic + speaker) for Chatbot ===
(() => {
  if (window.__chatbotVoiceInit) return; window.__chatbotVoiceInit = true;

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canSTT = !!Recognition;
  const canTTS = !!window.speechSynthesis;

  const q = (sels) => sels.map(s => document.querySelector(s)).find(Boolean) || null;

  const input = q(['#chatbot-input', '#chat-input', '.chat-input', 'textarea.chat-input', '#message', 'input.chat-input']);
  const messages = q(['#chatbot-messages', '#chat-messages', '.chat-messages', '.messages', '#thread', '.conversation']);
  const sendBtn = q(['#chatbot-send', '#chat-send', '.chat-send', 'button[type="submit"]']);
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
    // Optional: pick a preferred voice if available (Windows "Microsoft" voices, etc.)
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
      // Fallback timer in case voiceschanged doesn’t fire
      setTimeout(() => { speakNow(text); }, 700);
      return;
    }
    speakNow(text);
  }
  function textOf(node) {
    if (!node) return '';
    const botMsg = node.matches?.('.bot, .assistant, [data-from="bot"], [data-role="bot"]')
      ? node
      : node.querySelector?.('.bot, .assistant, [data-from="bot"], [data-role="bot"]');
    return (botMsg || node).textContent.trim();
  }
  function readLastBotMessage() {
    if (!messages) return;
    const nodes = messages.querySelectorAll('.bot, .assistant, [data-from="bot"], [data-role="bot"], .message, .msg');
    const last = nodes[nodes.length - 1];
    if (last) speak(textOf(last));
  }

  if (messages && canTTS) {
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (!(n instanceof HTMLElement)) continue;
          const isBot = n.matches?.('.bot, .assistant, [data-from="bot"], [data-role="bot"]') ||
                        n.querySelector?.('.bot, .assistant, [data-from="bot"], [data-role="bot"]');
          if (isBot && !spokenSet.has(n)) {
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
      // Read the last bot reply immediately
      readLastBotMessage();
    }
  });
})();

// ...existing code...