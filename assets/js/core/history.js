const HISTORY_KEY = 'superbrain_history';

// ⭐ Đổi lại link API_URL của bạn nếu cần
const API_URL = 'https://script.google.com/macros/s/AKfycbwGBGW_A_PoBBOCkzQce3PijvMmkrC5QHaE-Uo_54XuF4msstx0t9epGHWwQoGXQu_B/exec'; 

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch (e) { return []; }
}

function saveHistory(arr) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(arr)); } catch (e) {}
}

function addHistoryRecord(data) {
  data.phone = getStudentPhone();
  const list = getHistory();
  list.push(data);
  saveHistory(list);
  
  if (typeof isTestMode !== 'undefined' && isTestMode) {
    console.log('🧪 Test mode — Chỉ lưu local, KHÔNG gửi Sheet');
    return;
  }
  sendToGoogleSheets(data);
}

function sendToGoogleSheets(data) {
  if (!API_URL) return;
  
  const payload = {
    action: 'addScore',
    name: getStudentName(),
    subject: data.subject === 'fingermath' ? 'FingerMath' : 'Soroban',
    mode: getModeName(data.mode),
    rows: data.rows || 0,
    displayTime: data.displayTime || 0,
    percent: data.percent || 0,
    date: data.date,
    className: getStudentClass(),
    phone: getStudentPhone()
  };
  
  fetch(API_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(err => console.warn('⚠️ Lỗi gửi:', err));
}

function loginWithPhone(phone) {
  if (!API_URL) return Promise.reject('Chưa cấu hình API_URL');
  
  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'login', phone: phone })
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === 'success') {
      localStorage.removeItem('superbrain_student_name');
      localStorage.removeItem('superbrain_student_class');
      localStorage.removeItem('superbrain_history');
      
      localStorage.setItem('superbrain_phone', data.phone);
      localStorage.setItem('superbrain_student_name', data.name);
      localStorage.setItem('superbrain_student_class', data.className || '');
      localStorage.setItem('superbrain_role', data.role || 'student'); // ⭐ LƯU ROLE
      
      return data;
    } else {
      throw new Error(data.message || 'Đăng nhập thất bại');
    }
  });
}

function fetchHistoryFromServer(phone) {
  if (!API_URL) return Promise.resolve([]);
  return fetch(API_URL + '?action=getHistory&phone=' + encodeURIComponent(phone))
    .then(res => res.json())
    .then(data => data.status === 'success' ? (data.history || []) : [])
    .catch(err => { console.warn('⚠️ Lỗi tải lịch sử:', err); return []; });
}

function syncHistoryFromServer() {
  const phone = getStudentPhone();
  if (!phone) return Promise.resolve();
  
  return fetchHistoryFromServer(phone).then(serverHistory => {
    if (serverHistory.length === 0) return;
    const local = getHistory();
    const merged = [...local];
    
    serverHistory.forEach(item => {
      const exists = merged.some(x =>
        x.date === item.date && x.mode === item.mode &&
        x.percent === item.percent && (x.displayTime || 0) === (item.displayTime || 0)
      );
      if (!exists) merged.push(item);
    });
    saveHistory(merged);
  });
}

function fetchLeaderboardFromServer() {
  if (!API_URL) return Promise.resolve([]);
  return fetch(API_URL + '?action=getLeaderboard').then(res => res.json())
    .then(data => data.status === 'success' ? (data.leaderboard || []) : [])
    .catch(err => { console.warn('⚠️ Lỗi tải BXH:', err); return []; });
}

function getStudentName() { try { return localStorage.getItem('superbrain_student_name') || 'Không tên'; } catch (e) { return 'Không tên'; } }
function getStudentClass() { try { return localStorage.getItem('superbrain_student_class') || ''; } catch (e) { return ''; } }
function getStudentPhone() { try { return localStorage.getItem('superbrain_phone') || ''; } catch (e) { return ''; } }
function getStudentRole() { try { return localStorage.getItem('superbrain_role') || 'student'; } catch (e) { return 'student'; } } // ⭐ HÀM LẤY ROLE

const MODE_SYMBOLS = {
  'fm-basic': '◆', 'fm-lb-plus': '✚', 'fm-lb-minus': '▬', 'fm-bb-plus': '■', 'fm-bb-minus': '★', 'fm-review': '▲',
  'fm-flash-1': '●', 'fm-flash-2': '●', 'sb-add-basic': '◆', 'sb-add-lb-plus': '✚', 'sb-add-lb-minus': '▬',
  'sb-add-bb-plus': '■', 'sb-add-bb-minus': '★', 'sb-add-review': '▲', 'sb-flash': '●', 'sb-mul': '⬢', 'sb-div': '▼'
};
const MODE_NAMES = {
  'fm-basic': '[FG]Basic', 'fm-lb-plus': '[FG]LB+', 'fm-lb-minus': '[FG]LB-', 'fm-bb-plus': '[FG]BB+', 'fm-bb-minus': '[FG]BB-', 'fm-review': '[FG]Multi',
  'fm-flash-1': '[FG]Flash', 'fm-flash-2': '[FG]Flash', 'sb-add-basic': '[SP]Basic', 'sb-add-lb-plus': '[SP]LB+', 'sb-add-lb-minus': '[SP]LB-',
  'sb-add-bb-plus': '[SP]BB+', 'sb-add-bb-minus': '[SP]BB-', 'sb-add-review': '[SP]Multi', 'sb-flash': '[SP]Flash', 'sb-mul': '[SP]Mul', 'sb-div': '[SP]Div'
};
const SUBJECT_COLORS = { 'fingermath': '#2563eb', 'soroban': '#65a343' };
function getModeColor(mode) { return mode.startsWith('fm') ? SUBJECT_COLORS.fingermath : SUBJECT_COLORS.soroban; }
function getModeSymbol(mode) { return MODE_SYMBOLS[mode] || '●'; }
function getModeName(mode) { return MODE_NAMES[mode] || mode; }
