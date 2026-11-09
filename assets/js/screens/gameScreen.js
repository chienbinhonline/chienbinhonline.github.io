/* ============================================================
   GAME SCREEN — Xử lý màn hình chơi
   V2.8: Chống chạy ngầm khi chuyển màn hình (Zombie Timers)
   ============================================================ */

// ⭐ BIẾN TOÀN CỤC CHỐNG LỖI (RACE CONDITION)
let isAnswerLocked = false;
let gameTimeouts = [];

// ⭐ Hàm dọn dẹp tất cả setTimeout ngầm
function clearGameTimeouts() {
  gameTimeouts.forEach(t => clearTimeout(t));
  gameTimeouts = [];
}

// ⭐ Hàm kiểm tra xem có đang ở màn hình game không
function isGameActive() {
  const screen = $('screen-game');
  return screen && screen.classList.contains('active');
}

/* ============ CHUẨN BỊ CÂU ĐẦU ============ */
function prepareFirstQuestion() {
  waitingStart = true;
  clearGameTimeouts();
  isAnswerLocked = false;
  
  const qBox = $('questionBox');
  qBox.classList.remove('flashcard', 'soroban-flash', 'answer-reveal');
  
  $('answer').value = '';
  $('answer').disabled = true;
  $('btnCheck').disabled = true;
  $('btnSkip').disabled = true;
  $('feedback').textContent = '';
  $('feedback').className = 'feedback';
  $('timerBar').classList.remove('flash');
  $('timerFill').style.width = '100%';
  
  $('mainDisplay').style.display = 'none';
  $('loadingSpinner').classList.remove('show');
  $('startOverlay').classList.remove('hidden');
  
  $('pastDisplay').innerHTML = '';
  $('pastDisplay').classList.remove('show');
  $('btnShowPast').classList.remove('active');
  $('btnShowPast').textContent = 'HIỆN';
  
  $('progressInfo').textContent = `Câu 1 / ${totalQuestions}`;
  
  hideAnswerOverlay();
}

function startNow() {
  waitingStart = false;
  $('startOverlay').classList.add('hidden');
  $('mainDisplay').style.display = 'flex';
  $('btnSkip').disabled = false;
  
  nextQuestion();
}

/* ============ BUILD QUEUE ============ */
function buildReviewQueue() {
  const modes = ['basic', 'lb+', 'lb-', 'bb+', 'bb-'];
  const perMode = Math.floor(totalQuestions / 5);
  const remainder = totalQuestions % 5;
  reviewQueue = [];
  modes.forEach(m => {
    for (let i = 0; i < perMode; i++) reviewQueue.push(m);
  });
  for (let i = 0; i < remainder; i++) reviewQueue.push(modes[i % 5]);
  for (let i = reviewQueue.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [reviewQueue[i], reviewQueue[j]] = [reviewQueue[j], reviewQueue[i]];
  }
}

/* ============ CÂU TIẾP ============ */
function nextQuestion() {
  // ⭐ TRẠM GÁC: Nếu đã thoát khỏi màn hình chơi thì dừng ngay lập tức
  if (!isGameActive()) return; 
  
  clearGameTimeouts();
  isAnswerLocked = false;
  hideAnswerOverlay();
  
  if (currentQuestionIndex >= totalQuestions) { 
    showResult(); 
    return; 
  }
  
  currentQuestionIndex++;
  $('progressInfo').textContent = `Câu ${currentQuestionIndex} / ${totalQuestions}`;
  
  const qBox = $('questionBox');
  qBox.classList.remove('flashcard', 'soroban-flash', 'answer-reveal');
  
  $('pastDisplay').innerHTML = '';
  $('pastDisplay').classList.remove('show');
  $('btnShowPast').classList.remove('active');
  $('btnShowPast').textContent = 'HIỆN';
  
  let modeKey;
  if (currentMode === 'fm-review' || currentMode === 'sb-add-review') {
    modeKey = reviewQueue[currentQuestionIndex - 1] || 'basic';
  } else {
    modeKey = uiModeToKey(currentMode);
  }
  
  const RULES = getRulesForMode(modeKey);
  
  $('answer').value = '';
  $('answer').disabled = true;
  $('btnCheck').disabled = true;
  $('feedback').textContent = '';
  $('feedback').className = 'feedback';
  $('timerBar').classList.remove('flash');
  
  if (currentMode === 'fm-flash-1') {
    currentAnswer = generateFlashcardFM(1);
    currentQuestionText = `Flashcard 1 tay (${currentAnswer})`;
    startAnswerPhase();
    return;
  }
  if (currentMode === 'fm-flash-2') {
    currentAnswer = generateFlashcardFM(2);
    currentQuestionText = `Flashcard 2 tay (${currentAnswer})`;
    startAnswerPhase();
    return;
  }
  if (currentMode === 'sb-flash') {
    const dc = config.digits || 3;
    currentAnswer = generateFlashcardSoroban(dc);
    currentQuestionText = `Flashcard Soroban (${currentAnswer})`;
    startAnswerPhase();
    return;
  }
  
  if (isMathMode(currentMode)) {
    showLoading();
    let t = setTimeout(() => {
      if (!isGameActive()) return; // ⭐ Chống chạy ngầm
      
      let q;
      if (currentMode === 'sb-mul') {
        q = genMulQuestion(config.mathDigit1, config.mathDigit2);
      } else {
        q = genDivQuestion(config.mathDigit1, config.mathDigit2);
      }
      currentParts = q.parts;
      currentAnswer = q.answer;
      currentQuestionText = q.parts.join(' ') + ' =';
      hideLoading();
      displaySequence(currentParts);
    }, 50);
    gameTimeouts.push(t);
    return;
  }
  
  showLoading();
  let t = setTimeout(() => {
    if (!isGameActive()) return; // ⭐ Chống chạy ngầm
    
    const q = generateOneQuestion(modeKey, config.digits, config.terms, RULES);
    currentParts = q.parts;
    currentAnswer = q.answer;
    currentQuestionText = q.parts.join(' ') + ' =';
    
    hideLoading();
    displaySequence(currentParts);
  }, 50);
  gameTimeouts.push(t);
}

/* ============================================================
   HIỂN THỊ TUẦN TỰ
   ============================================================ */
function displaySequence(parts) {
  const mainEl = $('mainDisplay');
  const pastEl = $('pastDisplay');
  
  mainEl.innerHTML = '';
  pastEl.innerHTML = '';
  pastTokens = [];
  
  const total = config.timeDisplay;
  const stepTime = (total * 1000) / parts.length;
  const PAUSE_AFTER_LAST = 500; // 0.5s như bạn đã sửa
  
  const tokenColorMap = {};
  let prevNumber = null;
  let prevColor = 'white';
  
  parts.forEach((tok, i) => {
    const rawStr = String(tok);
    const trimmed = rawStr.trim();
    const match = trimmed.match(/\d+/);
  
    if (!match) return;
  
    const num = parseInt(match[0], 10);
  
    if (prevNumber === null) {
      tokenColorMap[i] = 'white';
    } else if (num === prevNumber) {
      tokenColorMap[i] = (prevColor === 'white') ? 'red' : 'white';
    } else {
      tokenColorMap[i] = 'white';
    }
  
    prevNumber = num;
    prevColor = tokenColorMap[i];
  });
  
  function tokenHTML(text, idx) {
    const color = tokenColorMap[idx];
    if (color === 'red') {
      return `<span class="token token-red" style="color:#ff3b30 !important;">${text}</span>`;
    }
    return `<span class="token">${text}</span>`;
  }
  
  function tokenPastHTML(text, idx) {
    const color = tokenColorMap[idx];
    if (color === 'red') {
      return `<span class="token-past token-past-red" style="color:#ff3b30 !important;background:#ffe5e5 !important;">${text}</span>`;
    }
    return `<span class="token-past">${text}</span>`;
  }
  
  mainEl.innerHTML = tokenHTML(parts[0], 0);
  let currentIdx = 1;
  
  let elapsed = 0;
  $('timerFill').style.width = '100%';
  
  displayTimer = setInterval(() => {
    // ⭐ TRẠM GÁC TRONG VÒNG LẶP
    if (!isGameActive()) {
      clearInterval(displayTimer);
      return;
    }

    elapsed += 50;
    const remain = Math.max(0, total * 1000 - elapsed);
    $('timerFill').style.width = (remain / (total * 1000) * 100) + '%';
    
    if (currentIdx < parts.length && elapsed >= currentIdx * stepTime) {
      const pastIdx = currentIdx - 1;
      pastTokens.push({ text: parts[pastIdx], idx: pastIdx });
      pastEl.innerHTML = pastTokens.map(t => tokenPastHTML(t.text, t.idx)).join('');
      
      mainEl.innerHTML = tokenHTML(parts[currentIdx], currentIdx);
      currentIdx++;
    }
    
    if (elapsed >= total * 1000) {
      clearInterval(displayTimer);
      displayTimer = null;
      
      let lastIdx;
      if (currentIdx === parts.length) {
        lastIdx = parts.length - 1;
        pastTokens.push({ text: parts[lastIdx], idx: lastIdx });
      } else {
        lastIdx = currentIdx - 1;
        pastTokens.push({ text: parts[lastIdx], idx: lastIdx });
      }
      pastEl.innerHTML = pastTokens.map(t => tokenPastHTML(t.text, t.idx)).join('');
      
      mainEl.innerHTML = '';
      
      let t = setTimeout(() => {
        if (!isGameActive()) return; // ⭐ Chống chạy ngầm
        mainEl.innerHTML = `<span class="token">=</span>`;
        startAnswerPhase();
      }, PAUSE_AFTER_LAST);
      gameTimeouts.push(t);
    }
  }, 50);
}

/* ============ NHẬP ĐÁP ÁN ============ */
function startAnswerPhase() {
  if (!isGameActive()) return; // ⭐ Chống chạy ngầm
  
  answerPhase = true;
  isAnswerLocked = false; 
  
  $('answer').disabled = false;
  $('btnCheck').disabled = false;
  $('timerBar').classList.add('flash');
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const input = $('answer');
  
  if (input) {
    if (isMobile) {
      input.setAttribute('readonly', 'readonly');
      input.blur(); 
    } else {
      input.removeAttribute('readonly');
      let t = setTimeout(() => {
        if (isGameActive() && !input.disabled) {
          input.focus();
          const len = input.value.length;
          if(input.setSelectionRange) input.setSelectionRange(len, len);
        }
      }, 50);
      gameTimeouts.push(t);
    }
  }
  
  let answerTimeLeft = config.timeAnswer;
  $('timerFill').style.width = '100%';
  
  answerTimer = setInterval(() => {
    // ⭐ TRẠM GÁC TRONG VÒNG LẶP
    if (!isGameActive()) {
      clearInterval(answerTimer);
      return;
    }

    answerTimeLeft--;
    $('timerFill').style.width = (answerTimeLeft / config.timeAnswer * 100) + '%';
    if (answerTimeLeft <= 0) {
      clearInterval(answerTimer);
      answerTimer = null;
      submitAnswer(true); 
    }
  }, 1000);
}

/* ============================================================ */
function revealAnswerBackground() {
  const qBox = $('questionBox');
  const mainEl = $('mainDisplay');
  mainEl.innerHTML = '';
  qBox.classList.add('answer-reveal');
}

function resetAnswerBackground() {
  const qBox = $('questionBox');
  qBox.classList.remove('answer-reveal');
}

/* ============================================================
   HÀM XỬ LÝ NỘP BÀI (DÙNG CHUNG CHO CẢ BẤM NÚT VÀ HẾT GIỜ)
   ============================================================ */
function submitAnswer(isTimeout = false) {
  if (isAnswerLocked) return; 
  isAnswerLocked = true;      
  
  stopAllTimers();
  
  const raw = $('answer').value.trim();
  let userAns = parseInt(raw);
  
  if (isTimeout && (raw === '' || isNaN(userAns))) {
     userAns = NaN; 
     userAnswer = ''; 
  } else if (!isTimeout && (raw === '' || isNaN(userAns))) {
     $('feedback').textContent = '⚠️ Vui lòng nhập đáp án!';
     $('feedback').className = 'feedback wrong';
     isAnswerLocked = false; 
     return;
  } else {
     userAnswer = raw;
  }
  
  const isCorrect = (userAns === currentAnswer);
  
  revealAnswerBackground();
  
  let t1 = setTimeout(() => {
    if (!isGameActive()) return;
    if (isCorrect) {
      playSound('ok');
      showAnswerOverlay(true);
    } else {
      playSound('fail');
      showAnswerOverlay(false);
    }
  }, 300);
  gameTimeouts.push(t1);
  
  if (isCorrect) {
    score++; 
    streak++;
    $('score').textContent = score;
    $('streak').textContent = streak;
    $('feedback').textContent = `✅ Chính xác! Chuỗi: ${streak}🔥`;
    $('feedback').className = 'feedback correct';
    
    history.push({ 
      question: currentQuestionText, 
      answer: userAns, 
      correct: currentAnswer, 
      isCorrect: true 
    });
  } else {
    wrong++; 
    streak = 0;
    $('streak').textContent = 0;
    
    if (isTimeout && raw === '') {
      $('feedback').textContent = `⏰ Hết thời gian! Đáp án: ${currentAnswer}`;
    } else {
      $('feedback').textContent = `❌ Sai! Đáp án đúng: ${currentAnswer}`;
    }
    
    $('feedback').className = 'feedback wrong';
    
    history.push({
      question: currentQuestionText,
      answer: (raw === '') ? '—' : raw,
      correct: currentAnswer,
      isCorrect: false
    });
    
    userAnswer = '';
  }
  
  let t2 = setTimeout(() => {
    if (!isGameActive()) return;
    hideAnswerOverlay();
    resetAnswerBackground();
  }, 3300);
  gameTimeouts.push(t2);
  
  let t3 = setTimeout(() => {
    if (!isGameActive()) return; // ⭐ Chống chạy ngầm khi chuyển câu
    nextQuestion();
  }, 5300);
  gameTimeouts.push(t3);
}

function checkAnswer() {
  submitAnswer(false);
}

/* ============ XỬ LÝ BỎ QUA (SKIP) ============ */
function skipAnswer() {
  if (isAnswerLocked) return;
  isAnswerLocked = true;
  
  stopAllTimers();
  revealAnswerBackground();
  
  let t1 = setTimeout(() => {
    if (!isGameActive()) return;
    playSound('fail');
    showAnswerOverlay(false);
  }, 300);
  gameTimeouts.push(t1);
  
  wrong++; 
  streak = 0;
  $('streak').textContent = 0;
  $('feedback').textContent = `⏭️ Bỏ qua. Đáp án: ${currentAnswer}`;
  $('feedback').className = 'feedback wrong';
  
  history.push({
    question: currentQuestionText,
    answer: '—',
    correct: currentAnswer,
    isCorrect: false
  });
  
  userAnswer = '';
  
  let t2 = setTimeout(() => {
    if (!isGameActive()) return;
    hideAnswerOverlay();
    resetAnswerBackground();
  }, 3300);
  gameTimeouts.push(t2);
  
  let t3 = setTimeout(() => {
    if (!isGameActive()) return; // ⭐ Chống chạy ngầm khi chuyển câu
    nextQuestion();
  }, 5300);
  gameTimeouts.push(t3);
}

/* ============ OVERLAY ============ */
function showAnswerOverlay(isCorrect) {
  const overlay = $('answerOverlay');
  const img = $('answerOverlayImg');
  
  if (!overlay || !img) return;
  
  img.src = isCorrect ? IMG_CORRECT : IMG_WRONG;
  img.alt = isCorrect ? 'Đúng' : 'Sai';
  
  overlay.classList.remove('show');
  void overlay.offsetWidth;
  overlay.classList.add('show');
}

function hideAnswerOverlay() {
  const overlay = $('answerOverlay');
  if (overlay) {
    overlay.classList.remove('show');
  }
  clearTimeout(overlayTimer);
}
