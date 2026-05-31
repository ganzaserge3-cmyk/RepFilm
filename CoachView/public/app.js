const state = {
  token: localStorage.getItem('coachview_token') || '',
  user: JSON.parse(localStorage.getItem('coachview_user') || 'null'),
};

const dom = {
  navLinks: document.querySelectorAll('[data-nav]'),
  sections: document.querySelectorAll('.section'),
  status: document.getElementById('status'),
  registerForm: document.getElementById('register-form'),
  loginForm: document.getElementById('login-form'),
  uploadForm: document.getElementById('upload-form'),
  videosList: document.getElementById('videos-list'),
  messageBox: document.getElementById('message-box'),
  userInfo: document.getElementById('user-info'),
  logoutButton: document.getElementById('logout-button'),
  homeHealth: document.getElementById('home-health'),
};

function showMessage(message, type = 'info') {
  dom.messageBox.textContent = message;
  dom.messageBox.className = `message ${type}`;
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
  if (state.user) {
    dom.userInfo.innerHTML = `Signed in as <strong>${state.user.email}</strong> (<em>${state.user.role}</em>)`;
    dom.logoutButton.style.display = 'inline-block';
  } else {
    dom.userInfo.textContent = 'Not signed in yet.';
    dom.logoutButton.style.display = 'none';
  }
  document.querySelectorAll('[data-auth-only]').forEach(el => {
    el.style.display = state.user ? '' : 'none';
  });
  document.querySelectorAll('[data-coach-only]').forEach(el => {
    el.style.display = state.user?.role === 'coach' ? '' : 'none';
  });
}

function api(path, options = {}) {
  const headers = options.headers || {};
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }
  return fetch(path, { ...options, headers });
}

function handleNavClick(event) {
  event.preventDefault();
  const target = event.currentTarget.dataset.nav;
  setActiveSection(target);
}

function setActiveSection(sectionId) {
  dom.sections.forEach(section => {
    section.style.display = section.id === sectionId ? 'block' : 'none';
  });
  dom.navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.nav === sectionId);
  });
  if (sectionId === 'videos') loadVideos();
}

async function handleRegister(event) {
  event.preventDefault();
  const form = new FormData(dom.registerForm);
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
  showMessage('Registration successful. You are now signed in.', 'success');
  setActiveSection('home');
}

async function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(dom.loginForm);
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
  setActiveSection('home');
}

async function handleUpload(event) {
  event.preventDefault();
  const formData = new FormData(dom.uploadForm);
  if (!formData.get('video')?.name) return showMessage('Choose a video file before uploading.', 'error');
  try {
    const response = await api('/api/videos', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) return showMessage(data.message || 'Upload failed', 'error');
    showMessage(`Video uploaded: ${data.title}`, 'success');
    dom.uploadForm.reset();
    setActiveSection('videos');
  } catch (err) {
    showMessage('Upload failed. Check your network and try again.', 'error');
  }
}

async function loadVideos() {
  try {
    const response = await api('/api/videos');
    const data = await response.json();
    if (!response.ok) {
      dom.videosList.innerHTML = `<li>${data.message || 'Unable to load videos'}</li>`;
      return;
    }
    if (!data.items.length) {
      dom.videosList.innerHTML = '<li>No videos uploaded yet.</li>';
      return;
    }
    dom.videosList.innerHTML = data.items
      .map(video => `
        <li class="video-card">
          <div><strong>${video.title}</strong> <span class="tag">${video.mimeType}</span></div>
          <div>${video.description || 'No description provided.'}</div>
          <div>Uploaded by coach ID ${video.coachId}</div>
          <div>Size: ${(video.fileSize / 1024 / 1024).toFixed(2)} MB • Created: ${new Date(video.createdAt).toLocaleString()}</div>
        </li>
      `)
      .join('');
  } catch (err) {
    dom.videosList.innerHTML = '<li>Unable to load videos due to network error.</li>';
  }
}

async function loadHealth() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    dom.homeHealth.textContent = response.ok ? 'OK' : 'Unavailable';
  } catch (_err) {
    dom.homeHealth.textContent = 'Unavailable';
  }
}

function logout() {
  updateAuthState('', null);
  showMessage('Signed out successfully.', 'success');
}

function init() {
  dom.navLinks.forEach(link => link.addEventListener('click', handleNavClick));
  dom.registerForm.addEventListener('submit', handleRegister);
  dom.loginForm.addEventListener('submit', handleLogin);
  dom.uploadForm.addEventListener('submit', handleUpload);
  dom.logoutButton.addEventListener('click', logout);
  renderAuthStatus();
  loadHealth();
  setActiveSection('home');
}

document.addEventListener('DOMContentLoaded', init);
