/* ============================================================
   LEADERBOARD SCREEN — BXH v2.3
   ------------------------------------------------------------
   Công thức: Tốc độ = (SoHang / ThoiGian) × (PhanTram / 100)
   
   Logic:
     1. Tính speed cho mỗi record
     2. Group theo học viên (name + className)
     3. Mỗi học viên chỉ giữ 1 record có speed cao nhất
     4. Sort giảm dần theo speed
     5. Hiển thị top 10
   
   Cột: STT | Họ tên | Lớp | Bài tập | Kết quả | Đúng | Tốc độ
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
  
  // ===== BƯỚC 1: Tính speed cho mỗi record =====
  const withSpeed = list
    .filter(r => r.rows > 0 && r.displayTime > 0)
    .map(r => {
      const rows = Number(r.rows) || 0;
      const displayTime = Number(r.displayTime) || 0;
      const percent = Number(r.percent) || 0;
      const speed = (rows / displayTime) * (percent / 100);
      
      return {
        ...r,
        rows: rows,
        displayTime: displayTime,
        percent: percent,
        speed: speed
      };
    });
  
  // ===== BƯỚC 2: Group theo học viên =====
  // Key định danh: name + className (lowercase, trim)
  const bestByStudent = {};
  
  withSpeed.forEach(r => {
    const key = `${String(r.name || '').trim().toLowerCase()}||${String(r.className || '').trim().toLowerCase()}`;
    
    if (!bestByStudent[key]) {
      bestByStudent[key] = r;
      return;
    }
    
    const current = bestByStudent[key];
    
    // So sánh: speed cao hơn thắng
    if (r.speed > current.speed) {
      bestByStudent[key] = r;
    } else if (r.speed === current.speed) {
      // Bằng speed → ưu tiên percent cao hơn
      if (r.percent > current.percent) {
        bestByStudent[key] = r;
      } else if (r.percent === current.percent) {
        // Bằng percent → ưu tiên rows cao hơn
        if (r.rows > current.rows) {
          bestByStudent[key] = r;
        }
      }
    }
  });
  
  // ===== BƯỚC 3: Chuyển thành array + sort =====
  const ranked = Object.values(bestByStudent).sort((a, b) => {
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
  
  // ===== BƯỚC 4: Lấy top 10 =====
  const top = ranked.slice(0, 10);
  
  // ===== BƯỚC 5: Render =====
  tbody.innerHTML = top.map((r, i) => {
    const rank = i + 1;
    let rowClass = '';
    let medal = rank;
    if (rank === 1)      { rowClass = 'lb-row-top1'; medal = '<span class="lb-medal">🥇</span>'; }
    else if (rank === 2) { rowClass = 'lb-row-top2'; medal = '<span class="lb-medal">🥈</span>'; }
    else if (rank === 3) { rowClass = 'lb-row-top3'; medal = '<span class="lb-medal">🥉</span>'; }
    
    const speedStr = r.speed.toFixed(2);
    const result = `${r.rows}/${r.displayTime}s`;
    const modeDisplay = r.mode || '—';
    const percentStr = `${r.percent}%`;
    
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
    const totalStudents = ranked.length;
    subtitle.textContent = `Top 10 trên tổng ${totalStudents} học viên — Tốc độ = (Số hàng / Thời gian) × Độ chính xác`;
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
