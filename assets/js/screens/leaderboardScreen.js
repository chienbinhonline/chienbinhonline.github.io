/* ============================================================
   LEADERBOARD SCREEN — BXH theo tỉ lệ SoHang / ThoiGian
   ------------------------------------------------------------
   Thứ tự ưu tiên xếp hạng:
     1. Tỉ lệ = SoHang / ThoiGian  → GIẢM DẦN (cao hơn = hạng cao)
     2. Nếu tỉ lệ bằng → PhanTram  → GIẢM DẦN
     3. Nếu PhanTram bằng → SoHang → GIẢM DẦN
   Cột hiển thị: STT | Họ tên | Lớp | Bài tập | Kết quả | Tốc độ
   ============================================================ */

function showLeaderboard() {
  goTo('screen-leaderboard');
  
  const tbody = $('lbBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:#888;">Đang tải...</td></tr>';
  
  fetchLeaderboardFromServer()
    .then(list => renderLeaderboard(list))
    .catch(() => {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:#ef4444;">Lỗi tải dữ liệu</td></tr>';
    });
}

function renderLeaderboard(list) {
  const tbody = $('lbBody');
  if (!tbody) return;
  
  if (!list || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:#888;">Chưa có dữ liệu xếp hạng</td></tr>';
    return;
  }
  
  // ⭐ SẮP XẾP THEO LOGIC
  const ranked = list
    .filter(r => r.rows > 0 && r.displayTime > 0)
    .map(r => ({
      ...r,
      ratio: r.rows / r.displayTime,
      percent: Number(r.percent) || 0,
      rows: Number(r.rows) || 0,
      displayTime: Number(r.displayTime) || 0
    }))
    .sort((a, b) => {
      // Ưu tiên 1: Tỉ lệ SoHang / ThoiGian giảm dần
      if (b.ratio !== a.ratio) return b.ratio - a.ratio;
      // Ưu tiên 2: PhanTram giảm dần
      if (b.percent !== a.percent) return b.percent - a.percent;
      // Ưu tiên 3: SoHang giảm dần
      return b.rows - a.rows;
    });
  
  if (ranked.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:#888;">Chưa có dữ liệu xếp hạng</td></tr>';
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
    
    const ratioStr = r.ratio.toFixed(2);                   // VD: "1.67"
    const result = `${r.rows}/${r.displayTime}s`;          // VD: "10/6s"
    const modeDisplay = r.mode || '—';                     // VD: "[SP]Basic"
    
    return `
      <tr class="${rowClass}">
        <td>${medal}</td>
        <td>${escapeHtml(r.name || '—')}</td>
        <td>${escapeHtml(r.className || '—')}</td>
        <td>${escapeHtml(modeDisplay)}</td>
        <td>${result}</td>
        <td>${ratioStr}</td>
      </tr>
    `;
  }).join('');
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