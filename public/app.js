/**
 * SafeSpace - Frontend Application
 * Handles authentication, navigation, and feature interactions
 */

// ============================================
// State Management
// ============================================
const state = {
  user: null,
  currentTab: 'chat',
  currentSessionId: null,
  currentSession: null,
  lastMessageTime: null,
  pollingInterval: null,
  sessions: [],
  messages: [],
  journals: [],
  moods: [],
  companions: [],
  selectedCompanionId: null,
  isSendingMessage: false,
};

// ============================================
// API Helpers
// ============================================
async function api(endpoint, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  const response = await fetch(`/api${endpoint}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// ============================================
// Loading Overlay
// ============================================
let loadingCount = 0;

function showLoading() {
  loadingCount++;
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.add('active');
  }
}

function hideLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  if (loadingCount === 0) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }
}

// ============================================
// Authentication
// ============================================
async function checkAuth() {
  try {
    const data = await api('/me');
    state.user = data.user;

    if (!state.user.hasConsented) {
      window.location.href = '/onboarding.html';
      return false;
    }

    document.getElementById('userName').textContent = state.user.displayName;
    return true;
  } catch (err) {
    window.location.href = '/landing.html';
    return false;
  }
}

async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  // Redirect regardless of result
  window.location.href = '/landing.html';
}

// ============================================
// Navigation
// ============================================
function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  // Update nav tabs
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === tabId);
  });

  // Update content
  document.querySelectorAll('.tab-content').forEach((content) => {
    content.classList.toggle('active', content.id === `tab-${tabId}`);
  });

  state.currentTab = tabId;

  // Load tab data only when switching tabs (without loading overlay for better UX)
  switch (tabId) {
    case 'companions':
      loadCompanionsTab();
      break;
    case 'chat':
      // Only load sessions list, don't auto-load messages
      loadSessions();
      // Stop polling if no session selected
      if (!state.currentSessionId) {
        stopPolling();
      }
      break;
    case 'journal':
      loadJournals();
      break;
    case 'mood':
      loadMoods();
      break;
    case 'help':
      // Help tab doesn't need initialization
      break;
  }
}

// ============================================
// Chat Feature
// ============================================
async function loadSessions() {
  try {
    const data = await api('/chat/sessions');
    state.sessions = data.sessions;
    renderSessions();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderSessions() {
  const container = document.getElementById('sessionList');

  if (state.sessions.length === 0) {
    container.innerHTML = '<p class="empty-state">Belum ada ruang chat</p>';
    return;
  }

  // Group sessions by companion
  const withCompanion = state.sessions.filter(s => s.companionName);
  const withoutCompanion = state.sessions.filter(s => !s.companionName);

  let html = '';

  // Sessions with companion
  if (withCompanion.length > 0) {
    html += '<div class="session-group">';
    html += '<div class="session-group-label">Chat dengan Teman Ngobrol</div>';
    html += withCompanion.map(session => `
      <div class="session-item ${session.sessionId === state.currentSessionId ? 'active' : ''}" 
           data-session-id="${session.sessionId}">
        <div class="session-avatar-companion">
          <svg class="session-avatar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </div>
        <div class="session-content">
          <div class="session-topic">${escapeHtml(session.topic)}</div>
          <div class="session-meta">
            <span class="companion-badge">${escapeHtml(session.companionName)}</span>
            ${formatDate(session.createdAt)}
          </div>
        </div>
      </div>
    `).join('');
    html += '</div>';
  }

  // Sessions without companion
  if (withoutCompanion.length > 0) {
    if (withCompanion.length > 0) {
      html += '<div class="session-divider"></div>';
    }
    html += '<div class="session-group">';
    html += '<div class="session-group-label">Ruang Chat Group</div>';
    html += withoutCompanion.map(session => `
      <div class="session-item ${session.sessionId === state.currentSessionId ? 'active' : ''}" 
           data-session-id="${session.sessionId}">
        <div class="session-avatar-group">
          <svg class="session-avatar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        </div>
        <div class="session-content">
          <div class="session-topic">${escapeHtml(session.topic)}</div>
          <div class="session-meta">
            ${formatDate(session.createdAt)}
          </div>
        </div>
      </div>
    `).join('');
    html += '</div>';
  }

  container.innerHTML = html;

  // Add click handlers
  container.querySelectorAll('.session-item').forEach((item) => {
    item.addEventListener('click', () => {
      selectSession(item.dataset.sessionId);
    });
  });
}

// ============================================
// Companions Feature
// ============================================
async function loadCompanions() {
  try {
    const data = await api('/companions');
    state.companions = data.companions || [];
    renderCompanions();
  } catch (err) {
    console.error('Failed to load companions:', err);
    state.companions = [];
    renderCompanions();
  }
}

async function loadCompanionsTab() {
  try {
    const data = await api('/companions');
    state.companions = data.companions || [];
    renderCompanionsTab();
  } catch (err) {
    console.error('Failed to load companions:', err);
    const container = document.getElementById('companionsGrid');
    container.innerHTML = '<p class="empty-state">Gagal memuat teman ngobrol</p>';
  }
}

function renderCompanionsTab() {
  const container = document.getElementById('companionsGrid');
  
  if (state.companions.length === 0) {
    container.innerHTML = '<p class="empty-state">Belum ada teman ngobrol tersedia</p>';
    return;
  }

  container.innerHTML = state.companions.map(c => `
    <div class="companion-card">
      <div class="companion-card-avatar">${c.name.charAt(0)}</div>
      <div class="companion-card-info">
        <div class="companion-card-name">${escapeHtml(c.name)}</div>
        <div class="companion-card-specialty">${escapeHtml(c.specialty || 'Teman Berbagi')}</div>
        <p class="companion-card-description">${escapeHtml(c.description || 'Siap mendengarkan ceritamu')}</p>
      </div>
      <button class="companion-card-btn" data-companion-id="${c.companion_id}" data-companion-name="${escapeHtml(c.name)}">
        Chat Sekarang
      </button>
    </div>
  `).join('');

  // Add click handlers to buttons
  container.querySelectorAll('.companion-card-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openCompanionChatModal(btn.dataset.companionId, btn.dataset.companionName);
    });
  });
}

function openCompanionChatModal(companionId, companionName) {
  // Check if there's already an existing chat with this companion
  const existingSession = state.sessions.find(
    session => session.companionId === companionId
  );

  if (existingSession) {
    // If chat exists, switch to chat tab and open that session
    switchTab('chat');
    selectSession(existingSession.sessionId);
    showToast('Membuka chat dengan ' + companionName, 'success');
  } else {
    // If no existing chat, open modal to create new chat
    state.selectedCompanionId = companionId;
    document.getElementById('selectedCompanionName').textContent = companionName;
    document.getElementById('companionChatModal').hidden = false;
    document.getElementById('companionChatTopic').focus();
  }
}

function renderCompanions() {
  const container = document.getElementById('companionList');
  
  if (state.companions.length === 0) {
    container.innerHTML = '<p class="text-muted">Tidak ada teman ngobrol tersedia</p>';
    return;
  }

  container.innerHTML = `
    <label class="companion-option ${!state.selectedCompanionId ? 'selected' : ''}" data-companion-id="">
      <input type="radio" name="companion" value="" ${!state.selectedCompanionId ? 'checked' : ''}>
      <div class="companion-avatar">?</div>
      <div class="companion-info">
        <div class="companion-name">Tanpa Teman Ngobrol</div>
        <div class="companion-specialty">Chat dengan user lain saja</div>
      </div>
    </label>
    ${state.companions.map(c => `
      <label class="companion-option ${state.selectedCompanionId === c.companion_id ? 'selected' : ''}" data-companion-id="${c.companion_id}">
        <input type="radio" name="companion" value="${c.companion_id}" ${state.selectedCompanionId === c.companion_id ? 'checked' : ''}>
        <div class="companion-avatar">${c.name.charAt(0)}</div>
        <div class="companion-info">
          <div class="companion-name">${escapeHtml(c.name)}</div>
          <div class="companion-specialty">${escapeHtml(c.specialty || '')}</div>
        </div>
      </label>
    `).join('')}
  `;

  // Add click handlers
  container.querySelectorAll('.companion-option').forEach((option) => {
    option.addEventListener('click', () => {
      state.selectedCompanionId = option.dataset.companionId || null;
      // Update selected state
      container.querySelectorAll('.companion-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
    });
  });
}

async function selectSession(sessionId) {
  state.currentSessionId = sessionId;
  state.currentSession = state.sessions.find(s => s.sessionId === sessionId) || null;
  state.lastMessageTime = null;

  // Update UI
  document.querySelectorAll('.session-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.sessionId === sessionId);
  });

  // Show chat header and input
  document.getElementById('chatHeader').hidden = false;
  document.getElementById('chatInputArea').hidden = false;

  // Find session and update header
  const session = state.sessions.find((s) => s.sessionId === sessionId);
  if (session) {
    const topicEl = document.getElementById('chatTopic');
    if (session.companionName) {
      topicEl.innerHTML = `${escapeHtml(session.topic)} <span class="companion-badge">${escapeHtml(session.companionName)}</span>`;
    } else {
      topicEl.textContent = session.topic;
    }
    
    // Show delete button if user is the creator
    const deleteBtn = document.getElementById('deleteChatBtn');
    if (deleteBtn) {
      deleteBtn.style.display = session.createdBy === state.user?.userId ? 'block' : 'none';
    }
  }

  // Load messages
  await loadMessages();

  // Start polling
  startPolling();
}

async function loadMessages() {
  if (!state.currentSessionId) return;

  try {
    let endpoint = `/chat/messages?sessionId=${state.currentSessionId}`;
    if (state.lastMessageTime) {
      endpoint += `&after=${state.lastMessageTime}`;
    }

    const data = await api(endpoint);

    if (state.lastMessageTime) {
      // Append new messages, but deduplicate by messageId
      const existingIds = new Set(state.messages.map(m => m.messageId));
      const newMessages = data.messages.filter(m => !existingIds.has(m.messageId));
      state.messages = [...state.messages, ...newMessages];
    } else {
      // Replace all messages
      state.messages = data.messages;
    }

    // Update last message time
    if (data.messages.length > 0) {
      state.lastMessageTime =
        data.messages[data.messages.length - 1].createdAt;
    } else if (!state.lastMessageTime) {
      state.lastMessageTime = data.serverTime;
    }

    renderMessages();
  } catch (err) {
    console.error('Failed to load messages:', err);
  }
}

function renderMessages() {
  const container = document.getElementById('messagesContainer');

  if (state.messages.length === 0) {
    container.innerHTML =
      '<p class="empty-state">Belum ada pesan. Mulai bercerita!</p>';
    return;
  }

  container.innerHTML = state.messages
    .map(
      (msg) => {
        const time = new Date(msg.createdAt);
        const timeStr = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        // Status centang untuk pesan sendiri
        let statusIcon = '';
        if (msg.isOwn) {
          // Centang dua (semua pesan dianggap terkirim dan terbaca dalam grup chat)
          statusIcon = '<span class="message-status read">✓✓</span>';
        }
        
        return `
    <div class="message ${msg.isOwn ? 'message-self' : 'message-other'}">
      ${!msg.isOwn ? `<div class="message-sender">${escapeHtml(msg.displayName)}</div>` : ''}
      <div class="message-text">${escapeHtml(msg.text)}</div>
      <div class="message-time">${timeStr} ${statusIcon}</div>
    </div>
  `;
      }
    )
    .join('');

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

function startPolling() {
  // Only start polling if there's an active session
  if (!state.currentSessionId) {
    return;
  }

  // Clear existing interval
  if (state.pollingInterval) {
    clearInterval(state.pollingInterval);
  }

  // Poll every 5 seconds for new messages
  state.pollingInterval = setInterval(() => {
    if (state.currentTab === 'chat' && state.currentSessionId) {
      loadMessages();
    }
  }, 5000);
}

function stopPolling() {
  if (state.pollingInterval) {
    clearInterval(state.pollingInterval);
    state.pollingInterval = null;
  }
}

async function sendMessage(text) {
  if (!state.currentSessionId || !text.trim()) return false;

  // Prevent duplicate sends
  if (state.isSendingMessage) {
    return false;
  }

  try {
    state.isSendingMessage = true;

    const data = await api('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: state.currentSessionId,
        text: text.trim(),
      }),
    });

    // Wait a bit before fetching to ensure backend processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Fetch messages to get the new one
    await loadMessages();

    // Check for risk warning
    if (data.warning) {
      console.log('Risk warning detected:', data.warning);
    }

    state.isSendingMessage = false;
    return true;
  } catch (err) {
    state.isSendingMessage = false;
    showToast(err.message, 'error');
    return false;
  }
}

function showRiskWarning(warning) {
  const modal = document.getElementById('riskWarningModal');
  document.getElementById('riskWarningMessage').textContent = warning.message;

  const resourcesHtml = warning.resources
    .map(
      (r) => `<p><strong>${r.name}:</strong> ${r.contact}</p>`
    )
    .join('');
  document.getElementById('riskResources').innerHTML = resourcesHtml;

  modal.hidden = false;
}

async function createSession(topic, companionId = null) {
  try {
    showLoading();
    const data = await api('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ topic, companionId }),
    });

    state.sessions.unshift(data.session);
    renderSessions();
    selectSession(data.session.sessionId);
    hideLoading();
    showToast('Ruang chat berhasil dibuat');
    
    // Reset companion selection
    state.selectedCompanionId = null;
    
    return true;
  } catch (err) {
    hideLoading();
    showToast(err.message, 'error');
    return false;
  }
}

async function deleteSession(sessionId) {
  if (!sessionId) return false;
  
  if (!confirm('Apakah kamu yakin ingin menghapus ruang chat ini?')) {
    return false;
  }

  try {
    showLoading();
    await api(`/chat/sessions?sessionId=${sessionId}`, {
      method: 'DELETE',
    });

    // Remove from state
    state.sessions = state.sessions.filter(s => s.sessionId !== sessionId);
    renderSessions();
    
    // Clear current session if it was deleted
    if (state.currentSessionId === sessionId) {
      state.currentSessionId = null;
      state.currentSession = null;
      state.messages = [];
      document.getElementById('chatHeader').hidden = true;
      document.getElementById('chatInputArea').hidden = true;
      document.getElementById('messagesContainer').innerHTML = '';
      stopPolling();
    }
    
    hideLoading();
    showToast('Ruang chat berhasil dihapus');
    return true;
  } catch (err) {
    hideLoading();
    showToast(err.message, 'error');
    return false;
  }
}

async function reportSession(reason) {
  if (!state.currentSessionId) return;

  try {
    showLoading();
    await api('/reports', {
      method: 'POST',
      body: JSON.stringify({
        targetSessionId: state.currentSessionId,
        reason,
      }),
    });

    hideLoading();
    showToast('Laporan berhasil dikirim. Terima kasih.');
    return true;
  } catch (err) {
    hideLoading();
    showToast(err.message, 'error');
    return false;
  }
}

// ============================================
// Journal Feature
// ============================================
async function loadJournals() {
  try {
    const data = await api('/journal');
    state.journals = data.entries;
    renderJournals();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderJournals() {
  const container = document.getElementById('journalList');

  if (state.journals.length === 0) {
    container.innerHTML =
      '<p class="empty-state">Belum ada entri jurnal. Mulai menulis sekarang!</p>';
    return;
  }

  container.innerHTML = state.journals
    .map(
      (entry) => `
    <div class="journal-card" data-entry-id="${entry.entryId}">
      <h3>${entry.title}</h3>
      <p>${entry.body}</p>
      <div class="tags">
        ${entry.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
      <div class="date">${formatDate(entry.createdAt)}</div>
    </div>
  `
    )
    .join('');

  // Add click handlers
  container.querySelectorAll('.journal-card').forEach((card) => {
    card.addEventListener('click', () => {
      viewJournal(card.dataset.entryId);
    });
  });
}

async function viewJournal(entryId) {
  try {
    const data = await api(`/journal?entryId=${entryId}`);
    const entry = data.entry;

    document.getElementById('viewJournalTitle').textContent = entry.title;
    document.getElementById('viewJournalDate').textContent = formatDate(
      entry.createdAt
    );
    document.getElementById('viewJournalTags').textContent = entry.tags.join(
      ', '
    );
    document.getElementById('viewJournalBody').textContent = entry.body;

    // Store current entry ID for edit/delete
    document.getElementById('viewJournalModal').dataset.entryId = entryId;
    document.getElementById('viewJournalModal').hidden = false;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function saveJournal(entryId, title, body, tags) {
  try {
    showLoading();
    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);

    if (entryId) {
      // Update existing
      await api('/journal', {
        method: 'PUT',
        body: JSON.stringify({ entryId, title, body, tags: tagsArray }),
      });
      hideLoading();
      showToast('Jurnal berhasil diperbarui');
    } else {
      // Create new
      await api('/journal', {
        method: 'POST',
        body: JSON.stringify({ title, body, tags: tagsArray }),
      });
      hideLoading();
      showToast('Jurnal berhasil disimpan');
    }

    loadJournals();
    return true;
  } catch (err) {
    hideLoading();
    showToast(err.message, 'error');
    return false;
  }
}

async function deleteJournal(entryId) {
  if (!confirm('Yakin ingin menghapus jurnal ini?')) return;

  try {
    showLoading();
    await api('/journal', {
      method: 'DELETE',
      body: JSON.stringify({ entryId }),
    });

    hideLoading();
    showToast('Jurnal berhasil dihapus');
    loadJournals();
    document.getElementById('viewJournalModal').hidden = true;
  } catch (err) {
    hideLoading();
    showToast(err.message, 'error');
  }
}

// ============================================
// Mood Feature
// ============================================
async function loadMoods() {
  try {
    const data = await api('/mood?limit=30');
    state.moods = data.moods;
    renderMoods();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderMoods() {
  const container = document.getElementById('moodHistory');

  if (state.moods.length === 0) {
    container.innerHTML = '<p class="empty-state">Belum ada data mood</p>';
    return;
  }

  container.innerHTML = state.moods
    .map(
      (mood) => `
    <div class="mood-log-item">
      <div class="mood-log-rating rating-${mood.score}">${mood.score}</div>
      <div class="mood-log-content">
        <div class="mood-log-note">${mood.emotion}</div>
        ${mood.note ? `<div class="mood-log-note">${escapeHtml(mood.note)}</div>` : ''}
        <div class="mood-log-date">${formatDate(mood.date)}</div>
      </div>
    </div>
  `
    )
    .join('');
}

async function saveMood(score, note) {
  try {
    showLoading();
    // Map score to emotion
    const emotionMap = {
      1: 'Sangat Buruk',
      2: 'Buruk',
      3: 'Netral',
      4: 'Baik',
      5: 'Sangat Baik'
    };
    const emotion = emotionMap[score] || 'Netral';
    
    await api('/mood', {
      method: 'POST',
      body: JSON.stringify({ score, emotion, note }),
    });

    hideLoading();
    showToast('Mood berhasil disimpan');
    loadMoods();

    // Reset form
    document.querySelectorAll('input[name="rating"]').forEach((radio) => {
      radio.checked = false;
    });
    document.querySelectorAll('.mood-option').forEach((option) => {
      option.classList.remove('selected');
    });
    document.getElementById('moodNote').value = '';

    return true;
  } catch (err) {
    hideLoading();
    showToast(err.message, 'error');
    return false;
  }
}

// ============================================
// Breathing Exercise
// ============================================
function initBreathingExercise() {
  let isRunning = false;
  let breathInterval;
  const circle = document.getElementById('breathCircle');
  const text = document.getElementById('breathText');
  const btn = document.getElementById('startBreathing');

  btn.onclick = () => {
    if (isRunning) {
      // Stop
      clearInterval(breathInterval);
      circle.classList.remove('inhale', 'exhale');
      text.textContent = 'Tarik napas';
      btn.textContent = 'Mulai Latihan';
      isRunning = false;
    } else {
      // Start
      isRunning = true;
      btn.textContent = 'Berhenti';

      let phase = 'inhale';
      const runPhase = () => {
        if (phase === 'inhale') {
          circle.classList.remove('exhale');
          circle.classList.add('inhale');
          text.textContent = 'Tarik napas...';
          phase = 'hold1';
          setTimeout(runPhase, 4000);
        } else if (phase === 'hold1') {
          text.textContent = 'Tahan...';
          phase = 'exhale';
          setTimeout(runPhase, 4000);
        } else if (phase === 'exhale') {
          circle.classList.remove('inhale');
          circle.classList.add('exhale');
          text.textContent = 'Hembuskan...';
          phase = 'hold2';
          setTimeout(runPhase, 4000);
        } else {
          text.textContent = 'Tahan...';
          phase = 'inhale';
          setTimeout(runPhase, 4000);
        }
      };
      runPhase();
    }
  };
}

// ============================================
// Utility Functions
// ============================================
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================
// Event Listeners Setup
// ============================================
function setupEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const confirmed = confirm('Apakah Anda yakin ingin keluar?');
      if (confirmed) {
        await logout();
      }
    });
  }

  // Chat - New session (will load companions when modal opens)
  document.getElementById('newChatBtn').addEventListener('click', async () => {
    document.getElementById('newChatModal').hidden = false;
    await loadCompanions();
  });

  document.getElementById('cancelNewChat').addEventListener('click', () => {
    document.getElementById('newChatModal').hidden = true;
  });

  document.getElementById('newChatForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const topic = document.getElementById('chatTopicInput').value;
    const selectedCompanion = document.querySelector('input[name="companion"]:checked');
    const companionId = selectedCompanion ? selectedCompanion.value : null;
    
    if (await createSession(topic, companionId)) {
      document.getElementById('newChatModal').hidden = true;
      document.getElementById('chatTopicInput').value = '';
      // Reset companion selection
      if (selectedCompanion) selectedCompanion.checked = false;
    }
  });

  // Companion Chat Modal
  document.getElementById('cancelCompanionChat').addEventListener('click', () => {
    document.getElementById('companionChatModal').hidden = true;
  });

  document.getElementById('companionChatForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const topic = document.getElementById('companionChatTopic').value;
    const companionId = state.selectedCompanionId;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Loading state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Membuat...';
    submitBtn.disabled = true;
    
    if (await createSession(topic, companionId)) {
      document.getElementById('companionChatModal').hidden = true;
      document.getElementById('companionChatTopic').value = '';
      // Switch to chat tab and show the new session
      switchTab('chat');
    }
    
    // Reset button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  });

  // Chat - Send message
  document.getElementById('messageForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendMessageBtn');
    const text = input.value;
    
    // Update button text
    const originalText = sendBtn.textContent;
    sendBtn.textContent = 'Mengirim...';
    sendBtn.disabled = true;
    
    if (await sendMessage(text)) {
      input.value = '';
    }
    
    // Reset button
    sendBtn.textContent = originalText;
    sendBtn.disabled = false;
  });

  // Chat - Report
  document.getElementById('reportChatBtn').addEventListener('click', () => {
    document.getElementById('reportModal').hidden = false;
  });

  document.getElementById('cancelReport').addEventListener('click', () => {
    document.getElementById('reportModal').hidden = true;
  });

  // Chat - Delete session
  const deleteChatBtn = document.getElementById('deleteChatBtn');
  if (deleteChatBtn) {
    deleteChatBtn.addEventListener('click', async () => {
      if (state.currentSessionId) {
        await deleteSession(state.currentSessionId);
      }
    });
  }

  // Chat - Toggle Sidebar for Mobile
  const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
  const chatSidebar = document.getElementById('chatSidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (toggleSidebarBtn && chatSidebar && sidebarOverlay) {
    toggleSidebarBtn.addEventListener('click', () => {
      chatSidebar.classList.toggle('mobile-open');
      sidebarOverlay.classList.toggle('active');
    });

    sidebarOverlay.addEventListener('click', () => {
      chatSidebar.classList.remove('mobile-open');
      sidebarOverlay.classList.remove('active');
    });

    // Close sidebar when session is selected on mobile
    document.addEventListener('click', (e) => {
      if (e.target.closest('.session-item')) {
        if (window.innerWidth <= 768) {
          chatSidebar.classList.remove('mobile-open');
          sidebarOverlay.classList.remove('active');
        }
      }
    });
  }

  document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const reason = document.getElementById('reportReason').value;
    if (await reportSession(reason)) {
      document.getElementById('reportModal').hidden = true;
      document.getElementById('reportReason').value = '';
    }
  });

  // Risk warning close (DISABLED - modal removed)
  // document.getElementById('closeRiskWarning').addEventListener('click', (e) => {
  //   e.stopPropagation();
  //   document.getElementById('riskWarningModal').hidden = true;
  // });

  // Risk warning modal backdrop click (DISABLED - modal removed)
  // document.getElementById('riskWarningModal').addEventListener('click', (e) => {
  //   if (e.target.id === 'riskWarningModal') {
  //     document.getElementById('riskWarningModal').hidden = true;
  //   }
  // });

  // Journal - New
  document.getElementById('newJournalBtn').addEventListener('click', () => {
    document.getElementById('journalModalTitle').textContent = 'Tulis Jurnal Baru';
    document.getElementById('journalEntryId').value = '';
    document.getElementById('journalTitle').value = '';
    document.getElementById('journalBody').value = '';
    document.getElementById('journalTags').value = '';
    document.getElementById('journalModal').hidden = false;
  });

  document.getElementById('cancelJournal').addEventListener('click', () => {
    document.getElementById('journalModal').hidden = true;
  });

  document.getElementById('journalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const entryId = document.getElementById('journalEntryId').value;
    const title = document.getElementById('journalTitle').value;
    const body = document.getElementById('journalBody').value;
    const tags = document.getElementById('journalTags').value;

    if (await saveJournal(entryId || null, title, body, tags)) {
      document.getElementById('journalModal').hidden = true;
    }
  });

  // Journal - View modal actions
  document.getElementById('closeViewJournal').addEventListener('click', () => {
    document.getElementById('viewJournalModal').hidden = true;
  });

  document.getElementById('editJournalBtn').addEventListener('click', async () => {
    const entryId = document.getElementById('viewJournalModal').dataset.entryId;
    const data = await api(`/journal?entryId=${entryId}`);
    const entry = data.entry;

    document.getElementById('journalModalTitle').textContent = 'Edit Jurnal';
    document.getElementById('journalEntryId').value = entryId;
    document.getElementById('journalTitle').value = entry.title;
    document.getElementById('journalBody').value = entry.body;
    document.getElementById('journalTags').value = entry.tags.join(', ');

    document.getElementById('viewJournalModal').hidden = true;
    document.getElementById('journalModal').hidden = false;
  });

  document.getElementById('deleteJournalBtn').addEventListener('click', () => {
    const entryId = document.getElementById('viewJournalModal').dataset.entryId;
    deleteJournal(entryId);
  });

  // Mood - Submit
  document.getElementById('moodForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedRating = document.querySelector('input[name="rating"]:checked');
    if (!selectedRating) {
      showToast('Pilih salah satu rating mood', 'error');
      return;
    }

    const score = parseInt(selectedRating.value);
    const note = document.getElementById('moodNote').value;

    await saveMood(score, note);
  });

  // Mood - Add visual effect when selecting rating
  document.querySelectorAll('input[name="rating"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      // Remove selected class from all options
      document.querySelectorAll('.mood-option').forEach((option) => {
        option.classList.remove('selected');
      });
      
      // Add selected class to the chosen option
      if (e.target.checked) {
        e.target.closest('.mood-option').classList.add('selected');
      }
    });
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.hidden = true;
      }
    });
  });

  // Handle visibility change (pause polling when tab not visible)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopPolling();
    } else if (state.currentTab === 'chat' && state.currentSessionId) {
      startPolling();
    }
  });
}

// ============================================
// Initialize App
// ============================================
async function init() {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) return;

  initNavigation();
  setupEventListeners();

  // Load sessions list only (no auto-load messages)
  // User must click a session to start chatting
  loadSessions();
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
