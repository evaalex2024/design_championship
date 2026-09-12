let activePublicCategory = '';

function openAuthModal(name) {
  document.getElementById('authModalTitle').textContent = `Log in to connect with ${name}`;
  document.getElementById('authModal').classList.add('open');
}
function closeAuthModal() {
  document.getElementById('authModal').classList.remove('open');
}
document.getElementById('authModalClose').addEventListener('click', closeAuthModal);
document.getElementById('authModal').addEventListener('click', (e) => {
  if (e.target.id === 'authModal') closeAuthModal();
});

function renderPublicResults(users) {
  const results = document.getElementById('publicResults');
  results.innerHTML = '';

  if (users.length === 0) {
    results.innerHTML = '<p class="muted">No one matches that search yet.</p>';
    return;
  }

  users.forEach((user) => {
    const card = document.createElement('div');
    card.className = 'card';

    const teachTags = user.teach.map(s => `<span class="tag">${s.name}</span>`).join('');
    const learnTags = user.learn.map(s => `<span class="tag learn">${s.name}</span>`).join('');
    const defaultAvatar = '/static/img/default-avatar.svg';

    card.innerHTML = `
      <div class="card-top">
        <img class="avatar" src="${user.avatar_url || defaultAvatar}" alt="${user.name}">
        <div><h3>${user.name}</h3><div class="muted">${user.bio || ''}</div></div>
      </div>
      <b>Can teach</b><div class="tags">${teachTags || '<span class="muted">Nothing listed</span>'}</div>
      <b>Wants to learn</b><div class="tags">${learnTags || '<span class="muted">Nothing listed</span>'}</div>
      <button class="btn primary" data-name="${user.name}">Connect</button>
    `;
    results.appendChild(card);
  });

  results.querySelectorAll('[data-name]').forEach((btn) => {
    btn.addEventListener('click', () => openAuthModal(btn.dataset.name));
  });
}

async function loadPublicDiscover() {
  const query = document.getElementById('publicSearch').value;
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (activePublicCategory) params.set('category', activePublicCategory);
  const users = await api(`/api/discover/public?${params.toString()}`);
  renderPublicResults(users);
}

document.getElementById('publicSearch').addEventListener('input', loadPublicDiscover);

document.querySelectorAll('#publicCategories .category-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('#publicCategories .category-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activePublicCategory = pill.dataset.category;
    document.getElementById('publicSearch').value = '';
    loadPublicDiscover();
  });
});

loadPublicDiscover();
