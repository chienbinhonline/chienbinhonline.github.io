/* ============================================================
   CONFIG SCREEN — Xử lý màn hình cấu hình
   V2.1: Nút LÀM THỬ chạy 1 câu test, không lưu Sheet
   ============================================================ */

function renderDigitButtons(mode) {
  const options = getDigitsOptions(mode);
  const container = $('digitBtns');
  container.innerHTML = '';
  options.forEach(d => {
    const btn = document.createElement('button');
    btn.className = 'digit-btn' + (d === config.digits ? ' active' : '');
    btn.dataset.digits = d;
    btn.textContent = d;
    btn.onclick = () => setDigits(d);
    container.appendChild(btn);
  });
}

function renderMathDigitButtons(mode) {
  const c1 = $('mathDigit1Btns');
  c1.innerHTML = '';
  [1,2,3,4,5].forEach(d => {
    const btn = document.createElement('button');
    btn.className = 'digit-btn' + (d === config.mathDigit1 ? ' active' : '');
    btn.dataset.digits = d;
    btn.textContent = d;
    btn.onclick = () => setMathDigit1(d);
    c1.appendChild(btn);
  });
  const c2 = $('mathDigit2Btns');
  c2.innerHTML = '';
  [1,2,3,4,5].forEach(d => {
    const btn = document.createElement('button');
    btn.className = 'digit-btn' + (d === config.mathDigit2 ? ' active' : '');
    btn.dataset.digits = d;
    btn.textContent = d;
    btn.onclick = () => setMathDigit2(d);
    c2.appendChild(btn);
  });
  $('mathSymbol').textContent = (mode === 'sb-mul') ? '×' : '÷';
  $('mathSectionTitle').textContent = (mode === 'sb-mul') ? 'Nhân' : 'Chia';
}

function setDigits(n) {
  config.digits = n;
  document.querySelectorAll('#digitBtns .digit-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.digits) === n);
  });
}

function setMathDigit1(n) {
  config.mathDigit1 = n;
  document.querySelectorAll('#mathDigit1Btns .digit-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.digits) === n);
  });
}

function setMathDigit2(n) {
  config.mathDigit2 = n;
  document.querySelectorAll('#mathDigit2Btns .digit-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.digits) === n);
  });
}

function setTimeDisplay(t) {
  config.timeDisplay = t;
  document.querySelectorAll('#timeDisplayBtns .time-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.time) === t);
  });
}

function setTimeAnswer(t) {
  config.timeAnswer = t;
  document.querySelectorAll('#timeAnswerBtns .time-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.time) === t);
  });
}

function openConfig(mode) {
  currentMode = mode;
  lastConfigScreen = mode.startsWith('fm') ? 'screen-fingermath' : 'screen-soroban';
  $('configTitle').textContent = modeTitles[mode] || 'Luyện tập';
  
  const isFMFlash = isFMFlashcardOnly(mode);
  const isSBFlash = (mode === 'sb-flash');
  const isMath = isMathMode(mode);
  
  if (isFMFlash) {
    $('digitSection').style.display = 'none';
    $('mathSection').style.display = 'none';
  } else if (isSBFlash) {
    $('digitSection').style.display = 'block';
    $('mathSection').style.display = 'none';
    
    const termLabel = $('digitSection').querySelectorAll('.config-label')[1];
    if (termLabel) termLabel.style.display = 'none';
    $('termInput').style.display = 'none';
    
    const options = getDigitsOptions(mode);
    if (!options.includes(config.digits)) config.digits = options[0];
    renderDigitButtons(mode);
  } else if (isMath) {
    $('digitSection').style.display = 'none';
    $('mathSection').style.display = 'block';
    renderMathDigitButtons(mode);
  } else {
    $('digitSection').style.display = 'block';
    $('mathSection').style.display = 'none';
    
    const termLabel = $('digitSection').querySelectorAll('.config-label')[1];
    if (termLabel) termLabel.style.display = 'inline';
    $('termInput').style.display = 'inline-block';
    
    const options = getDigitsOptions(mode);
    if (!options.includes(config.digits)) config.digits = options[0];
    renderDigitButtons(mode);
    $('termInput').value = config.terms;
  }
  
  $('packSelect').value = config.pack;
  setTimeDisplay(config.timeDisplay);
  setTimeAnswer(config.timeAnswer);
  
  goTo('screen-config');
}

/* ============================================================
   START PRACTICE — save = true (LƯU) / false (LÀM THỬ)
   V2.1: LÀM THỬ = 1 câu test, không lưu Sheet
   ============================================================ */
function startPractice(save) {
  const isFMFlash = isFMFlashcardOnly(currentMode);
  const isSBFlash = (currentMode === 'sb-flash');
  const isMath = isMathMode(currentMode);
  
  // Đọc config từ UI
  if (!isFMFlash && !isSBFlash && !isMath) {
    config.terms = parseInt($('termInput').value) || 5;
  }
  config.pack = parseInt($('packSelect').value) || 10;
  
  if (save) {
    // LƯU: lưu config + chạy đủ số câu
    localStorage.setItem('superbrain_config_' + currentMode, JSON.stringify(config));
    totalQuestions = config.pack;
    isTestMode = false;   // ⭐ Đánh dấu: KHÔNG phải test mode
  } else {
    // LÀM THỬ: 1 câu test, không lưu config
    totalQuestions = 1;
    isTestMode = true;    // ⭐ Đánh dấu: ĐANG TEST MODE
  }
  
  // Reset state
  score = 0; wrong = 0; streak = 0;
  currentQuestionIndex = 0;
  history = [];
  reviewQueue = [];
  
  if (currentMode === 'fm-review' || currentMode === 'sb-add-review') {
    buildReviewQueue();
  }
  
  $('score').textContent = 0;
  $('streak').textContent = 0;
  $('totalDisplay').textContent = totalQuestions;
  $('levelTag').textContent = (modeTitles[currentMode] || 'LUYỆN TẬP').toUpperCase();
  
  goTo('screen-game');
  prepareFirstQuestion();
}
