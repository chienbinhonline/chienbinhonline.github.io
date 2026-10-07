/* ============================================================
   EVENT CONFIG — Cấu hình sự kiện
   Để thêm sự kiện mới, chỉ cần thêm object vào EVENTS array
   ============================================================ */

const EVENTS = [
  {
    id: 'streak',
    name: 'STREAK CHALLENGE',
    tagline: 'Luyện tập mỗi ngày - Xây chuỗi bất tận',
    icon: '🔥',
    iconEmoji: '🔥',
    color: '#f59e0b',
    colorGradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    dataAction: 'getEventData',         // Action gọi API
    minDisplay: 2,                       // Chỉ hiện chuỗi >= 2
    columns: [
      { key: 'rank',  label: 'STT',       width: '60px', align: 'center' },
      { key: 'name',  label: 'Học viên',  width: 'auto', align: 'left' },
      { key: 'class', label: 'Lớp',       width: '100px', align: 'left' },
      { key: 'value', label: 'Chuỗi',     width: '100px', align: 'right' }
    ],
    // Hàm so sánh để sắp xếp (giảm dần)
    sortFn: (a, b) => (b.streak || 0) - (a.streak || 0),
    // Hàm render giá trị của cột "value"
    valueRenderer: (item) => `${item.streak} 🔥`
  }
  // ⭐ Thêm sự kiện mới ở đây — copy format trên
];

/* Hàm lấy sự kiện theo id */
function getEventById(id) {
  return EVENTS.find(e => e.id === id) || EVENTS[0];
}
