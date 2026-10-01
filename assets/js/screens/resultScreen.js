/* ============================================================
   RESULT SCREEN — Bảng kết quả + Lưu lịch sử
   V2.3: Luôn lưu lịch sử (cả test mode), addHistoryRecord tự
         quyết định có gửi Sheet hay không
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
  
  // ===== XÁC ĐỊNH MODE =====
  const isFMFlash = isFMFlashcardOnly(currentMode);
  const isSBFlash = (currentMode === 'sb-flash');
  const isMath = isMathMode(currentMode);
  const isCalculationMode = !isFMFlash && !isSBFlash && !isMath;
  
  // ⭐ LUÔN lưu lịch sử (cả test mode + luyện tập)
  // Hàm addHistoryRecord sẽ tự quyết định có gửi Sheet hay không
  addHistoryRecord({
    mode: currentMode,
    subject: currentMode.startsWith('fm') ? 'fingermath' : 'soroban',
    percent: percent,
    score: score,
    total: totalQuestions,
    rows: isCalculationMode ? config.terms : 0,
    displayTime: isCalculationMode ? config.timeDisplay : 0,
    date: new Date().toISOString(),
    isTest: isTestMode === true   // ⭐ Đánh dấu record test
  });
  
  goTo('screen-result');
}

function restartGame() {
  score = 0; wrong = 0; streak = 0;
  currentQuestionIndex = 0; history = [];
  reviewQueue = [];
  
  // ⭐ Nếu đang test mode → giữ totalQuestions = 1
  if (isTestMode) {
    totalQuestions = 1;
  }
  
  if (currentMode === 'fm-review' || currentMode === 'sb-add-review') buildReviewQueue();
  $('score').textContent = 0;
  $('streak').textContent = 0;
  $('totalDisplay').textContent = totalQuestions;
  goTo('screen-game');
  prepareFirstQuestion();
}
