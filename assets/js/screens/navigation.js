/* ============================================================
   NAVIGATION — Chuyển màn hình + đổi kích thước app
   V2.4: Fix lỗi chạy ngầm khi thoát game giữa chừng
   ============================================================ */

let screenHistory = ['screen-home'];

function goTo(screenId) {
  // ⭐ CẦU DAO ĐIỆN: Cứ chuyển màn hình là ngắt toàn bộ timer ngầm
  if (typeof stopAllTimers === 'function') stopAllTimers();

  const currentActive = document.querySelector('.screen.active');
  const currentId = currentActive ? currentActive.id : '';
  
  if (currentId && currentId !== screenId) {
    if (screenHistory[screenHistory.length - 1] !== currentId) {
      screenHistory.push(currentId);
    }
  }
  
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(screenId).classList.add('active');
  updateAppSize(screenId);
}

function goBack() {
  if (typeof stopAllTimers === 'function') stopAllTimers();
  
  const currentActive = document.querySelector('.screen.active');
  const currentId = currentActive ? currentActive.id : '';
  
  if (currentId && screenHistory[screenHistory.length - 1] !== currentId) {
    screenHistory.push(currentId);
  }
  
  if (screenHistory.length <= 1) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $('screen-home').classList.add('active');
    updateAppSize('screen-home');
    screenHistory = ['screen-home'];
    return;
  }
  
  screenHistory.pop();
  const prevScreen = screenHistory[screenHistory.length - 1] || 'screen-home';
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(prevScreen).classList.add('active');
  updateAppSize(prevScreen);
}

function updateAppSize(screenId) {
  const appEl = document.querySelector('.app');
  if (!appEl) return;
  
  appEl.classList.remove('app-home', 'app-menu', 'app-config', 'app-game', 'app-result', 'app-chart', 'app-leaderboard', 'app-event', 'app-report');
  
  if (screenId === 'screen-home') {
    appEl.classList.add('app-home');
  } else if (screenId === 'screen-fingermath' || screenId === 'screen-soroban') {
    appEl.classList.add('app-menu');
  } else if (screenId === 'screen-config') {
    appEl.classList.add('app-config');
  } else if (screenId === 'screen-game') {
    appEl.classList.add('app-game');
  } else if (screenId === 'screen-result') {
    appEl.classList.add('app-result');
  } else if (screenId === 'screen-chart') {
    appEl.classList.add('app-chart');
  } else if (screenId === 'screen-leaderboard') {
    appEl.classList.add('app-leaderboard');
  } else if (screenId === 'screen-event') {
    appEl.classList.add('app-event');
  } else if (screenId === 'screen-report') {
    appEl.classList.add('app-report');
  }
}

function backToMenu() {
  stopAllTimers();
  const cur = document.querySelector('.screen.active');
  const curId = cur ? cur.id : '';

  if (curId === 'screen-result') {
    const target = (typeof currentMode === 'string' && currentMode.startsWith('fm')) ? 'screen-fingermath' : 'screen-soroban';
    screenHistory = ['screen-home', target];
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(target).classList.add('active');
    updateAppSize(target);
    return;
  }
  goBack();
}

function backFromConfig() { goBack(); }

function togglePastBox() {
  const box = $('pastDisplay');
  const btn = $('btnShowPast');
  box.classList.toggle('show');
  btn.classList.toggle('active');
  btn.textContent = box.classList.contains('show') ? 'ẨN' : 'HIỆN';
}

function showLoading() { $('mainDisplay').style.display = 'none'; $('loadingSpinner').classList.add('show'); }
function hideLoading() { $('mainDisplay').style.display = 'flex'; $('loadingSpinner').classList.remove('show'); }

// ⭐ HÀM DỌN DẸP TOÀN BỘ TIMER (Cả Interval lẫn Timeout ngầm)
function stopAllTimers() {
  if (typeof displayTimer !== 'undefined' && displayTimer) { clearInterval(displayTimer); displayTimer = null; }
  if (typeof answerTimer !== 'undefined' && answerTimer) { clearInterval(answerTimer); answerTimer = null; }
  
  // Dọn dẹp các setTimeout ngầm trong game
  if (typeof clearGameTimeouts === 'function') {
    clearGameTimeouts();
  }
  
  if (typeof answerPhase !== 'undefined') answerPhase = false;
  
  // Khóa nộp bài để không bị click nhầm khi đang chuyển cảnh
  if (typeof isAnswerLocked !== 'undefined') {
    isAnswerLocked = true; 
  }
}
