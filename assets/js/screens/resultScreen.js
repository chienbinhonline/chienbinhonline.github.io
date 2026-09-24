/* ============================================================
   RESULT SCREEN — Bảng kết quả + Lưu lịch sử
   V2: gửi thêm rows + displayTime cho BXH
   ============================================================ */

function showResult() {
  stopAllTimers();
  
  // ===== RENDER BẢNG KẾT QUẢ =====
  const tbody = $('resultBody');
  tbody.innerHTML = '';
  
  history.forEach((item, idx) => {
    const tr = document.createElement('tr');
    const icon = item.isCorrect ? '<span class="tick">✓</span>' : '<span class="cross">✗</span>';
    const ansDisp = (item.answer === '—' || item.answer === '') ? '' : item.answer;
    tr.innerHTML = `<td>${idx+1}</td><td>${item.question}</td><td>${ansDisp}</td><td>${item.correct}</td><td>${icon}</td>`;
    tbody.appendChild(tr);
  });
  
  const percent = totalQuestions > 0 ? Math.round(score / totalQuestions * 100) : 0;
  $('summaryText').textContent = `Tổng: ${score}/${totalQuestions}`;
  $('summaryPercent').textContent = `(${percent}%)`;
  
  // ===== XÁC ĐỊNH MODE CÓ DÙNG ROWS/TIME =====
  const isFMFlash = isFMFlashcardOnly(currentMode);
  const isSBFlash = (currentMode === 'sb-flash');
  const isMath = isMathMode(currentMode);
  const isCalculationMode = !isFMFlash && !isSBFlash && !isMath;
  
  // ===== LƯU LỊCH SỬ =====
  addHistoryRecord({
    mode: currentMode,
    subject: currentMode.startsWith('fm') ? 'fingermath' : 'soroban',
    percent: percent,
    score: score,
    total: totalQuestions,
    rows: isCalculationMode ? config.terms : 0,
    displayTime: isCalculationMode ? config.timeDisplay : 0,
    date: new Date().toISOString()
  });
  
  goTo('screen-result');
}

function restartGame() {
  score = 0; wrong = 0; streak = 0;
  currentQuestionIndex = 0; history = [];
  reviewQueue = [];
  if (currentMode === 'fm-review' || currentMode === 'sb-add-review') buildReviewQueue();
  $('score').textContent = 0;
  $('streak').textContent = 0;
  $('totalDisplay').textContent = totalQuestions;
  goTo('screen-game');
  prepareFirstQuestion();
}