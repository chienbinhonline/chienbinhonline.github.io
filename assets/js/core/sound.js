/* ============================================================
   SOUND — Phát âm thanh đúng/sai + Tắt/bật âm thanh
   - Lưu trạng thái vào localStorage
   - Tự động load khi khởi động
   ============================================================ */

const soundOK = new Audio(SND_OK);
const soundFail = new Audio(SND_FAIL);
soundOK.preload = 'auto';
soundFail.preload = 'auto';
soundOK.volume = 1.0;
soundFail.volume = 1.0;

// ============ STATE ÂM THANH ============
const SOUND_STATE_KEY = 'superbrain_sound_enabled';
let soundEnabled = true;

// ============ KHỞI ĐỘNG — Đọc trạng thái đã lưu ============
function initSound() {
  try {
    const saved = localStorage.getItem(SOUND_STATE_KEY);
    // Mặc định: BẬT (nếu chưa có giá trị lưu)
    soundEnabled = (saved === null) ? true : (saved === 'true');
  } catch (e) {
    soundEnabled = true;
  }
  updateSoundButton();
}

// ============ PHÁT ÂM THANH ============
function playSound(type) {
  // Nếu đang tắt âm thanh → không phát
  if (!soundEnabled) return;
  
  try {
    const audio = (type === 'ok') ? soundOK : soundFail;
    audio.currentTime = 0;
    audio.play().catch(err => {
      console.warn('Không phát được âm thanh:', err);
    });
  } catch (e) {
    console.warn('Lỗi âm thanh:', e);
  }
}

// ============ TẮT/BẬT ÂM THANH ============
function toggleSound() {
  soundEnabled = !soundEnabled;
  
  // Lưu trạng thái vào localStorage
  try {
    localStorage.setItem(SOUND_STATE_KEY, soundEnabled ? 'true' : 'false');
  } catch (e) {
    console.warn('Không lưu được trạng thái âm thanh:', e);
  }
  
  // Cập nhật UI nút
  updateSoundButton();
  
  // Phát âm thanh test khi vừa BẬT lại
  if (soundEnabled) {
    try {
      const test = new Audio(SND_OK);
      test.volume = 0.4;
      test.play().catch(() => {});
    } catch (e) {}
  }
}

// ============ CẬP NHẬT NÚT ÂM THANH ============
function updateSoundButton() {
  const btn = document.getElementById('soundToggle');
  if (!btn) return;
  
  if (soundEnabled) {
    btn.textContent = '🔊';
    btn.classList.remove('muted');
    btn.title = 'Tắt âm thanh';
    btn.setAttribute('aria-label', 'Tắt âm thanh');
  } else {
    btn.textContent = '🔇';
    btn.classList.add('muted');
    btn.title = 'Bật âm thanh';
    btn.setAttribute('aria-label', 'Bật âm thanh');
  }
}