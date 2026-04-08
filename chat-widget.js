/* ExpatPortugal.guide — AI Chat Widget (shared across all pages) */
(function() {
  /* CSS */
  var style = document.createElement('style');
  style.textContent = '.chat-fab{position:fixed;bottom:20px;right:20px;width:52px;height:52px;border-radius:50%;background:var(--red,#c0381a);color:white;border:none;cursor:pointer;font-size:22px;z-index:250;box-shadow:0 4px 16px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;transition:transform .2s}.chat-fab:hover{transform:scale(1.08)}.chat-box{position:fixed;bottom:80px;right:20px;width:360px;max-height:480px;background:var(--card,#fff);border:0.5px solid rgba(28,25,23,0.12);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.12);z-index:250;display:flex;flex-direction:column;overflow:hidden;opacity:0;transform:translateY(20px) scale(0.95);transition:opacity .5s ease,transform .5s ease;pointer-events:none}.chat-box.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}.chat-hd{padding:14px 16px;border-bottom:0.5px solid rgba(28,25,23,0.08);display:flex;justify-content:space-between;align-items:center}.chat-hd-t{font-size:14px;font-weight:500}.chat-hd-x{background:none;border:none;font-size:18px;cursor:pointer;color:#a8a29e}.chat-msgs{flex:1;overflow-y:auto;padding:12px 16px;min-height:200px;font-size:13px;line-height:1.6}.chat-msg{margin-bottom:10px;padding:8px 12px;border-radius:12px;max-width:85%;word-wrap:break-word}.chat-msg.bot{background:rgba(28,25,23,0.04);border-radius:12px 12px 12px 4px}.chat-msg.user{background:#c0381a;color:white;margin-left:auto;border-radius:12px 12px 4px 12px}.chat-typing{display:none;padding:4px 12px;font-size:12px;color:#a8a29e}.chat-input{display:flex;border-top:0.5px solid rgba(28,25,23,0.08);padding:8px}.chat-input input{flex:1;border:none;padding:8px 10px;font-size:13px;font-family:"Outfit",sans-serif;outline:none;background:transparent}.chat-input button{padding:6px 14px;background:#c0381a;color:white;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-family:"Outfit",sans-serif}.chat-quick{display:flex;flex-wrap:wrap;gap:4px;padding:4px 16px 10px}.chat-qb{font-size:11px;padding:4px 10px;border:0.5px solid rgba(28,25,23,0.12);border-radius:20px;cursor:pointer;background:white;color:#57534e;font-family:"Outfit",sans-serif}.chat-qb:hover{background:#f5f0e8}@media(max-width:500px){.chat-box{right:8px;left:8px;width:auto;bottom:72px;max-height:60vh}}';
  document.head.appendChild(style);

  /* HTML */
  var chatHTML = '<button class="chat-fab" id="chat-fab" onclick="toggleChat()">&#128172;</button>' +
    '<div id="chat-label" style="position:fixed;bottom:28px;right:78px;background:var(--card,#fff);padding:4px 10px;border-radius:8px;font-size:11px;font-weight:500;font-family:Outfit,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.1);z-index:250;color:#1c1917;pointer-events:none">Ask Pedro!</div>' +
    '<div class="chat-box" id="chat-box">' +
    '<div class="chat-hd"><span class="chat-hd-t">&#127477;&#127481; Ask Pedro</span><button class="chat-hd-x" onclick="toggleChat()">&times;</button></div>' +
    '<div class="chat-msgs" id="chat-msgs"><div class="chat-msg bot">Hi! I can help you plan your day, find services, navigate bureaucracy, or discover events. What do you need? &#128578;</div></div>' +
    '<div class="chat-quick"><button class="chat-qb" onclick="chatSend(\'Plan my day\')">Plan my day</button><button class="chat-qb" onclick="chatSend(\'Find a dentist\')">Find a dentist</button><button class="chat-qb" onclick="chatSend(\'How to get a NIF\')">Get a NIF</button><button class="chat-qb" onclick="chatSend(\'Events this week\')">Events this week</button></div>' +
    '<div class="chat-typing" id="chat-typing">Thinking...</div>' +
    '<div class="chat-input"><input id="chat-in" placeholder="Ask Pedro anything..." onkeydown="if(event.key===\'Enter\')chatSend()" /><button onclick="chatSend()">Send</button></div></div>';
  
  var div = document.createElement('div');
  div.innerHTML = chatHTML;
  document.body.appendChild(div);

  /* State */
  var chatOpen = false;
  var chatHistory = [];

  /* Auto-open on desktop after 3s */
  if (window.innerWidth > 900) {
    setTimeout(function() { if (!chatOpen) toggleChat(); }, 3000);
  }

  window.toggleChat = function() {
    chatOpen = !chatOpen;
    document.getElementById('chat-box').classList.toggle('open', chatOpen);
    document.getElementById('chat-fab').innerHTML = chatOpen ? '&times;' : '&#128172;';
    var label = document.getElementById('chat-label');
    if (label) label.style.display = chatOpen ? 'none' : 'block';
  };

  window.chatSend = function(text) {
    var input = document.getElementById('chat-in');
    var msg = text || input.value.trim();
    if (!msg) return;
    input.value = '';

    var msgs = document.getElementById('chat-msgs');
    msgs.innerHTML += '<div class="chat-msg user">' + msg + '</div>';
    msgs.scrollTop = msgs.scrollHeight;
    chatHistory.push({ role: 'user', content: msg });

    document.getElementById('chat-typing').style.display = 'block';
    document.querySelector('.chat-quick').style.display = 'none';

    var systemPrompt = 'You are Pedro, the friendly ExpatPortugal.guide assistant. Be warm, concise (max 150 words). Help with: day planning, finding services, bureaucracy (NIF, visas, tax), events, local recommendations. Use real place names. Link to site pages: calendar.html (events), directory.html (directory), lifestyle_services.html (services), expat_tools_v4_fixed.html (tools), communities.html (communities), news.html (news). Today is ' + new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    var apiMessages = [{ role: 'user', content: systemPrompt + '\n\nConversation:\n' + chatHistory.map(function(m) { return m.role + ': ' + m.content; }).join('\n') }];

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: apiMessages })
    }).then(function(r) { return r.json(); }).then(function(data) {
      document.getElementById('chat-typing').style.display = 'none';
      var reply = (data.reply || 'Sorry, please try again!').replace(/\n/g, '<br>');
      chatHistory.push({ role: 'assistant', content: reply });
      msgs.innerHTML += '<div class="chat-msg bot">' + reply + '</div>';
      msgs.scrollTop = msgs.scrollHeight;
    }).catch(function() {
      document.getElementById('chat-typing').style.display = 'none';
      msgs.innerHTML += '<div class="chat-msg bot">Sorry, I\'m having trouble connecting. Try again in a moment!</div>';
      msgs.scrollTop = msgs.scrollHeight;
    });
  };
})();
