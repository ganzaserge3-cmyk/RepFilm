const state = {
  token: localStorage.getItem('coachview_token') || '',
  user: JSON.parse(localStorage.getItem('coachview_user') || 'null'),
};

function showMessage(message, type = 'info') {
  const box = document.getElementById('message-box');
  if (!box) return;
  box.textContent = message;
  box.className = `message ${type}`;
}

function updateAuthState(token, user) {
  state.token = token;
  state.user = user;
  if (token) {
    localStorage.setItem('coachview_token', token);
    localStorage.setItem('coachview_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('coachview_token');
    localStorage.removeItem('coachview_user');
  }
  renderAuthStatus();
}

function renderAuthStatus() {
  document.querySelectorAll('.site-nav a').forEach(link => {
    if (link.href === window.location.origin + '/' || link.href === window.location.href) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  const logoutBtn = document.getElementById('logout-button');
  const profileEmail = document.getElementById('profile-email');
  const profileRole = document.getElementById('profile-role');
  const profileTokenStatus = document.getElementById('profile-token');
  const message = document.getElementById('message-box');

  if (state.user) {
    if (profileEmail) profileEmail.textContent = state.user.email;
    if (profileRole) profileRole.textContent = state.user.role;
    if (profileTokenStatus) profileTokenStatus.textContent = 'Signed in';
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    if (message && document.body.dataset.page === 'profile') {
      showMessage('You are signed in. Manage your account here.', 'success');
    }
  } else {
    if (profileEmail) profileEmail.textContent = '—';
    if (profileRole) profileRole.textContent = '—';
    if (profileTokenStatus) profileTokenStatus.textContent = 'Not signed in';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (message && document.body.dataset.page === 'profile') {
      showMessage('Sign in to see your profile information.', 'info');
    }
  }
}

function api(path, options = {}) {
  const headers = options.headers || {};
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }
  return fetch(path, { ...options, headers });
}

async function handleRegister(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const body = {
    email: form.get('email'),
    password: form.get('password'),
    role: form.get('role'),
  };
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) return showMessage(data.message || 'Registration failed', 'error');
  updateAuthState(data.token, data.user);
  showMessage('Registration successful. You are signed in.', 'success');
}

async function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const body = {
    email: form.get('email'),
    password: form.get('password'),
  };
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) return showMessage(data.message || 'Login failed', 'error');
  updateAuthState(data.token, data.user);
  showMessage('Login successful.', 'success');
}

async function handleUpload(event) {
  event.preventDefault();
  if (!state.user) return showMessage('Please sign in as a coach before uploading.', 'error');
  if (state.user.role !== 'coach') return showMessage('Only coaches can upload videos.', 'error');

  const formData = new FormData(event.target);
  if (!formData.get('video')?.name) return showMessage('Choose a video file before uploading.', 'error');

  try {
    const response = await api('/api/videos', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) return showMessage(data.message || 'Upload failed', 'error');
    showMessage(`Video uploaded: ${data.title}`, 'success');
    event.target.reset();
  } catch (err) {
    showMessage('Upload failed. Check your connection and try again.', 'error');
  }
}

async function loadVideos() {
  const list = document.getElementById('videos-list');
  if (!list) return;
  showMessage('Loading videos...', 'info');

  try {
    const response = await api('/api/videos');
    const data = await response.json();
    if (!response.ok) {
      list.innerHTML = `<p>${data.message || 'Unable to load videos'}</p>`;
      return;
    }
    if (!data.items.length) {
      list.innerHTML = '<p>No videos uploaded yet.</p>';
      showMessage('No videos are available yet.', 'info');
      return;
    }
    list.innerHTML = data.items.map(video => {
      const videoUrl = video.fileUrl ? `<a href="${video.fileUrl}" target="_blank">Stream/download</a>` : 'No file available';
      return `<article class="video-card">
        <strong>${video.title}</strong>
        <p>${video.description || 'No description provided.'}</p>
        <p><span class="tag">${video.mimeType}</span> · ${(video.fileSize / 1024 / 1024).toFixed(2)} MB</p>
        <p>Coach ID: ${video.coachId}</p>
        <p>${new Date(video.createdAt).toLocaleString()}</p>
        <p>${videoUrl}</p>
      </article>`;
    }).join('');
    showMessage('Video list loaded.', 'success');
  } catch (err) {
    list.innerHTML = '<p>Unable to load videos due to network error.</p>';
    showMessage('Unable to load videos.', 'error');
  }
}

async function loadHome() {
  const health = document.getElementById('home-health');
  if (!health) return;

  try {
    const response = await fetch('/api/health');
    health.textContent = response.ok ? 'OK' : 'Unavailable';
  } catch (_err) {
    health.textContent = 'Unavailable';
  }
}

function logout() {
  updateAuthState('', null);
  showMessage('Signed out successfully.', 'success');
}

function initPage() {
  renderAuthStatus();
  loadHome();

  const page = document.body.dataset.page;
  if (page === 'register') {
    const form = document.getElementById('register-form');
    if (form) form.addEventListener('submit', handleRegister);
  }
  if (page === 'login') {
    const form = document.getElementById('login-form');
    if (form) form.addEventListener('submit', handleLogin);
  }
  if (page === 'upload') {
    const form = document.getElementById('upload-form');
    if (form) form.addEventListener('submit', handleUpload);
    if (!state.user) showMessage('Please log in as a coach to upload videos.', 'info');
    if (state.user && state.user.role !== 'coach') showMessage('Upload access is limited to coaches only.', 'error');
  }
  if (page === 'videos') {
    loadVideos();
  }
  if (page === 'profile') {
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
  }
}

document.addEventListener('DOMContentLoaded', initPage);
