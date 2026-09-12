let myId = null;

function renderPosts(posts) {
  const grid = document.getElementById('showcaseGrid');
  grid.innerHTML = '';
  if (posts.length === 0) {
    grid.innerHTML = '<p class="muted">No skills posted yet — be the first to share!</p>';
    return;
  }
  posts.forEach((post) => {
    const card = document.createElement('div');
    card.className = 'card';
    const media = post.media_type === 'video'
      ? `<div class="media-thumb-wrap">
           <video class="showcase-media" src="${post.media_url}" controls></video>
           <button type="button" class="expand-btn zoomable" data-url="${post.media_url}" data-type="video" title="View full size">⤢</button>
         </div>`
      : `<img class="showcase-media zoomable" src="${post.media_url}" data-url="${post.media_url}" data-type="image" alt="${post.name}">`;
    const deleteBtn = post.user_id === myId
      ? `<button type="button" class="icon-btn-delete" data-delete="${post.id}" title="Delete post" aria-label="Delete post">
           <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <polyline points="3 6 5 6 21 6"></polyline>
             <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
             <line x1="10" y1="11" x2="10" y2="17"></line>
             <line x1="14" y1="11" x2="14" y2="17"></line>
           </svg>
         </button>`
      : '';
    card.innerHTML = `
      ${media}
      <div style="padding-top:14px">
        <b>${post.name}</b>
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
          <p class="muted" style="margin:0">${post.description || ''}</p>
          ${deleteBtn}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // Each post contributes exactly one .zoomable element, in the same
  // order as `posts`, so its index there doubles as the lightbox index.
  const mediaItems = posts.map(p => ({ url: p.media_url, type: p.media_type }));
  grid.querySelectorAll('.zoomable').forEach((el, i) => {
    el.addEventListener('click', () => openLightbox(mediaItems, i));
  });

  grid.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await api(`/api/showcase/${btn.dataset.delete}`, { method: 'DELETE' });
        showToast('Post removed.');
        loadShowcase();
      } catch (err) {
        showToast(err.message);
      }
    });
  });
}

let lastPostsSignature = null;

async function loadShowcase() {
  const posts = await api('/api/showcase');

  // Only re-render when the actual set of posts changed — otherwise a
  // blind poll-driven re-render would restart anyone's in-progress video
  // playback every few seconds.
  const signature = posts.map(p => p.id).join(',');
  if (signature === lastPostsSignature) return;
  lastPostsSignature = signature;

  renderPosts(posts);
}

let currentPreviewUrl = null;

function resetUploadArea() {
  const videoEl = document.getElementById('showcasePreviewVideo');
  videoEl.pause(); // hiding a <video> doesn't stop playback — must pause explicitly
  videoEl.removeAttribute('src');
  videoEl.load(); // drop the buffered media, not just the src reference
  document.getElementById('showcasePreviewImg').removeAttribute('src');

  if (currentPreviewUrl) {
    URL.revokeObjectURL(currentPreviewUrl);
    currentPreviewUrl = null;
  }

  document.getElementById('media').value = '';
  document.getElementById('showcasePreviewName').textContent = '';
  document.getElementById('showcaseDropzoneEmpty').hidden = false;
  document.getElementById('showcaseDropzonePreview').hidden = true;
  document.getElementById('showcasePreviewImg').hidden = true;
  videoEl.hidden = true;
  document.getElementById('showcaseAttachRemove').hidden = true;
  document.getElementById('showcaseSubmitBtn').disabled = true;
}

document.getElementById('media').addEventListener('change', () => {
  const file = document.getElementById('media').files[0];
  if (!file) { resetUploadArea(); return; }

  if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
  currentPreviewUrl = URL.createObjectURL(file);
  const isVideo = file.type.startsWith('video');

  document.getElementById('showcaseDropzoneEmpty').hidden = true;
  document.getElementById('showcaseDropzonePreview').hidden = false;
  document.getElementById('showcasePreviewImg').hidden = isVideo;
  document.getElementById('showcasePreviewVideo').hidden = !isVideo;
  document.getElementById(isVideo ? 'showcasePreviewVideo' : 'showcasePreviewImg').src = currentPreviewUrl;
  document.getElementById('showcasePreviewName').textContent = file.name;
  document.getElementById('showcaseAttachRemove').hidden = false;
  document.getElementById('showcaseSubmitBtn').disabled = false;
});

document.getElementById('showcaseAttachRemove').addEventListener('click', (e) => {
  e.preventDefault(); // this button sits right after a <label for="media">
  resetUploadArea();
});

function openShowcaseSheet() {
  document.getElementById('showcaseSheet').classList.add('open');
}

function closeShowcaseSheet() {
  document.getElementById('showcaseSheet').classList.remove('open');
  document.getElementById('description').value = '';
  resetUploadArea(); // closing counts as cancel — don't leave a stale staged file
}

document.getElementById('openShowcaseFormBtn').addEventListener('click', openShowcaseSheet);
document.getElementById('showcaseSheetClose').addEventListener('click', closeShowcaseSheet);
document.getElementById('showcaseSheet').addEventListener('click', (e) => {
  if (e.target.id === 'showcaseSheet') closeShowcaseSheet();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('showcaseSheet').classList.contains('open')) {
    closeShowcaseSheet();
  }
});

document.getElementById('showcaseForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const file = document.getElementById('media').files[0];
  if (!file) { showToast('Please choose a photo or video.'); return; }

  const formData = new FormData();
  formData.append('description', document.getElementById('description').value.trim());
  formData.append('media', file);

  try {
    await api('/api/showcase', { method: 'POST', body: formData });
    document.getElementById('description').value = '';
    resetUploadArea();
    document.getElementById('showcaseSheet').classList.remove('open');
    showToast('Your skill has been posted! 🌟');
    loadShowcase();
  } catch (err) {
    showToast(err.message);
  }
});

(async () => {
  const me = await api('/api/auth/me');
  myId = me.id;
  loadShowcase();
  setInterval(loadShowcase, 5000);
})();
