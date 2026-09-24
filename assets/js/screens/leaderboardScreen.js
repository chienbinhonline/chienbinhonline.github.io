/* ============================================================
   LEADERBOARD SCREEN — BXH v2.2
   ------------------------------------------------------------
   Công thức: Tốc độ = (SoHang / ThoiGian) × (PhanTram / 100)
   
   Xếp hạng:
     1. Tốc độ giảm dần
     2. Nếu bằng → PhanTram giảm dần
     3. Nếu vẫn bằng → SoHang giảm dần
     4. Nếu vẫn bằng → Ngày giảm dần (mới hơn xếp trên)
   
   Cột hiển thị: STT | Họ tên | Lớp | Bài tập | Kết quả | Đúng | Tốc độ
   ============================================================ */

function showLeaderboard() {
  goTo('screen-leaderboard');
  
  const tbody = $('lbBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#888;">Đang tải...</td></tr>';
  
  fetchLeaderboardFromServer()
    .then(list => renderLeaderboard(list))
    .catch(() => {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#ef4444;">Lỗi tải dữ liệu</td></tr>';
    });
}

function renderLeaderboard(list) {
  const tbody = $('lbBody');
  if (!tbody) return;
  
  if (!list || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#888;">Chưa có dữ liệu xếp hạng</td></tr>';
    return;
  }
  
  // ⭐ SẮP XẾP THEO CÔNG THỨC MỚI
  const ranked = list
    .filter(r => r.rows > 0 && r.displayTime > 0)
    .map(r => {
      const rows = Number(r.rows) || 0;
      const displayTime = Number(r.displayTime) || 0;
      const percent = Number(r.percent) || 0;
      
      // ⭐ CÔNG THỨC: Tốc độ = (SoHang / ThoiGian) × (PhanTram / 100)
      const speed = (rows / displayTime) * (percent / 100);
      
      return {
        ...r,
        rows: rows,
        displayTime: displayTime,
        percent: percent,
        speed: speed
      };
    })
    .sort((a, b) => {
      // Ưu tiên 1: Tốc độ giảm dần
      if (b.speed !== a.speed) return b.speed - a.speed;
      // Ưu tiên 2: PhanTram giảm dần
      if (b.percent !== a.percent) return b.percent - a.percent;
      // Ưu tiên 3: SoHang giảm dần
      if (b.rows !== a.rows) return b.rows - a.rows;
      // Ưu tiên 4: Ngày mới hơn xếp trên
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });
  
  if (ranked.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#888;">Chưa có dữ liệu xếp hạng</td></tr>';
    return;
  }
  
  // Lấy top 50
  const top = ranked.slice(0, 50);
  
  tbody.innerHTML = top.map((r, i) => {
    const rank = i + 1;
    let rowClass = '';
    let medal = rank;
    if (rank === 1)      { rowClass = 'lb-row-top1'; medal = '<span class="lb-medal">🥇</span>'; }
    else if (rank === 2) { rowClass = 'lb-row-top2'; medal = '<span class="lb-medal">🥈</span>'; }
    else if (rank === 3) { rowClass = 'lb-row-top3'; medal = '<span class="lb-medal">🥉</span>'; }
    
    const speedStr = r.speed.toFixed(2);                    // VD: "3.00"
    const result = `${r.rows}/${r.displayTime}s`;           // VD: "20/6s"
    const modeDisplay = r.mode || '—';                      // VD: "[SP]Basic"
    const percentStr = `${r.percent}%`;                     // VD: "90%"
    
    return `
      <tr class="${rowClass}">
        <td>${medal}</td>
        <td>${escapeHtml(r.name || '—')}</td>
        <td>${escapeHtml(r.className || '—')}</td>
        <td>${escapeHtml(modeDisplay)}</td>
        <td>${result}</td>
        <td>${percentStr}</td>
        <td>${speedStr}</td>
      </tr>
    `;
  }).join('');
  
  // ⭐ Cập nhật subtitle
  const subtitle = $('lbSubtitle');
  if (subtitle) {
    if (ranked.length > 50) {
      subtitle.textContent = `Top 50 trên tổng ${ranked.length} kết quả — Tốc độ = (Số hàng / Thời gian) × Độ chính xác`;
    } else {
      subtitle.textContent = `${ranked.length} kết quả — Tốc độ = (Số hàng / Thời gian) × Độ chính xác`;
    }
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
