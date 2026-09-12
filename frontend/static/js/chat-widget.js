// Floating chat widget — available on every logged-in page, so chatting
// never requires navigating to a separate page.

let widgetConnections = [];
let widgetActiveConnectionId = null;
let widgetMyId = null;
let widgetThreadPollTimer = null;
let lastMessagesSignature = null;
let widgetBadgePollTimer = null;
let previousUnreadByConnection = null; // null = not yet baselined

function notifyNewMessages(connections) {
  if (previousUnreadByConnection === null) {
    previousUnreadByConnection = {};
    connections.forEach(c => { previousUnreadByConnection[c.connection_id] = c.unread_count; });
    return;
  }
  connections.forEach((c) => {
    const before = previousUnreadByConnection[c.connection_id] || 0;
    if (c.unread_count > before && c.connection_id !== widgetActiveConnectionId) {
      showToast(`💬 New message from ${c.with.name}`);
    }
    previousUnreadByConnection[c.connection_id] = c.unread_count;
  });
}

function updateChatBadge() {
  const totalUnread = widgetConnections.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  const fab = document.getElementById('chatFab');
  let badge = document.getElementById('chatFabBadge');
  if (totalUnread > 0) {
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'chatFabBadge';
      badge.className = 'badge-count';
      fab.appendChild(badge);
    }
    badge.textContent = totalUnread;
  } else if (badge) {
    badge.remove();
  }
}

function renderWidgetList() {
  const list = document.getElementById('chatWidgetList');
  list.innerHTML = '';
  if (widgetConnections.length === 0) {
    list.innerHTML = '<p class="muted" style="padding:16px">No connections yet — go to Discover and connect with someone.</p>';
    return;
  }
  widgetConnections.forEach((c) => {
    const item = document.createElement('div');
    item.className = 'chat-item';
    item.innerHTML = `
      <span class="avatar-wrap">
        <img class="avatar" src="${c.with.avatar_url || '/static/img/default-avatar.svg'}" alt="${c.with.name}">
        <span class="status-dot ${c.with.online ? 'online' : ''}" title="${c.with.online ? 'Online' : 'Offline'}"></span>
      </span>
      <b style="flex:1">${c.with.name}</b>
      ${c.unread_count > 0 ? `<span class="badge-count">${c.unread_count}</span>` : ''}
    `;
    item.addEventListener('click', () => openWidgetThread(c.connection_id, c.with));
    list.appendChild(item);
  });
}

function updateActiveThreadHeader() {
  if (!widgetActiveConnectionId) return;
  const active = widgetConnections.find(c => c.connection_id === widgetActiveConnectionId);
  if (!active) return;
  document.getElementById('chatWidgetTitle').innerHTML =
    `${active.with.name} <span style="font-size:11px;opacity:.85">${active.with.online ? '🟢 Online' : '⚪ Offline'}</span>`;
}

async function loadWidgetConnections() {
  widgetConnections = await api('/api/connections');
  notifyNewMessages(widgetConnections);
  renderWidgetList();
  updateChatBadge();
  updateActiveThreadHeader();
  return widgetConnections;
}

function showWidgetList() {
  widgetActiveConnectionId = null;
  if (widgetThreadPollTimer) clearInterval(widgetThreadPollTimer);
  document.getElementById('chatWidgetTitle').textContent = 'Messages';
  document.getElementById('chatBackBtn').style.display = 'none';
  document.getElementById('chatWidgetList').style.display = 'block';
  document.getElementById('chatWidgetThread').classList.remove('open');
  loadWidgetConnections();
}

async function openWidgetThread(connectionId, other) {
  document.getElementById('widgetChatInput').value = '';
  document.getElementById('widgetAttachInput').value = '';
  setPendingAttachment(null);

  widgetActiveConnectionId = connectionId;
  document.getElementById('chatWidgetTitle').innerHTML =
    `${other.name} <span style="font-size:11px;opacity:.85">${other.online ? '🟢 Online' : '⚪ Offline'}</span>`;
  document.getElementById('chatBackBtn').style.display = 'inline-block';
  document.getElementById('chatWidgetList').style.display = 'none';
  document.getElementById('chatWidgetThread').classList.add('open');
  document.getElementById('widgetMessages').innerHTML = ''; // empty box = always scrolls to bottom on this first render
  lastMessagesSignature = null; // force the first render for this thread, even if ids collide with the last one shown
  document.getElementById('chatWidget').classList.add('open');

  await refreshWidgetMessages();
  loadWidgetConnections(); // messages just got marked read server-side; updates the badge

  if (widgetThreadPollTimer) clearInterval(widgetThreadPollTimer);
  widgetThreadPollTimer = setInterval(refreshWidgetMessages, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderMessageAttachment(m) {
  if (!m.attachment_url) return '';
  if (m.attachment_type === 'video') {
    return `<div class="media-thumb-wrap">
               <video class="msg-attachment video" src="${m.attachment_url}" controls></video>
               <button type="button" class="expand-btn zoomable" data-url="${m.attachment_url}" data-type="video" title="View full size">⤢</button>
             </div>`;
  }
  return `<img class="msg-attachment zoomable" data-url="${m.attachment_url}" data-type="image" src="${m.attachment_url}" alt="attachment">`;
}

async function refreshWidgetMessages() {
  if (!widgetActiveConnectionId) return;
  const box = document.getElementById('widgetMessages');

  const messages = await api(`/api/connections/${widgetActiveConnectionId}/messages`);

  // A poll finding nothing new shouldn't touch the DOM at all — rebuilding
  // identical content every 3s is exactly what causes the visible "blip"
  // (images re-render, scroll gets recalculated, etc. for no reason).
  const signature = messages.map(m => m.id).join(',');
  if (signature === lastMessagesSignature) return;
  lastMessagesSignature = signature;

  // A background poll shouldn't yank the view back to the bottom if the
  // user has scrolled up to read older messages — only snap to bottom if
  // they were already there (which an empty/fresh box always counts as).
  const wasNearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;

  box.innerHTML = messages.map((m) => `
    <div class="msg ${m.sender_id === widgetMyId ? 'mine' : 'theirs'}">
      ${m.body ? escapeHtml(m.body) : ''}
      ${renderMessageAttachment(m)}
    </div>
  `).join('') || '<p class="muted">Say hello 👋</p>';

  if (wasNearBottom) {
    box.scrollTop = box.scrollHeight;
    // Images/videos have no known size until they finish loading, so the
    // box can grow taller *after* the scroll above already ran — re-apply
    // it once each piece of media actually loads.
    box.querySelectorAll('img, video').forEach((el) => {
      const stickToBottom = () => { box.scrollTop = box.scrollHeight; };
      if (el.tagName === 'IMG') {
        el.complete ? stickToBottom() : el.addEventListener('load', stickToBottom, { once: true });
      } else {
        el.addEventListener('loadedmetadata', stickToBottom, { once: true });
      }
    });
  }

  // Only messages with an attachment render a .zoomable element, in the
  // same relative order as `messages` — so filtering the same way keeps
  // each element's index aligned with its lightbox item.
  const mediaItems = messages
    .filter(m => m.attachment_url)
    .map(m => ({ url: m.attachment_url, type: m.attachment_type }));
  box.querySelectorAll('.zoomable').forEach((el, i) => {
    el.addEventListener('click', () => openLightbox(mediaItems, i));
  });
}

document.getElementById('chatFab').addEventListener('click', () => {
  const widget = document.getElementById('chatWidget');
  widget.classList.toggle('open');
  if (widget.classList.contains('open') && !widgetActiveConnectionId) {
    showWidgetList();
  }
});

document.getElementById('chatWidgetClose').addEventListener('click', () => {
  document.getElementById('chatWidget').classList.remove('open');
});

document.getElementById('chatBackBtn').addEventListener('click', showWidgetList);

let pendingAttachment = null;

function setPendingAttachment(file) {
  pendingAttachment = file;
  const preview = document.getElementById('attachPreview');
  if (file) {
    document.getElementById('attachPreviewName').textContent = `📎 ${file.name}`;
    preview.hidden = false;
  } else {
    preview.hidden = true;
  }
}

document.getElementById('widgetAttachBtn').addEventListener('click', () => {
  document.getElementById('widgetAttachInput').click();
});

document.getElementById('widgetAttachInput').addEventListener('change', () => {
  const file = document.getElementById('widgetAttachInput').files[0];
  if (file) setPendingAttachment(file);
});

document.getElementById('attachRemoveBtn').addEventListener('click', () => {
  document.getElementById('widgetAttachInput').value = '';
  setPendingAttachment(null);
});

document.getElementById('widgetSendBtn').addEventListener('click', async () => {
  const input = document.getElementById('widgetChatInput');
  const body = input.value.trim();
  if ((!body && !pendingAttachment) || !widgetActiveConnectionId) return;

  const formData = new FormData();
  formData.append('body', body);
  if (pendingAttachment) formData.append('attachment', pendingAttachment);

  await api(`/api/connections/${widgetActiveConnectionId}/messages`, {
    method: 'POST',
    body: formData,
  });

  input.value = '';
  document.getElementById('widgetAttachInput').value = '';
  setPendingAttachment(null);
  await refreshWidgetMessages();
});

document.getElementById('widgetChatInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('widgetSendBtn').click();
});

(async () => {
  const me = await api('/api/auth/me');
  widgetMyId = me.id;
  await loadWidgetConnections();

  // Tell the server we're active, so other people see us as online.
  // Being idle/backgrounded should NOT go offline — only actually
  // closing the tab/window does (handled below via sendBeacon).
  api('/api/auth/heartbeat', { method: 'POST' });
  setInterval(() => api('/api/auth/heartbeat', { method: 'POST' }), 20000);

  // Fires when the tab/window is actually closed (or navigated away from
  // entirely). sendBeacon is used instead of fetch because it's designed
  // to reliably complete even as the page is being torn down.
  window.addEventListener('pagehide', () => {
    navigator.sendBeacon('/api/auth/offline');
  });

  // Keep the badge and connections list live for EVERY connection, even
  // while a specific thread is open — otherwise a message from someone
  // else never surfaces until you close the active thread.
  widgetBadgePollTimer = setInterval(() => {
    loadWidgetConnections();
  }, 5000);

  // Discover's "Chat with X" link passes ?open=<connection_id> on any page.
  const openId = Number(new URLSearchParams(window.location.search).get('open'));
  if (openId) {
    const target = widgetConnections.find(c => c.connection_id === openId);
    if (target) openWidgetThread(target.connection_id, target.with);
  }
})();
