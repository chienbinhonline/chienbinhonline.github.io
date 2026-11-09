document.addEventListener('DOMContentLoaded', () => {
  initSound();
  updateAppSize('screen-home');
  checkLoginStatus();
  initNumpad();
  initEventListeners();
});

function initEventListeners() {
  const btnCheck = $('btnCheck'); if (btnCheck) btnCheck.addEventListener('click', checkAnswer);
  const btnSkip = $('btnSkip');
  if (btnSkip) {
    btnSkip.addEventListener('click', () => {
      if (!answerPhase) return;
      skipAnswer(); // ⭐ Gọi hàm xử lý bỏ qua mới
    });
  }  const answerInput = $('answer'); if (answerInput) answerInput.addEventListener('keypress', e => { if (e.key === 'Enter') checkAnswer(); });
  const packSelect = $('packSelect'); if (packSelect) packSelect.addEventListener('change', e => { config.pack = parseInt(e.target.value); });
  const termInput = $('termInput'); if (termInput) termInput.addEventListener('change', e => { let v = parseInt(e.target.value) || 3; if (v < 3) v = 3; if (v > 30) v = 30; config.terms = v; e.target.value = v; });
  const phoneInput = $('studentPhoneInput'); if (phoneInput) phoneInput.addEventListener('keypress', e => { if (e.key === 'Enter') doLogin(); });
  const btnLeaderboard = $('leaderboardToggle'); if (btnLeaderboard) btnLeaderboard.addEventListener('click', showLeaderboard);
  const btnEvent = $('eventToggle'); if (btnEvent) btnEvent.addEventListener('click', () => showEvent());
}

function initNumpad() {
  const numpad = $('numpad');
  if (!numpad) return;
  
  numpad.addEventListener('click', e => {
    const btn = e.target.closest('.numpad-btn');
    if (!btn) return;
    if (!answerPhase) return;
    const input = $('answer');
    if (!input || input.disabled) return;
    
    const num = btn.dataset.num;
    const action = btn.dataset.action;
    
    if (num !== undefined) {
      if (input.value.length < 10) input.value += num;
    } else if (action === 'clear') {
      input.value = '';
    } else if (action === 'back') {
      input.value = input.value.slice(0, -1);
    }
  });

  // ⭐ XỬ LÝ BÀN PHÍM VẬT LÝ CHO MÁY TÍNH
  document.addEventListener('keydown', (e) => {
    // Chỉ hoạt động khi đang trong màn chơi và đến lượt nhập đáp án
    if (!answerPhase || !$('screen-game').classList.contains('active')) return;
    
    const input = $('answer');
    if (!input || input.disabled) return;

    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault(); // ⭐ CHẶN TRÌNH DUYỆT TỰ GÕ
      if (input.value.length < 10) input.value += e.key;
    } else if (e.key === 'Backspace') {
      e.preventDefault(); // ⭐ CHẶN TRÌNH DUYỆT TỰ XÓA
      input.value = input.value.slice(0, -1);
    } else if (e.key === 'Enter') {
      e.preventDefault(); // ⭐ CHẶN HÀNH VI MẶC ĐỊNH
      checkAnswer();
    } else if (e.key === 'Delete' || e.key === 'Escape') {
      e.preventDefault();
      input.value = '';
    }
  });
}

function checkLoginStatus() {
  const overlay = $('nameOverlay');
  const phone = getStudentPhone();
  const role = getStudentRole();
  
  if (phone && phone.length >= 3) {
    overlay.classList.add('hidden');
    overlay.style.display = 'none';
    updateStudentInfoUI();
    
    // ⭐ Hiển thị nút Báo cáo nếu là giáo viên
    const reportBtn = $('reportMenuCard');
    if (reportBtn) {
      reportBtn.style.display = (role === 'teacher') ? 'flex' : 'none';
    }
    
    if (role === 'student') {
      syncHistoryFromServer(); // Chỉ đồng bộ lịch sử nếu là học viên
    }
  } else {
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
    setTimeout(() => $('studentPhoneInput')?.focus(), 100);
  }
}

function doLogin() {
  const phoneInput = $('studentPhoneInput');
  const errorEl = $('loginError');
  const btn = $('btnLogin');
  const phone = phoneInput ? phoneInput.value.trim().replace(/[\s\-\.]/g, '') : '';
  
  if (!phone || phone.length < 3) {
    errorEl.textContent = '⚠️ Vui lòng nhập mã đăng nhập';
    errorEl.style.display = 'block'; if (phoneInput) phoneInput.focus(); return;
  }
  
  errorEl.style.display = 'none';
  btn.textContent = 'ĐANG ĐĂNG NHẬP...'; btn.disabled = true;
  
  loginWithPhone(phone).then(data => {
    const overlay = $('nameOverlay');
    overlay.classList.add('hidden'); overlay.style.display = 'none';
    updateStudentInfoUI();
    
    // ⭐ Cập nhật nút báo cáo
    const reportBtn = $('reportMenuCard');
    if (reportBtn) reportBtn.style.display = (getStudentRole() === 'teacher') ? 'flex' : 'none';

    if (getStudentRole() === 'student') return syncHistoryFromServer();
  }).then(() => { console.log('🎉 Đăng nhập thành công'); })
  .catch(err => { errorEl.textContent = '❌ ' + (err.message || 'Lỗi đăng nhập'); errorEl.style.display = 'block'; })
  .finally(() => { btn.textContent = 'ĐĂNG NHẬP'; btn.disabled = false; });
}

function updateStudentInfoUI() {
  const name = getStudentName(), cls = getStudentClass(), role = getStudentRole();
  const subtitle = document.querySelector('.subtitle');
  if (subtitle) {
    if (name && name !== 'Không tên') {
      const roleStr = role === 'teacher' ? 'GV' : 'Lớp';
      subtitle.textContent = `👤 ${name}${cls ? ' - ' + roleStr + ' ' + cls : ''}`;
    } else {
      subtitle.textContent = 'FingerMath & Soroban';
    }
  }
}

function confirmLogout() {
  const name = getStudentName();
  if (!confirm(`Bạn có chắc muốn thoát?\n\nTên: ${name}\n\nDữ liệu trên máy sẽ bị XÓA.`)) return;
  ['superbrain_phone', 'superbrain_student_name', 'superbrain_student_class', 'superbrain_history', 'superbrain_sound_enabled', 'superbrain_role'].forEach(k => localStorage.removeItem(k));
  location.reload();
}
