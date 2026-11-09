function showResultChart(targetPhone = null, targetName = null) {
  window._viewingPhone = targetPhone || getStudentPhone(); 
  goTo('screen-chart');
  
  // ⭐ CẬP NHẬT TIÊU ĐỀ THÔNG MINH
  const titleEl = document.querySelector('#screen-chart .chart-title');
  if (titleEl) {
    if (targetName && targetName.trim() !== "" && targetName !== "undefined") {
      titleEl.textContent = `Kết quả: ${targetName}`; // Hiển thị Tên
    } else if (targetPhone && targetPhone !== getStudentPhone()) {
      titleEl.textContent = `Kết quả: ${targetPhone}`; // Fallback: Hiện SĐT
    } else {
      titleEl.textContent = 'Kết quả của bạn'; // Học viên tự xem
    }
  }

  if (window._viewingPhone) {
    if (targetPhone && targetPhone !== getStudentPhone()) {
      const legendEl = $('chartLegend');
      if(legendEl) legendEl.innerHTML = '<div style="text-align:center;width:100%;">Đang tải dữ liệu...</div>';
      
      fetch(API_URL + '?action=getHistory&phone=' + encodeURIComponent(targetPhone))
        .then(res => res.json())
        .then(data => {
          if(data.status === 'success') renderChart(data.history);
        }).catch(() => alert('Lỗi tải dữ liệu học viên'));
    } else {
      syncHistoryFromServer().then(() => {
        setTimeout(() => renderChart(null), 100);
      });
    }
  }
}

// (Các hàm renderChart và renderLegend bên dưới giữ nguyên)
function renderChart(historyData = null) {
  const canvas = $('chartCanvas');
  if (!canvas) return;
  
  const container = canvas.parentElement;
  const cs = getComputedStyle(container);
  const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  const W = container.clientWidth - padX;
  const H = container.clientHeight - padY;
  
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
  
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(P.left, P.top, chartW, chartH);
  
  ctx.font = '11px Segoe UI';
  ctx.fillStyle = '#666';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  
  const yValues = [0, 20, 40, 60, 80, 100];
  yValues.forEach(val => {
    const y = P.top + chartH - (val / 100) * chartH;
    ctx.beginPath(); ctx.moveTo(P.left, y); ctx.lineTo(P.left + chartW, y);
    ctx.strokeStyle = val === 0 ? '#9ca3af' : '#f0f0f0'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#666'; ctx.fillText(val + '%', P.left - 8, y);
  });
  
  const stepX = chartW / Math.max(1, days.length - 1);
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  
  days.forEach((day, i) => {
    const x = P.left + i * stepX;
    ctx.beginPath(); ctx.moveTo(x, P.top + chartH); ctx.lineTo(x, P.top + chartH + 5);
    ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#666'; ctx.font = '10px Segoe UI'; ctx.fillText(day.label, x, P.top + chartH + 10);
  });
  
  ctx.font = 'bold 12px Segoe UI'; ctx.fillStyle = '#333'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('Ngày', P.left + chartW / 2, P.top + chartH + 28);
  
  // Lấy dữ liệu từ tham số truyền vào hoặc LocalStorage
  const history = historyData || getHistory();
  const cutoff = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const validHistory = history.filter(rec => {
    if (!rec.date) return false;
    if (new Date(rec.date) < cutoff) return false;
    if (String(rec.mode || '').includes('Flash')) return false;
    if (rec.isTest === true) return false;
    return true;
  });
  
  if (validHistory.length === 0) {
    ctx.font = '14px Segoe UI'; ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Chưa có dữ liệu luyện tập', P.left + chartW / 2, P.top + chartH / 2);
    renderLegend([]);
    return;
  }
  
  const grouped = {};
  validHistory.forEach(rec => {
    const recDate = new Date(rec.date);
    const dd = String(recDate.getDate()).padStart(2, '0');
    const mm = String(recDate.getMonth() + 1).padStart(2, '0');
    const key = recDate.getFullYear() + '-' + mm + '-' + dd;
    const groupKey = key + '|' + rec.mode;
    
    if (!grouped[groupKey]) grouped[groupKey] = { dayKey: key, mode: rec.mode, values: [] };
    grouped[groupKey].values.push(rec.percent);
  });
  
  const allPoints = [];
  Object.values(grouped).forEach(group => {
    const dayIdx = days.findIndex(d => d.key === group.dayKey);
    if (dayIdx < 0) return;
    
    const avg = Math.round(group.values.reduce((a,b) => a + b, 0) / group.values.length);
    const x = P.left + dayIdx * stepX;
    const y = P.top + chartH - (avg / 100) * chartH;
    
    allPoints.push({
      x, y, avg, dayIdx,
      mode: group.mode, color: getModeColor(group.mode), symbol: getModeSymbol(group.mode)
    });
  });
  
  allPoints.sort((a, b) => a.dayIdx - b.dayIdx);
  
  if (allPoints.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(allPoints[0].x, allPoints[0].y);
    for (let k = 1; k < allPoints.length; k++) ctx.lineTo(allPoints[k].x, allPoints[k].y);
    ctx.strokeStyle = '#FF8C00'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.globalAlpha = 0.65; ctx.stroke(); ctx.globalAlpha = 1.0;
  }
  
  allPoints.forEach(p => {
    ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
    ctx.font = 'bold 20px Segoe UI'; ctx.fillStyle = p.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.symbol, p.x, p.y);
    ctx.font = 'bold 10px Segoe UI'; ctx.fillStyle = p.color; ctx.textBaseline = 'bottom'; ctx.fillText(p.avg + '%', p.x, p.y - 14);
  });
  
  renderLegend(validHistory);
}

function renderLegend(history) {
  const legendEl = $('chartLegend');
  if (!legendEl) return;
  
  const uniqueModes = [...new Set(history.map(r => r.mode))];
  const modesToShow = uniqueModes.length > 0 ? uniqueModes : Object.keys(MODE_SYMBOLS);
  
  legendEl.innerHTML = modesToShow.map(mode => `
    <div class="legend-item">
      <span class="legend-icon" style="color:${getModeColor(mode)};">${getModeSymbol(mode)}</span>
      <span>${getModeName(mode)}</span>
    </div>
  `).join('');
}

window.addEventListener('resize', () => {
  if ($('screen-chart').classList.contains('active')) {
    clearTimeout(window._chartResizeTimer);
    window._chartResizeTimer = setTimeout(() => renderChart(null), 200);
  }
});
