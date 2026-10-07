/* ============================================================
   EVENT SCREEN — Màn hình sự kiện
   Hiển thị bảng xếp hạng sự kiện (mặc định: streak)
   ============================================================ */

let currentEventId = 'streak';   // Sự kiện đang hiển thị

/* ============ MỞ MÀN HÌNH SỰ KIỆN ============ */
function showEvent(eventId) {
  if (eventId) currentEventId = eventId;
  
  const event = getEventById(currentEventId);
  if (!event) return;
  
  // Cập nhật UI theo config
  updateEventUI(event);
  
  goTo('screen-event');
  
  const tbody = $('eventBody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="${event.columns.length}" style="text-align:center;padding:24px;color:#888;">Đang tải...</td></tr>`;
  
  fetchEventData(event)
    .then(list => renderEventTable(list, event))
    .catch(err => {
      console.error('❌ Lỗi tải sự kiện:', err);
      tbody.innerHTML = `<tr><td colspan="${event.columns.length}" style="text-align:center;padding:24px;color:#ef4444;">Lỗi tải dữ liệu</td></tr>`;
    });
}

/* ============ CẬP NHẬT UI THEO CONFIG ============ */
function updateEventUI(event) {
  // Tên sự kiện
  const nameEl = $('eventName');
  if (nameEl) nameEl.textContent = event.name;
  
  // Icon
  const iconEl = $('eventIcon');
  if (iconEl) iconEl.textContent = event.iconEmoji || '🔥';
  
  // Tagline
  const taglineEl = $('eventTagline');
  if (taglineEl) taglineEl.textContent = event.tagline;
  
  // Màu chủ đề
  const headerEl = $('eventHeader');
  if (headerEl) headerEl.style.background = event.colorGradient;
  
  // Render cột
  const theadRow = $('eventTheadRow');
  if (theadRow) {
    theadRow.innerHTML = event.columns.map(col => 
      `<th style="width:${col.width};text-align:${col.align};">${col.label}</th>`
    ).join('');
  }
}

/* ============ GỌI API ============ */
function fetchEventData(event) {
  if (!API_URL) return Promise.resolve([]);
  
  console.log('🔥 Đang tải sự kiện:', event.id);
  
  const url = API_URL + '?action=' + encodeURIComponent(event.dataAction);
  
  return fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        const list = data.event || [];
        console.log('✅ Nhận', list.length, 'bản ghi sự kiện');
        return list;
      }
      console.warn('⚠️ Sự kiện lỗi:', data.message);
      return [];
    })
    .catch(err => {
      console.warn('⚠️ Lỗi tải sự kiện:', err);
      return [];
    });
}

/* ============ RENDER BẢNG ============ */
function renderEventTable(list, event) {
  const tbody = $('eventBody');
  if (!tbody) return;
  
  const colCount = event.columns.length;
  
  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center;padding:24px;color:#888;">Chưa có dữ liệu sự kiện</td></tr>`;
    return;
  }
  
  // Sắp xếp
  const ranked = list.slice().sort(event.sortFn);
  
  // Render
  tbody.innerHTML = ranked.map((item, i) => {
    const rank = i + 1;
    let rowClass = '';
    let medal = rank;
    if (rank === 1)      { rowClass = 'event-row-top1'; medal = '<span class="event-medal">🥇</span>'; }
    else if (rank === 2) { rowClass = 'event-row-top2'; medal = '<span class="event-medal">🥈</span>'; }
    else if (rank === 3) { rowClass = 'event-row-top3'; medal = '<span class="event-medal">🥉</span>'; }
    
    // Tạo các ô dữ liệu dựa vào cột
    const cells = event.columns.map((col, idx) => {
      let content = '';
      if (idx === 0) content = medal;                          // Cột rank
      else if (idx === 1) content = escapeHtmlEvent(item.name || '—');
      else if (idx === 2) content = escapeHtmlEvent(item.className || '—');
      else content = event.valueRenderer ? event.valueRenderer(item) : '';
      
      const align = col.align || 'left';
      return `<td style="text-align:${align};">${content}</td>`;
    }).join('');
    
    return `<tr class="${rowClass}">${cells}</tr>`;
  }).join('');
  
  // Cập nhật subtitle
  const subtitleEl = $('eventSubtitle');
  if (subtitleEl) {
    subtitleEl.textContent = `Top ${ranked.length} học viên có chuỗi >= ${event.minDisplay} ngày`;
  }
}

/* ============ HELPER ============ */
function escapeHtmlEvent(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
