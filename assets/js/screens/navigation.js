/* ============================================================
   NAVIGATION — Chuyển màn hình + đổi kích thước app
   V2: thêm app-chart + app-leaderboard
   ============================================================ */

function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(screenId).classList.add('active');
  updateAppSize(screenId);
}

function updateAppSize(screenId) {
  const appEl = document.querySelector('.app');
  if (!appEl) return;
  
  appEl.classList.remove(
    'app-home', 'app-menu', 'app-config', 'app-game',
    'app-result', 'app-chart', 'app-leaderboard'
  );
  
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
  }
}

function backToMenu() {
  stopAllTimers();
  goTo(lastMenuScreen);
}

function backFromConfig() {
  goTo(lastConfigScreen);
}

function togglePastBox() {
  const box = $('pastDisplay');
  const btn = $('btnShowPast');
  box.classList.toggle('show');
  btn.classList.toggle('active');
  btn.textContent = box.classList.contains('show') ? 'ẨN' : 'HIỆN';
}

function showLoading() {
  $('mainDisplay').style.display = 'none';
  $('loadingSpinner').classList.add('show');
}

function hideLoading() {
  $('mainDisplay').style.display = 'flex';
  $('loadingSpinner').classList.remove('show');
}

function stopAllTimers() {
  if (displayTimer) { clearInterval(displayTimer); displayTimer = null; }
  if (answerTimer) { clearInterval(answerTimer); answerTimer = null; }
  answerPhase = false;
}