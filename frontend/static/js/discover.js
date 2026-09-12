let activeCategory = '';

function matchBadgeClass(label) {
  if (label === 'Excellent Match') return 'match-excellent';
  if (label === 'Good Match') return 'match-good';
  return 'match-partial';
}

function renderResults(users) {
  const results = document.getElementById('results');
  results.innerHTML = '';

  if (users.length === 0) {
    results.innerHTML = '<p class="muted">No one matches that search yet.</p>';
    return;
  }

  users.forEach((user) => {
    const card = document.createElement('div');
    card.className = 'card';

    const badge = user.match.percent > 0
      ? `<span class="match-badge ${matchBadgeClass(user.match.label)}">${user.match.percent}% ${user.match.label}</span>`
      : '';

    const reasons = user.match.reasons.length
      ? `<ul class="match-reasons">${user.match.reasons.map(r => `<li>✓ ${r}</li>`).join('')}</ul>`
      : '';

    const teachTags = user.teach.map(s => `<span class="tag">${s.name}</span>`).join('');
    const learnTags = user.learn.map(s => `<span class="tag learn">${s.name}</span>`).join('');

    const details = [user.experience_level, user.availability, user.learning_preference]
      .filter(Boolean).join(' · ');

    let actionHtml;
    if (user.connection_status === 'pending_sent') {
      actionHtml = `<button class="btn primary" disabled>Request Sent</button>`;
    } else if (user.connection_status === 'pending_received') {
      actionHtml = `<a href="/connections"><button class="btn secondary" type="button">Respond in Connections →</button></a>`;
    } else {
      actionHtml = `<button class="btn primary" data-connect="${user.id}">Connect</button>`;
    }

    card.innerHTML = `
      ${badge}
      <div class="card-top">
        <img class="avatar" src="${user.avatar_url || '/static/img/default-avatar.svg'}" alt="${user.name}">
        <div><h3>${user.name}</h3><div class="muted">${user.bio || ''}</div></div>
      </div>
      ${details ? `<p class="muted" style="margin-bottom:12px">${details}</p>` : ''}
      <b>Can teach</b><div class="tags">${teachTags || '<span class="muted">Nothing listed</span>'}</div>
      <b>Wants to learn</b><div class="tags">${learnTags || '<span class="muted">Nothing listed</span>'}</div>
      ${reasons}
      ${actionHtml}
    `;
    results.appendChild(card);
  });

  results.querySelectorAll('[data-connect]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        const res = await api('/api/connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ other_user_id: Number(btn.dataset.connect) }),
        });
        btn.disabled = true;
        btn.textContent = res.status === 'accepted' ? 'Connected ✓' : 'Request Sent ✓';
        showToast(res.already_exists ? 'You already have a request with them.' : 'Connection request sent!');
      } catch (e) {
        showToast(e.message);
      }
    });
  });
}

async function loadDiscover() {
  const query = document.getElementById('search').value;
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (activeCategory) params.set('category', activeCategory);
  const users = await api(`/api/discover?${params.toString()}`);
  renderResults(users);
}

document.getElementById('search').addEventListener('input', loadDiscover);

document.querySelectorAll('.category-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeCategory = pill.dataset.category;
    document.getElementById('search').value = '';
    loadDiscover();
  });
});

loadDiscover();
