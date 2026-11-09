function showReportScreen() {
  goTo('screen-report');
  
  const tbody = $('reportBody');
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;">Đang tải danh sách...</td></tr>';
  
  const phone = getStudentPhone();
  
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'getTeacherStudents', phone: phone })
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === 'success') {
      renderReportTable(data.students, data.level);
    } else {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:red;">Lỗi: ${data.message}</td></tr>`;
    }
  })
  .catch(() => {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:red;">Lỗi kết nối Server</td></tr>';
  });
}

function renderReportTable(students, level) {
  const tbody = $('reportBody');
  const subtitle = $('reportSubtitle');
  
  subtitle.textContent = `Cấp độ phụ trách: ${level} — Tổng: ${students.length} học viên`;
  
  if (!students || students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:#888;">Lớp chưa có học viên nào</td></tr>';
    return;
  }
  
  tbody.innerHTML = students.map((st, i) => `
    <tr>
      <td style="text-align:center;font-weight:700;color:#666;">${i + 1}</td>
      <td style="font-weight:700;">${st.name}</td>
      <td style="color:#667eea;">${st.phone}</td>
      <td style="text-align:center;">
        <!-- ⭐ SỬA DÒNG DƯỚI ĐÂY ĐỂ TRUYỀN THÊM st.name -->
        <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px; border-radius: 8px;" onclick="viewStudentChart('${st.phone}', '${st.name.replace(/'/g, "\\'")}')">Xem KQ</button>
      </td>
    </tr>
  `).join('');
}

function viewStudentChart(phone, name) {
  showResultChart(phone, name);
}
