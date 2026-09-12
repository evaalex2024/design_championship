document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: document.getElementById('current_password').value,
        new_password: document.getElementById('new_password').value,
      }),
    });
    document.getElementById('passwordForm').reset();
    showToast('Password updated! 🔒');
  } catch (err) {
    showToast(err.message);
  }
});
