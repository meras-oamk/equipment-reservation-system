let reservations = { inactive: [], active: [], overdue: [], completed: [] };
let currentTab = 'inactive';

function fmt(datetimeStr) {
    const d = new Date(datetimeStr);
    const time = d.toTimeString().slice(0, 5);
    const date = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    return { time, date };
}

async function loadReservations() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/reservation/my', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        reservations = { inactive: [], active: [], overdue: [], completed: [] };

        const now = new Date();

        data.forEach(r => {
            const start = new Date(r.start_time);
            const end   = new Date(r.end_time);

            const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            const duration = diffDays === 1 ? '1 day' : `${diffDays} days`;

            const s = fmt(r.start_time);
            const e = fmt(r.end_time);

            // Determine display status based on time
            let status;
              const dbStatus = r.status;

                if (dbStatus === 'completed' || dbStatus === 'cancelled' || dbStatus === 'overdue') {
                    status = 'completed';
                } else if (dbStatus === 'active' || dbStatus === 'pending_return') {
                    status = 'active';
                } else {
              // 'approved' — not started yet
                  status = 'inactive';
}                   

            const entry = {
                id:       r.id,
                device:   r.device,
                start:    `${s.time}\n${s.date}`,
                end:      `${e.time}\n${e.date}`,
                duration,
                location: r.pickup_location,
                status
            };

            reservations[status].push(entry);
        });

        updateTabCounts();
        renderTable(currentTab);

    } catch (err) {
        console.error('Failed to load reservations:', err);
    }
}

window.addEventListener('DOMContentLoaded', loadReservations);

    function badgeHtml(status) {
      const map = { inactive: 'badge-inactive', active: 'badge-active', overdue: 'badge-overdue', completed: 'badge-completed' };
      const label = status.charAt(0).toUpperCase() + status.slice(1);
      return `<span class="badge-status ${map[status]}">${label}</span>`;
    }

    function renderTable(tab) {
      const rows = reservations[tab];
      const tbody = document.getElementById('tableBody');
      const mobileList = document.getElementById('mobileList');

      if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i class="bi bi-calendar-x"></i><p>No reservations found.</p></div></td></tr>`;
    mobileList.innerHTML = `<div class="empty-state"><i class="bi bi-calendar-x"></i><p>No reservations found.</p></div>`;
    return;
}

      // Desktop rows — every row navigates to detail on click
      tbody.innerHTML = rows.map(r => {
  const startLines = r.start.split('\n');
  const endLines   = r.end.split('\n');
  return `
    <tr class="clickable" onclick="goToDetail(${r.id})">
      <td><span class="device-name">${r.device}</span></td>
      <td><span class="device-name">#${r.id}</span></td>
      <td>${startLines[0]}<br><span style="color:var(--muted);font-size:0.8rem;">${startLines[1]||''}</span></td>
      <td>${endLines[0]}<br><span style="color:var(--muted);font-size:0.8rem;">${endLines[1]||''}</span></td>
      <td>${r.duration}</td>
      <td>${r.location}</td>
      <td>${badgeHtml(r.status)}</td>
      <td>
        <div class="action-btns">
          <a href="reservationDetails.html?id=${r.id}&status=${r.status}" class="btn-view-icon" onclick="event.stopPropagation()" title="View">
            <i class="bi bi-eye"></i>
          </a>
          <button class="btn-delete-icon" onclick="event.stopPropagation(); deleteRow(${r.id}, '${r.device}')" title="Remove">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </td>
    </tr>`;
}).join('');

      // Mobile cards
      mobileList.innerHTML = rows.map(r => {
  const startLines = r.start.split('\n');
  const endLines   = r.end.split('\n');
  return `
    <div class="mobile-res-card" onclick="goToDetail(${r.id})">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <span class="device-name">${r.device}</span>
        ${badgeHtml(r.status)}
      </div>
      <div class="mobile-meta">
        <span>Reservation ID: <strong>#${r.id}</strong></span>
        <span>Start: <strong>${startLines[0]} ${startLines[1]||''}</strong></span>
        <span>End: <strong>${endLines[0]} ${endLines[1]||''}</strong></span>
        <span>Duration: <strong>${r.duration}</strong></span>
        <span>Location: <strong>${r.location}</strong></span>
      </div>
    </div>`;
}).join('');

    // Attach touch + click listeners to each mobile card
      mobileList.querySelectorAll('.mobile-res-card').forEach(card => {
        let touchMoved = false;
        card.addEventListener('touchstart', () => { touchMoved = false; }, { passive: true });
        card.addEventListener('touchmove',  () => { touchMoved = true;  }, { passive: true });
        card.addEventListener('touchend', (e) => {
          if (!touchMoved) {
            e.preventDefault();
            goToDetail(card.dataset.id);
          }
        });
        card.addEventListener('click', () => goToDetail(card.dataset.id));
      });
    }

    function goToDetail(id) {
      // Find the reservation across all tabs to get its status
      let status = 'inactive';
      for (const tab in reservations) {
        const found = reservations[tab].find(r => r.id == id);
        if (found) { status = found.status; break; }
      }
      window.location.href = `reservationDetails.html?id=${id}&status=${status}`;
    }

    async function deleteRow(id, deviceName) {
    if (!confirm(`Remove the reservation for "${deviceName}"?\nThis cannot be undone.`)) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/reservation/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            alert('Failed to cancel reservation.');
            return;
        }
    } catch (err) {
        alert('Network error.');
        return;
    }

    for (const tab in reservations) {
        reservations[tab] = reservations[tab].filter(r => r.id !== id);
    }
    updateTabCounts();
    renderTable(currentTab);
}

    function updateTabCounts() {
      document.querySelectorAll('.tab-btn').forEach(btn => {
        const tab = btn.dataset.tab;
        const count = reservations[tab].length;
        const label = tab.charAt(0).toUpperCase() + tab.slice(1);
        btn.textContent = `${label} (${count})`;
        if (btn.classList.contains('active')) btn.classList.add('active');
      });
    }

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentTab = this.dataset.tab;
        renderTable(currentTab);
      });
    });

    window.deleteRow = deleteRow;
    window.goToDetail = goToDetail;
