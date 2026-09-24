/* ============================================================
   APP — Entry point + Login SĐT + Sync lịch sử + Numpad
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 SUPERBRAIN v2 khởi động...');
  
  initSound();
  updateAppSize('screen-home');
  checkLoginStatus();
  initNumpad();
  initEventListeners();
  
  console.log('✅ Ready!');
});

/* ============ GẮN SỰ KIỆN ============ */
function initEventListeners() {
  const btnCheck = $('btnCheck');
  if (btnCheck) btnCheck.addEventListener('click', checkAnswer);
  
  const btnSkip = $('btnSkip');
  if (btnSkip) {
    btnSkip.addEventListener('click', () => {
      if (!answerPhase) return;
      userAnswer = '';
      recordWrong(`⏭️ Bỏ qua. Đáp án: ${currentAnswer}`);
    });
  }
  
  const answerInput = $('answer');
  if (answerInput) {
    answerInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') checkAnswer();
    });
  }
  
  const packSelect = $('packSelect');
  if (packSelect) {
    packSelect.addEventListener('change', e => {
      config.pack = parseInt(e.target.value);
    });
  }
  
  const termInput = $('termInput');
  if (termInput) {
    termInput.addEventListener('change', e => {
      let v = parseInt(e.target.value);
      if (isNaN(v) || v < 3) v = 3;
      if (v > 30) v = 30;
      config.terms = v;
      e.target.value = v;
    });
  }
  
  const phoneInput = $('studentPhoneInput');
  if (phoneInput) {
    phoneInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') doLogin();
    });
  }
  
  const btnLeaderboard = $('leaderboardToggle');
  if (btnLeaderboard) btnLeaderboard.addEventListener('click', showLeaderboard);
}

/* ============ BÀN PHÍM ẢO (NUMPAD) ============ */
function initNumpad() {
  const numpad = $('numpad');
  if (!numpad) return;
  
  // Click button → nhập số
  numpad.addEventListener('click', e => {
    const btn = e.target.closest('.numpad-btn');
    if (!btn) return;
    
    if (!answerPhase) return;
    const input = $('answer');
    if (!input || input.disabled) return;
    
    const num = btn.dataset.num;
    const action = btn.dataset.action;
    
    if (num !== undefined) {
      // Giới hạn 10 ký tự
      if (input.value.length < 10) {
        input.value += num;
      }
    } else if (action === 'clear') {
      input.value = '';
    } else if (action === 'back') {
      input.value = input.value.slice(0, -1);
    }
  });
  
  // Chặn bàn phím ảo mobile khi focus input
  const input = $('answer');
  if (input) {
    const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    
    input.addEventListener('focus', e => {
      if (isTouchDevice) {
        // Trên mobile: blur ngay để không hiện bàn phím ảo
        setTimeout(() => input.blur(), 10);
      }
    });
  }
}

/* ============ KIỂM TRA ĐĂNG NHẬP ============ */
function checkLoginStatus() {
  const overlay = $('nameOverlay');
  const phone = getStudentPhone();
  
  if (phone && phone.length >= 9) {
    overlay.classList.add('hidden');
    overlay.style.display = 'none';
    updateStudentInfoUI();
    
    console.log('🔄 Đồng bộ lịch sử khi vào app...');
    syncHistoryFromServer();
  } else {
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
    setTimeout(() => $('studentPhoneInput')?.focus(), 100);
  }
}

/* ============ ĐĂNG NHẬP ============ */
function doLogin() {
  const phoneInput = $('studentPhoneInput');
  const errorEl = $('loginError');
  const btn = $('btnLogin');
  
  const phone = phoneInput ? phoneInput.value.trim().replace(/[\s\-\.]/g, '') : '';
  
  if (!phone || phone.length < 9) {
    errorEl.textContent = '⚠️ Vui lòng nhập SĐT hợp lệ (tối thiểu 9 số)';
    errorEl.style.display = 'block';
    return;
  }
  
  errorEl.style.display = 'none';
  btn.textContent = 'ĐANG ĐĂNG NHẬP...';
  btn.disabled = true;
  
  loginWithPhone(phone)
    .then(data => {
      console.log('✅ Đăng nhập:', data);
      
      const overlay = $('nameOverlay');
      overlay.classList.add('hidden');
      overlay.style.display = 'none';
      
      updateStudentInfoUI();
      
      console.log('🔄 Đồng bộ lịch sử sau login...');
      return syncHistoryFromServer();
    })
    .then(() => {
      console.log('🎉 Đồng bộ xong, sẵn sàng sử dụng');
    })
    .catch(err => {
      console.error('❌ Lỗi:', err);
      errorEl.textContent = '❌ ' + (err.message || 'SĐT chưa được đăng ký');
      errorEl.style.display = 'block';
    })
    .finally(() => {
      btn.textContent = 'ĐĂNG NHẬP';
      btn.disabled = false;
    });
}

/* ============ CẬP NHẬT UI ============ */
function updateStudentInfoUI() {
  const name = getStudentName();
  const cls = getStudentClass();
  
  const subtitle = document.querySelector('.subtitle');
  if (subtitle) {
    if (name && name !== 'Không tên') {
      subtitle.textContent = `👤 ${name}${cls ? ' - Lớp ' + cls : ''}`;
    } else {
      subtitle.textContent = 'FingerMath & Soroban';
    }
  }
}

/* ============ NÚT THOÁT ============ */
function confirmLogout() {
  const name = getStudentName();
  if (!confirm(`Bạn có chắc muốn thoát?\n\nTên: ${name}\n\nDữ liệu trên máy sẽ bị XÓA.\nĐiểm trên Sheet vẫn GIỮ LẠI.`)) return;
  
  try {
    localStorage.removeItem('superbrain_phone');
    localStorage.removeItem('superbrain_student_name');
    localStorage.removeItem('superbrain_student_class');
    localStorage.removeItem('superbrain_history');
    localStorage.removeItem('superbrain_sound_enabled');
  } catch (e) {}
  
  location.reload();
}