/* ============================================================
   GAME SCREEN — Xử lý màn hình chơi
   V2: hỗ trợ numpad (bàn phím ảo)
   ============================================================ */

/* ============ CHUẨN BỊ CÂU ĐẦU ============ */
function prepareFirstQuestion() {
  waitingStart = true;
  
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
    setTimeout(() => {
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
    return;
  }
  
  showLoading();
  setTimeout(() => {
    const q = generateOneQuestion(modeKey, config.digits, config.terms, RULES);
    currentParts = q.parts;
    currentAnswer = q.answer;
    currentQuestionText = q.parts.join(' ') + ' =';
    
    hideLoading();
    displaySequence(currentParts);
  }, 50);
}

/* ============ HIỂN THỊ TUẦN TỰ ============ */
function displaySequence(parts) {
  const mainEl = $('mainDisplay');
  const pastEl = $('pastDisplay');
  
  mainEl.innerHTML = '';
  pastEl.innerHTML = '';
  pastTokens = [];
  
  const total = config.timeDisplay;
  const stepTime = (total * 1000) / parts.length;
  const PAUSE_AFTER_LAST = 3000;
  
  mainEl.innerHTML = `<span class="token">${parts[0]}</span>`;
  let currentIdx = 1;
  
  let elapsed = 0;
  $('timerFill').style.width = '100%';
  
  displayTimer = setInterval(() => {
    elapsed += 50;
    const remain = Math.max(0, total * 1000 - elapsed);
    $('timerFill').style.width = (remain / (total * 1000) * 100) + '%';
    
    if (currentIdx < parts.length && elapsed >= currentIdx * stepTime) {
      pastTokens.push(parts[currentIdx - 1]);
      pastEl.innerHTML = pastTokens.map(t => `<span class="token-past">${t}</span>`).join('');
      
      mainEl.innerHTML = `<span class="token">${parts[currentIdx]}</span>`;
      currentIdx++;
    }
    
    if (elapsed >= total * 1000) {
      clearInterval(displayTimer);
      displayTimer = null;
      
      if (currentIdx === parts.length) {
        pastTokens.push(parts[parts.length - 1]);
      } else {
        pastTokens.push(parts[currentIdx - 1]);
      }
      pastEl.innerHTML = pastTokens.map(t => `<span class="token-past">${t}</span>`).join('');
      
      mainEl.innerHTML = '';
      
      setTimeout(() => {
        mainEl.innerHTML = `<span class="token">=</span>`;
        startAnswerPhase();
      }, PAUSE_AFTER_LAST);
    }
  }, 50);
}

/* ============ NHẬP ĐÁP ÁN ============ */
function startAnswerPhase() {
  answerPhase = true;
  
  $('answer').disabled = false;
  $('btnCheck').disabled = false;
  $('timerBar').classList.add('flash');
  
  let answerTimeLeft = config.timeAnswer;
  $('timerFill').style.width = '100%';
  
  answerTimer = setInterval(() => {
    answerTimeLeft--;
    $('timerFill').style.width = (answerTimeLeft / config.timeAnswer * 100) + '%';
    if (answerTimeLeft <= 0) {
      clearInterval(answerTimer);
      answerTimer = null;
      recordWrong('⏰ Hết thời gian!');
    }
  }, 1000);
}

/* ============================================================
   CHUYỂN NỀN SANG TRẮNG KHI TRẢ LỜI
   ============================================================ */
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
   CHECK ĐÁP ÁN
   ============================================================ */
function checkAnswer() {
  if (!answerPhase) return;
  
  const raw = $('answer').value.trim();
  const userAns = parseInt(raw);
  
  if (raw === '' || isNaN(userAns)) {
    $('feedback').textContent = '⚠️ Vui lòng nhập đáp án!';
    $('feedback').className = 'feedback wrong';
    return;
  }
  
  stopAllTimers();
  userAnswer = raw;
  
  const isCorrect = (userAns === currentAnswer);
  
  revealAnswerBackground();
  
  setTimeout(() => {
    if (isCorrect) {
      playSound('ok');
      showAnswerOverlay(true);
    } else {
      playSound('fail');
      showAnswerOverlay(false);
    }
  }, 300);
  
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
    $('feedback').textContent = `❌ Sai! Đáp án đúng: ${currentAnswer}`;
    $('feedback').className = 'feedback wrong';
    
    history.push({
      question: currentQuestionText,
      answer: userAnswer === '' ? '—' : userAnswer,
      correct: currentAnswer,
      isCorrect: false
    });
    
    userAnswer = '';
  }
  
  setTimeout(() => {
    hideAnswerOverlay();
    resetAnswerBackground();
  }, 3300);
  
  setTimeout(() => {
    nextQuestion();
  }, 5300);
}

/* ============ XỬ LÝ SAI ============ */
function recordWrong(msg) {
  stopAllTimers();
  
  revealAnswerBackground();
  
  setTimeout(() => {
    playSound('fail');
    showAnswerOverlay(false);
  }, 300);
  
  wrong++; 
  streak = 0;
  $('streak').textContent = 0;
  $('feedback').textContent = msg;
  $('feedback').className = 'feedback wrong';
  
  history.push({
    question: currentQuestionText,
    answer: userAnswer === '' ? '—' : userAnswer,
    correct: currentAnswer,
    isCorrect: false
  });
  
  userAnswer = '';
  
  setTimeout(() => {
    hideAnswerOverlay();
    resetAnswerBackground();
  }, 3300);
  
  setTimeout(() => {
    nextQuestion();
  }, 5300);
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
  
  clearTimeout(overlayTimer);
  overlayTimer = setTimeout(() => {
    overlay.classList.remove('show');
  }, 3000);
}

function hideAnswerOverlay() {
  const overlay = $('answerOverlay');
  if (overlay) {
    overlay.classList.remove('show');
  }
  clearTimeout(overlayTimer);
}