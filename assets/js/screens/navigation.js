/* ============================================================
   NAVIGATION — Chuyển màn hình + đổi kích thước app
   V2.3: Fix goBack() để xử lý đúng khi history lệch
   ============================================================ */

/* ============ HISTORY STACK ============ */
let screenHistory = ['screen-home'];

function goTo(screenId) {
  const currentActive = document.querySelector('.screen.active');
  const currentId = currentActive ? currentActive.id : '';
  
  // Chỉ push vào history nếu KHÁC màn hình hiện tại
  if (currentId && currentId !== screenId) {
    if (screenHistory[screenHistory.length - 1] !== currentId) {
      screenHistory.push(currentId);
    }
  }
  
  // Đổi màn hình
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(screenId).classList.add('active');
  updateAppSize(screenId);
}

/* ⭐ HÀM goBack() ĐÃ SỬA */
function goBack() {
  // Dừng timer nếu đang chơi
  if (typeof stopAllTimers === 'function') stopAllTimers();
  
  // ⭐ Lấy màn hình đang active hiện tại
  const currentActive = document.querySelector('.screen.active');
  const currentId = currentActive ? currentActive.id : '';
  
  // ⭐ Nếu màn hình hiện tại CHƯA có trong history → thêm vào
  if (currentId && screenHistory[screenHistory.length - 1] !== currentId) {
    screenHistory.push(currentId);
  }
  
  // ⭐ Nếu history chỉ có 1 phần tử → về home
  if (screenHistory.length <= 1) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $('screen-home').classList.add('active');
    updateAppSize('screen-home');
    screenHistory = ['screen-home'];
    return;
  }
  
  // ⭐ Bỏ màn hình hiện tại
  screenHistory.pop();
  
  // Lấy màn hình trước đó
  const prevScreen = screenHistory[screenHistory.length - 1] || 'screen-home';
  
  // Đổi màn hình
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(prevScreen).classList.add('active');
  updateAppSize(prevScreen);
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
  goBack();
}

function backFromConfig() {
  goBack();
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
