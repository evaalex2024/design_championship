// Shared helpers used across every page.

function showToast(message) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = message;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 2500);
}

async function api(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

// Mobile hamburger menu
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
}

// Avatar dropdown — My Profile / Settings / Logout, pulled out of the main nav
const avatarMenuBtn = document.getElementById('avatarMenuBtn');
const avatarDropdown = document.getElementById('avatarDropdown');
if (avatarMenuBtn && avatarDropdown) {
  avatarMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    avatarDropdown.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!avatarDropdown.contains(e.target)) avatarDropdown.classList.remove('open');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') avatarDropdown.classList.remove('open');
  });
}

// Logout is identical everywhere: clear the session, go back to the landing page.
const logoutLink = document.getElementById('logoutLink');
if (logoutLink) {
  logoutLink.addEventListener('click', async (e) => {
    e.preventDefault();
    await api('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  });
}

// Custom select — replaces native <select> with a styled dropdown, while
// keeping the real (hidden) <select> as the source of truth so existing
// code that reads/sets `.value` on it keeps working unchanged.
const customSelectRefreshers = {};

function refreshCustomSelect(selectId) {
  if (customSelectRefreshers[selectId]) customSelectRefreshers[selectId]();
}

function initCustomSelects() {
  document.querySelectorAll('.custom-select').forEach((wrap) => {
    if (wrap.dataset.wired) return;
    wrap.dataset.wired = 'true';

    const selectId = wrap.dataset.selectFor;
    const select = document.getElementById(selectId);
    const label = wrap.querySelector('.custom-select-label');
    const options = wrap.querySelectorAll('.custom-select-option');

    function refresh() {
      const opt = select.options[select.selectedIndex];
      label.textContent = opt ? opt.textContent : '';
      options.forEach((o) => o.classList.toggle('selected', o.dataset.value === select.value));
    }

    wrap.querySelector('.custom-select-trigger').addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.custom-select.open').forEach((o) => {
        if (o !== wrap) o.classList.remove('open');
      });
      wrap.classList.toggle('open');
    });

    options.forEach((opt) => {
      opt.addEventListener('click', () => {
        select.value = opt.dataset.value;
        refresh();
        wrap.classList.remove('open');
      });
    });

    customSelectRefreshers[selectId] = refresh;
    refresh();
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select.open').forEach((o) => o.classList.remove('open'));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.custom-select.open').forEach((o) => o.classList.remove('open'));
    }
  });
}

if (document.querySelector('.custom-select')) initCustomSelects();

// Lightbox — shared by Showcase posts and chat attachments. Call
// openLightbox(items, index) where items is [{url, type}, ...] and index
// is which one to show first; Prev/Next then walk that same list.
let lightboxItems = [];
let lightboxIndex = 0;

function showLightboxItem(index) {
  const item = lightboxItems[index];
  if (!item) return;
  lightboxIndex = index;

  const img = document.getElementById('lightboxImg');
  const video = document.getElementById('lightboxVideo');
  if (item.type === 'video') {
    img.hidden = true;
    img.removeAttribute('src');
    video.src = item.url;
    video.hidden = false;
    video.play().catch(() => {}); // ignore autoplay-blocked rejections
  } else {
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.hidden = true;
    img.src = item.url;
    img.hidden = false;
  }

  const showNav = lightboxItems.length > 1;
  document.getElementById('lightboxPrev').hidden = !showNav || index === 0;
  document.getElementById('lightboxNext').hidden = !showNav || index === lightboxItems.length - 1;

  const counter = document.getElementById('lightboxCounter');
  counter.textContent = showNav ? `${index + 1} / ${lightboxItems.length}` : '';
}

function openLightbox(items, index) {
  const overlay = document.getElementById('lightboxOverlay');
  if (!overlay) return;
  // The inline video (chat bubble / Showcase card) that was clicked to get
  // here keeps playing in the background otherwise — pause every other
  // video on the page so only the detached lightbox copy plays.
  document.querySelectorAll('video').forEach((v) => {
    if (v.id !== 'lightboxVideo') v.pause();
  });
  lightboxItems = items;
  showLightboxItem(index);
  overlay.classList.add('open');
}

function lightboxNext() {
  if (lightboxIndex < lightboxItems.length - 1) showLightboxItem(lightboxIndex + 1);
}

function lightboxPrev() {
  if (lightboxIndex > 0) showLightboxItem(lightboxIndex - 1);
}

function closeLightbox() {
  const overlay = document.getElementById('lightboxOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  const video = document.getElementById('lightboxVideo');
  video.pause();
  video.removeAttribute('src');
  video.load();
  document.getElementById('lightboxImg').removeAttribute('src');
}

const lightboxOverlay = document.getElementById('lightboxOverlay');
if (lightboxOverlay) {
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxNext').addEventListener('click', lightboxNext);
  document.getElementById('lightboxPrev').addEventListener('click', lightboxPrev);
  lightboxOverlay.addEventListener('click', (e) => {
    if (e.target === lightboxOverlay) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (!lightboxOverlay.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') lightboxNext();
    if (e.key === 'ArrowLeft') lightboxPrev();
  });
}
