/* ============================================================
   GENERATOR — Sinh câu hỏi cho tất cả mode
   ============================================================ */

// ============ BASIC / LB+ / LB- (KHÔNG NHỚ) ============
function tryGenerateStep_NoCarry(curDigits, digitCount, RULES) {
    const op = Math.random() < 0.5 ? '+' : '-';
    const nDigits = [];
    const newDigits = [];
    const signatures = [];

    for (let k = 0; k < digitCount; k++) {
        const X = curDigits[k];
        const candidates = [];
        for (let n = 0; n <= 9; n++) {
            if (!isAllowed(X, op, n, RULES)) continue;
            const newX = op === '+' ? X + n : X - n;
            if (newX < 0 || newX > 9) continue;
            candidates.push(n);
        }
        if (candidates.length === 0) return { ok: false };
        const nPick = candidates[rand(0, candidates.length - 1)];
        nDigits.push(nPick);
        newDigits.push(op === '+' ? X + nPick : X - nPick);
        signatures.push({ X, op, n: nPick });
    }
    return { ok: true, op, nDigits, newDigits, signatures };
}

function genQuestion_NoCarry_Full(digitCount, termsCount, RULES, modeKey) {
    let current = randByDigits(digitCount);
    const parts = [String(current)];
    let hasSignature = false;

    for (let i = 1; i < termsCount; i++) {
        const curDigits = toDigits(current, digitCount);
        let stepOk = false;

        for (let t = 0; t < 500; t++) {
            const result = tryGenerateStep_NoCarry(curDigits, digitCount, RULES);
            if (!result.ok) continue;
            if (!result.nDigits.some(d => d !== 0)) continue;

            for (const s of result.signatures) {
                if (isSignatureStep(s.X, s.op, s.n, modeKey)) hasSignature = true;
            }

            const nValue = fromDigits(result.nDigits);
            parts.push((result.op === '+' ? '+ ' : '− ') + nValue);
            current = fromDigits(result.newDigits);
            stepOk = true;
            break;
        }

        if (!stepOk) return null;
    }

    if (modeKey !== 'basic' && !hasSignature) return null;
    return { parts, answer: current };
}

// ============ BB+ / BB- (CÓ NHỚ/MƯỢN) ============
function tryGenerateStep_BB_1digit(curVal, RULES, op) {
    const u = curVal % 10;
    const candidates = [];
    for (let n = 0; n <= 9; n++) {
        if (!isAllowed(u, op, n, RULES)) continue;
        const newVal = op === '+' ? curVal + n : curVal - n;
        if (newVal < 0) continue;
        candidates.push(n);
    }
    if (candidates.length === 0) return { ok: false };

    const nPick = candidates[rand(0, candidates.length - 1)];
    const newVal = op === '+' ? curVal + nPick : curVal - nPick;

    return {
        ok: true, op, nDigits: [nPick], newVal,
        signatures: [{ X: u, op, n: nPick }]
    };
}

function tryGenerateStep_BB_Multi(curDigits, digitCount, RULES, op) {
    const nDigits = new Array(digitCount).fill(0);
    const lastIdx = digitCount - 1;
    const X_units = curDigits[lastIdx];

    const candidates = [];
    for (let n = 0; n <= 9; n++) {
        if (!isAllowed(X_units, op, n, RULES)) continue;
        candidates.push(n);
    }
    if (candidates.length === 0) return { ok: false };

    for (let k = 0; k < digitCount; k++) {
        if (k === lastIdx) {
            nDigits[k] = candidates[rand(0, candidates.length - 1)];
        } else {
            nDigits[k] = rand(0, 9);
        }
    }

    const newDigits = new Array(digitCount).fill(0);
    let carry = 0;
    const signatures = [];

    if (op === '+') {
        for (let k = digitCount - 1; k >= 0; k--) {
            const sum = curDigits[k] + nDigits[k] + carry;
            newDigits[k] = sum % 10;
            carry = Math.floor(sum / 10);
            if (k === lastIdx) signatures.push({ X: curDigits[k], op, n: nDigits[k] });
        }
        if (carry > 0) return { ok: false };
    } else {
        for (let k = digitCount - 1; k >= 0; k--) {
            let diff = curDigits[k] - nDigits[k] - carry;
            if (diff < 0) { diff += 10; carry = 1; }
            else { carry = 0; }
            newDigits[k] = diff;
            if (k === lastIdx) signatures.push({ X: curDigits[k], op, n: nDigits[k] });
        }
        if (carry > 0) return { ok: false };
    }

    return { ok: true, nDigits, newDigits, signatures };
}

function genQuestion_BB_Full(digitCount, termsCount, RULES, modeKey) {
    const maxVal = maxValueForDigits(digitCount);
    let currentVal = randByDigits(digitCount);
    const parts = [String(currentVal)];
    let hasSignature = false;

    for (let i = 1; i < termsCount; i++) {
        let stepOk = false;

        for (let t = 0; t < 500; t++) {
            const op = Math.random() < 0.5 ? '+' : '-';

            let result;
            if (digitCount === 1) {
                result = tryGenerateStep_BB_1digit(currentVal, RULES, op);
            } else {
                const curDigits = toDigits(currentVal, digitCount);
                result = tryGenerateStep_BB_Multi(curDigits, digitCount, RULES, op);
            }

            if (!result.ok) continue;
            if (!result.nDigits.some(d => d !== 0)) continue;

            let newVal;
            if (digitCount === 1) {
                newVal = result.newVal;
            } else {
                newVal = fromDigits(result.newDigits);
                if (newVal < 0 || newVal > maxVal) continue;
            }

            for (const s of result.signatures) {
                if (isSignatureStep(s.X, s.op, s.n, modeKey)) hasSignature = true;
            }

            const nValue = fromDigits(result.nDigits);
            parts.push((op === '+' ? '+ ' : '− ') + nValue);
            currentVal = newVal;
            stepOk = true;
            break;
        }

        if (!stepOk) return null;
    }

    if (!hasSignature) return null;
    return { parts, answer: currentVal };
}

// ============ NHÂN / CHIA ============
function genMulQuestion(digit1, digit2) {
    const a = randByDigits(digit1);
    const b = randByDigits(digit2);
    return {
        parts: [String(a), '× ' + b],
        answer: a * b
    };
}

function genDivQuestion(digit1, digit2) {
    const minA = digit1 === 1 ? 1 : Math.pow(10, digit1 - 1);
    const maxA = Math.pow(10, digit1) - 1;
    const minB = digit2 === 1 ? 1 : Math.pow(10, digit2 - 1);
    const maxB = Math.pow(10, digit2) - 1;

    for (let attempt = 0; attempt < 1000; attempt++) {
        const b = rand(minB, maxB);
        const kMin = Math.ceil(minA / b);
        const kMax = Math.floor(maxA / b);
        if (kMin > kMax) continue;

        const k = rand(kMin, kMax);
        const a = b * k;
        return {
            parts: [String(a), '÷ ' + b],
            answer: k
        };
    }

    return { parts: ['12', '÷ 3'], answer: 4 };
}

// ============ DISPATCHER ============
function generateOneQuestion(modeKey, digitCount, termsCount, RULES) {
    const isBB = (modeKey === 'bb+' || modeKey === 'bb-');
    let loopCount = 0;

    while (true) {
        loopCount++;
        const q = isBB
            ? genQuestion_BB_Full(digitCount, termsCount, RULES, modeKey)
            : genQuestion_NoCarry_Full(digitCount, termsCount, RULES, modeKey);

        if (q) return q;

        if (loopCount > 10000) {
            const a = rand(0, 4), b = rand(0, 5);
            return { parts: [String(a), '+ ' + b], answer: a + b };
        }
    }
}