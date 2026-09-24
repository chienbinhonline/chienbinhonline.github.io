/* ============================================================
   SOROBAN — Flashcard ghép cột
   ============================================================ */

function buildSorobanColHTML(digit, isLastCol) {
    const hasTop = digit >= 5;
    const bottomCount = digit % 5;

    let slot1;
    if (hasTop) {
        slot1 = `<div class="soroban-slot"><img src="${IMG_SB}hat.png" alt="hat tren"></div>`;
    } else {
        slot1 = `<div class="soroban-slot"></div>`;
    }

    const dotHTML = isLastCol
        ? `<img src="${IMG_SB}cham.png" class="dot-overlay" alt="cham">`
        : '';
    const slot2 = `
    <div class="soroban-slot frame-slot">
      <img src="${IMG_SB}khung.png" class="khung-img" alt="khung">
      ${dotHTML}
    </div>
  `;

    let bottomSlots = '';
    for (let i = 0; i < 4; i++) {
        if (i < bottomCount) {
            bottomSlots += `<div class="soroban-slot"><img src="${IMG_SB}hat.png" alt="hat duoi"></div>`;
        } else {
            bottomSlots += `<div class="soroban-slot"></div>`;
        }
    }

    return `<div class="soroban-col">${slot1}${slot2}${bottomSlots}</div>`;
}

function generateFlashcardSoroban(digitCount) {
    const digits = [];
    digits.push(rand(1, 9));
    for (let i = 1; i < digitCount; i++) {
        digits.push(rand(0, 9));
    }

    const value = parseInt(digits.join(''));

    const boardHTML = digits.map((d, i) =>
        buildSorobanColHTML(d, i === digitCount - 1)
    ).join('');

    $('questionBox').classList.remove('flashcard');
    $('questionBox').classList.add('soroban-flash');
    $('mainDisplay').innerHTML = `
    <div class="soroban-board-wrapper">
      <div class="soroban-board">${boardHTML}</div>
    </div>
  `;

    currentQuestionText = `Flashcard Soroban (${value})`;
    currentAnswer = value;
    return value;
}