/* ============================================================
   FINGERMATH — Flashcard + fallback bàn tay vẽ CSS
   ============================================================ */

function getDigitImageFM(digit, pos) {
    return `${IMG_FM}${digit}-${pos}.png`;
}

function buildFlashcardImageHTML(tens, units, showBoth) {
    const leftImg = getDigitImageFM(tens, '10');
    const rightImg = getDigitImageFM(units, '01');

    if (!showBoth) {
        return `
      <div style="text-align:center;width:100%;display:flex;justify-content:center;align-items:center;height:100%;">
        <img src="${rightImg}" style="max-height:280px;max-width:60%;object-fit:contain;" alt="${units}"
             onerror="this.parentElement.innerHTML = fallbackFlashcardFM(${tens}, ${units}, false);">
      </div>
    `;
    }
    return `
    <div style="display:flex;gap:60px;justify-content:center;align-items:center;width:100%;height:100%;">
      <img src="${leftImg}" style="max-height:260px;max-width:40%;object-fit:contain;" alt="${tens}"
           onerror="this.style.display='none';">
      <img src="${rightImg}" style="max-height:260px;max-width:40%;object-fit:contain;" alt="${units}"
           onerror="this.style.display='none';">
    </div>
  `;
}

function fallbackFlashcardFM(tens, units, showBoth) {
    const tThumb = tens >= 5, tFingers = tens >= 5 ? tens - 5 : tens;
    const uThumb = units >= 5, uFingers = units >= 5 ? units - 5 : units;
    const leftHTML = `
    <div class="hand">
      <div class="hand-label">TAY TRÁI</div>
      <div class="fingers-row">
        <div class="finger thumb ${tThumb ? 'active' : ''}"></div>
        ${[0, 1, 2, 3].map(i => `<div class="finger ${i < tFingers ? 'active' : ''}"></div>`).join('')}
      </div>
    </div>`;
    const rightHTML = `
    <div class="hand">
      <div class="hand-label">TAY PHẢI</div>
      <div class="fingers-row">
        <div class="finger thumb ${uThumb ? 'active' : ''}"></div>
        ${[0, 1, 2, 3].map(i => `<div class="finger ${i < uFingers ? 'active' : ''}"></div>`).join('')}
      </div>
    </div>`;
    if (!showBoth) return rightHTML;
    return `<div class="hands-display">${leftHTML}${rightHTML}</div>`;
}

function generateFlashcardFM(hands) {
    let value = hands === 1 ? rand(0, 9) : rand(0, 99);
    const tens = Math.floor(value / 10);
    const units = value % 10;

    $('questionBox').classList.add('flashcard');
    $('questionBox').classList.remove('soroban-flash');
    $('mainDisplay').innerHTML = buildFlashcardImageHTML(tens, units, hands === 2);

    currentQuestionText = `Flashcard (${value})`;
    currentAnswer = value;
    return value;
}