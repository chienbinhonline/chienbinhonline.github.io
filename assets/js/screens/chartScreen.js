/* ============================================================
   CHART SCREEN — Biểu đồ 7 ngày gần nhất
   V2.2: Nối toàn bộ điểm theo thời gian bằng đường cam
   ============================================================ */

function showResultChart() {
  goTo('screen-chart');
  
  const phone = getStudentPhone();
  if (phone) {
    syncHistoryFromServer().then(() => {
      setTimeout(() => renderChart(), 100);
    });
  } else {
    setTimeout(() => renderChart(), 100);
  }
}

function renderChart() {
  const canvas = $('chartCanvas');
  if (!canvas) return;
  
  const container = canvas.parentElement;
  const W = container.clientWidth - 32;
  const H = container.clientHeight - 32;
  
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);
  
  const P = { top: 30, right: 30, bottom: 50, left: 55 };
  const chartW = W - P.left - P.right;
  const chartH = H - P.top - P.bottom;
  
  // 7 ngày gần nhất
  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    days.push({
      date: d,
      label: dd + '-' + mm,
      key: d.getFullYear() + '-' + mm + '-' + dd
    });
  }
  
  // Vẽ nền
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(P.left, P.top, chartW, chartH);
  
  // ===== TRỤC Y =====
  ctx.font = '11px Segoe UI';
  ctx.fillStyle = '#666';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  
  const yValues = [0, 20, 40, 60, 80, 100];
  yValues.forEach(val => {
    const y = P.top + chartH - (val / 100) * chartH;
    
    ctx.beginPath();
    ctx.moveTo(P.left, y);
    ctx.lineTo(P.left + chartW, y);
    ctx.strokeStyle = val === 0 ? '#9ca3af' : '#f0f0f0';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillStyle = '#666';
    ctx.fillText(val + '%', P.left - 8, y);
  });
  
  // ===== TRỤC X =====
  const stepX = chartW / Math.max(1, days.length - 1);
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  days.forEach((day, i) => {
    const x = P.left + i * stepX;
    
    ctx.beginPath();
    ctx.moveTo(x, P.top + chartH);
    ctx.lineTo(x, P.top + chartH + 5);
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillStyle = '#666';
    ctx.font = '10px Segoe UI';
    ctx.fillText(day.label, x, P.top + chartH + 10);
  });
  
  ctx.font = 'bold 12px Segoe UI';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Ngày', P.left + chartW / 2, P.top + chartH + 28);
  
  // ===== DỮ LIỆU =====
  const history = getHistory();
  
  const cutoff = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const validHistory = history.filter(rec => {
    if (!rec.date) return false;
    const recDate = new Date(rec.date);
    if (recDate < cutoff) return false;
    const mode = String(rec.mode || '');
    if (mode.includes('Flash')) return false;
    if (rec.isTest === true) return false;
    return true;
  });
  
  console.log('📊 Biểu đồ:', validHistory.length, 'điểm dữ liệu');
  
  if (validHistory.length === 0) {
    ctx.font = '14px Segoe UI';
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Chưa có dữ liệu luyện tập', P.left + chartW / 2, P.top + chartH / 2);
    renderLegend([]);
    return;
  }
  
  // Group theo (ngày, mode)
  const grouped = {};
  validHistory.forEach(rec => {
    const recDate = new Date(rec.date);
    const dd = String(recDate.getDate()).padStart(2, '0');
    const mm = String(recDate.getMonth() + 1).padStart(2, '0');
    const key = recDate.getFullYear() + '-' + mm + '-' + dd;
    const groupKey = key + '|' + rec.mode;
    
    if (!grouped[groupKey]) {
      grouped[groupKey] = { dayKey: key, mode: rec.mode, values: [] };
    }
    grouped[groupKey].values.push(rec.percent);
  });
  
  // ===== CHUẨN BỊ MẢNG ĐIỂM ĐỂ VẼ =====
  const allPoints = [];
  
  Object.values(grouped).forEach(group => {
    const dayIdx = days.findIndex(d => d.key === group.dayKey);
    if (dayIdx < 0) return;
    
    const x = P.left + dayIdx * stepX;
    const avg = Math.round(group.values.reduce((a,b) => a + b, 0) / group.values.length);
    const y = P.top + chartH - (avg / 100) * chartH;
    
    allPoints.push({
      x, y, avg, dayIdx,
      mode: group.mode,
      color: getModeColor(group.mode),
      symbol: getModeSymbol(group.mode)
    });
  });
  
  // ⭐ Sort tất cả điểm theo thời gian (dayIdx tăng dần)
  allPoints.sort((a, b) => {
    if (a.dayIdx !== b.dayIdx) return a.dayIdx - b.dayIdx;
    return 0; // cùng ngày thì giữ nguyên thứ tự
  });
  
  // ⭐ VẼ ĐƯỜNG NỐI TẤT CẢ ĐIỂM — MÀU CAM
  if (allPoints.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(allPoints[0].x, allPoints[0].y);
    
    for (let k = 1; k < allPoints.length; k++) {
      ctx.lineTo(allPoints[k].x, allPoints[k].y);
    }
    
    ctx.strokeStyle = '#FF8C00';    // ⭐ Cam đậm (DarkOrange)
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.65;         // Mờ 65% để không đè chấm
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }
  
  // ===== VẼ CÁC ĐIỂM (chấm + % + symbol) =====
  allPoints.forEach(p => {
    // Vẽ chấm trắng
    ctx.beginPath();
    ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
    
    // Vẽ symbol màu theo mode
    ctx.font = 'bold 20px Segoe UI';
    ctx.fillStyle = p.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.symbol, p.x, p.y);
    
    // Vẽ % phía trên
    ctx.font = 'bold 10px Segoe UI';
    ctx.fillStyle = p.color;
    ctx.textBaseline = 'bottom';
    ctx.fillText(p.avg + '%', p.x, p.y - 14);
  });
  
  renderLegend(validHistory);
}

function renderLegend(history) {
  const legendEl = $('chartLegend');
  if (!legendEl) return;
  
  const uniqueModes = [...new Set(history.map(r => r.mode))];
  const modesToShow = uniqueModes.length > 0 ? uniqueModes : Object.keys(MODE_SYMBOLS);
  
  legendEl.innerHTML = modesToShow.map(mode => {
    const color = getModeColor(mode);
    const symbol = getModeSymbol(mode);
    const name = getModeName(mode);
    return `
      <div class="legend-item">
        <span class="legend-icon" style="color:${color};">${symbol}</span>
        <span>${name}</span>
      </div>
    `;
  }).join('');
}

window.addEventListener('resize', () => {
  if ($('screen-chart').classList.contains('active')) {
    clearTimeout(window._chartResizeTimer);
    window._chartResizeTimer = setTimeout(renderChart, 200);
  }
});
