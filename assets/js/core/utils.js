/* ============================================================
   UTILS — Hàm tiện ích
   ============================================================ */

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function toDigits(num, len) {
    return String(num).padStart(len, '0').split('').map(c => parseInt(c));
}

function fromDigits(arr) {
    return parseInt(arr.join(''));
}

function randByDigits(digitCount) {
    if (digitCount === 1) return rand(1, 9);
    const min = Math.pow(10, digitCount - 1);
    const max = Math.pow(10, digitCount) - 1;
    return rand(min, max);
}

function maxValueForDigits(d) {
    if (d === 1) return 9;
    return Math.pow(10, d) - 1;
}

function isFMFlashcardOnly(mode) {
    return mode === 'fm-flash-1' || mode === 'fm-flash-2';
}

function isMathMode(mode) {
    return mode === 'sb-mul' || mode === 'sb-div';
}

function getDigitsOptions(mode) {
    if (mode.startsWith('fm')) return [1, 2];
    return [1, 2, 3, 4, 5, 6, 7, 8];
}