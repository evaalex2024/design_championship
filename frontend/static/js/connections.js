async function loadPending() {
  const pending = await api('/api/connections/pending');
  const list = document.getElementById('pendingList');
  list.innerHTML = '';
  if (pending.length === 0) {
    list.innerHTML = '<p class="muted">No pending requests.</p>';
    return;
  }
  pending.forEach((p) => {
    const item = document.createElement('div');
    item.className = 'chat-item';
    item.innerHTML = `
      <span class="avatar-wrap">
        <img class="avatar" src="${p.from.avatar_url || '/static/img/default-avatar.svg'}" alt="${p.from.name}">
        <span class="status-dot ${p.from.online ? 'online' : ''}" title="${p.from.online ? 'Online' : 'Offline'}"></span>
      </span>
      <b style="flex:1">${p.from.name} wants to connect</b>
      <button class="btn primary" data-accept="${p.connection_id}" style="padding:8px 14px">Accept</button>
      <button class="btn" data-reject="${p.connection_id}" style="padding:8px 14px;background:#A65E46;color:#02000D">Reject</button>
    `;
    list.appendChild(item);
  });

  list.querySelectorAll('[data-accept]').forEach((btn) => btn.addEventListener('click', async () => {
    await api(`/api/connections/${btn.dataset.accept}/accept`, { method: 'POST' });
    showToast('Connection accepted!');
    loadPending();
    renderMyConnections();
  }));
  list.querySelectorAll('[data-reject]').forEach((btn) => btn.addEventListener('click', async () => {
    await api(`/api/connections/${btn.dataset.reject}/reject`, { method: 'POST' });
    showToast('Request declined.');
    loadPending();
  }));
}

async function renderMyConnections() {
  const list = document.getElementById('chatList');
  const connections = await loadWidgetConnections(); // shared with the floating chat widget
  list.innerHTML = '';
  if (connections.length === 0) {
    list.innerHTML = '<p class="muted">No connections yet — go to Discover and connect with someone.</p>';
    return;
  }
  connections.forEach((c) => {
    const item = document.createElement('div');
    item.className = 'chat-item';
    const teachTags = c.with.teach.map(s => `<span class="tag">${s.name}</span>`).join('');
    const learnTags = c.with.learn.map(s => `<span class="tag learn">${s.name}</span>`).join('');
    item.innerHTML = `
      <span class="avatar-wrap">
        <img class="avatar" src="${c.with.avatar_url || '/static/img/default-avatar.svg'}" alt="${c.with.name}">
        <span class="status-dot ${c.with.online ? 'online' : ''}" title="${c.with.online ? 'Online' : 'Offline'}"></span>
      </span>
      <div style="flex:1;min-width:0">
        <b>${c.with.name}</b>
        <div class="tags" style="margin-top:6px">${teachTags}${learnTags || '<span class="muted">Nothing listed</span>'}</div>
      </div>
      ${c.unread_count > 0 ? `<span class="badge-count">${c.unread_count}</span>` : ''}
    `;
    item.addEventListener('click', () => openWidgetThread(c.connection_id, c.with));
    list.appendChild(item);
  });
}

loadPending();
renderMyConnections();
