/* ============================================================
   CONFIG — Biến state toàn cục, hằng số, helper cơ bản
   ============================================================ */

// ===== STATE =====
let score = 0, wrong = 0, streak = 0;
let currentAnswer = 0;
let currentQuestionText = '';
let userAnswer = '';
let currentMode = '';
let displayTimer = null;
let answerTimer = null;
let answerPhase = false;
let waitingStart = false;
let overlayTimer = null;

let lastMenuScreen = 'screen-home';
let lastConfigScreen = 'screen-fingermath';
let isTestMode = false;

// ===== CẤU HÌNH =====
let config = {
    digits: 1,
    terms: 5,
    pack: 10,
    timeDisplay: 15,
    timeAnswer: 6,
    mathDigit1: 2,
    mathDigit2: 1
};

// ===== LỊCH SỬ + QUEUE =====
let history = [];
let currentQuestionIndex = 0;
let totalQuestions = 10;
let reviewQueue = [];

// ===== HIỂN THỊ =====
let currentParts = [];
let pastTokens = [];

// ===== ĐƯỜNG DẪN ẢNH + ÂM THANH =====
const IMG_FM = 'fingermath/';
const IMG_SB = 'soroban/';
const SND_OK = 'music/dung.mp3';
const SND_FAIL = 'music/sai.mp3';
const IMG_CORRECT = 'icon/correct.png';    // ← THÊM
const IMG_WRONG   = 'icon/wrong.png';      // ← THÊM

// ===== HELPER SHORTCUT =====
const $ = id => document.getElementById(id);

// ===== TIÊU ĐỀ CÁC MODE =====
const modeTitles = {
    'fm-flash-1': 'Flashcard 1 Tay',
    'fm-flash-2': 'Flashcard 2 Tay',
    'fm-basic': 'Basic',
    'fm-lb-plus': 'Little Buddy +',
    'fm-lb-minus': 'Little Buddy −',
    'fm-bb-plus': 'Big Buddy +',
    'fm-bb-minus': 'Big Buddy −',
    'fm-review': 'Ôn tập FingerMath',
    'sb-flash': 'Flashcard Soroban',
    'sb-add-basic': 'Cộng trừ Basic',
    'sb-add-lb-plus': 'LB + Soroban',
    'sb-add-lb-minus': 'LB − Soroban',
    'sb-add-bb-plus': 'BB + Soroban',
    'sb-add-bb-minus': 'BB − Soroban',
    'sb-add-review': 'Ôn tập cộng trừ',
    'sb-mul': 'Nhân Soroban',
    'sb-div': 'Chia Soroban'
};
