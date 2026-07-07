let reservations = { inactive: [], active: [], overdue: [], completed: [] };
let currentTab = 'inactive';

function fmt(datetimeStr) {
    const [datePart, timePart] = datetimeStr.split(/[T ]/); // handles both "T" and space separator
    const [year, month, day] = datePart.split('-');
    const time = timePart.slice(0, 5);
    const date = `${day}/${month}/${year}`;
    return { time, date };
}

async function loadReservations() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/reservation/my', {
    headers: { 'Authorization': `Bearer ${token}` }
});
const data = await res.json();

if (!res.ok || !Array.isArray(data)) {
    console.error('Failed to load reservations:', data.error || data);
    if (data.error === 'Invalid or expired token.') {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = '../../index.html';
    }
    return;
}

reservations = { inactive: [], active: [], overdue: [], completed: [] };

const now = new Date();

data.forEach(r => {
    const start = new Date(r.start_time);
    const end   = new Date(r.end_time);

    const dbStatus = r.status;
    const now = new Date();

    // Skip cancelled (auto-cancelled no-shows) entirely — not shown in any tab
    if (dbStatus === 'cancelled') {
        return;
    }

    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const duration = diffDays === 1 ? '1 day' : `${diffDays} days`;

    const s = fmt(r.start_time);
    const e = fmt(r.end_time);

    let tabStatus, displayStatus;

    if (dbStatus === 'completed') {
        tabStatus = 'completed';
        displayStatus = 'completed';
    }
    else if (dbStatus === 'pending_return') {
        tabStatus = 'completed';
        displayStatus = 'pending_approval';
    }
    else if (dbStatus === 'overdue') {
        tabStatus = 'overdue';
        displayStatus = 'overdue';
    }
    else if (dbStatus === 'active') {
        tabStatus = end < now ? 'overdue' : 'active';
        displayStatus = tabStatus;
    }
    else {
        tabStatus = 'inactive';
        displayStatus = 'inactive';
    }

    const entry = {
        id:       r.id,
        device:   r.device,
        start:    `${s.time}\n${s.date}`,
        end:      `${e.time}\n${e.date}`,
        duration,
        location: r.pickup_location,
        status:   tabStatus,
        displayStatus
    };

    reservations[tabStatus].push(entry);
});

        updateTabCounts();
        renderTable(currentTab);

    } catch (err) {
        console.error('Failed to load reservations:', err);
    }
}

window.addEventListener('DOMContentLoaded', loadReservations);

    function badgeHtml(status) {
    const map = {
        inactive: 'badge-inactive',
        active: 'badge-active',
        overdue: 'badge-overdue',
        completed: 'badge-completed',
        pending_approval: 'badge-pending-approval'
    };
    const label = status === 'pending_approval'
        ? 'Pending Approval'
        : status.charAt(0).toUpperCase() + status.slice(1);
    return `<span class="badge-status ${map[status]}">${label}</span>`;
}

function renderTable(tab) {
  const rows = reservations[tab];
  const tbody = document.getElementById('tableBody');
  const mobileList = document.getElementById('mobileList');
  const isCompleted = tab === 'completed';
  const showDeleteBtn = tab === 'inactive'; // only allow cancelling before pickup

  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><i class="bi bi-calendar-x"></i><p>No reservations found.</p></div></td></tr>`;
    mobileList.innerHTML = `<div class="empty-state"><i class="bi bi-calendar-x"></i><p>No reservations found.</p></div>`;
    return;
  }

  // Desktop rows
  tbody.innerHTML = rows.map(r => {
    const startLines = r.start.split('\n');
    const endLines   = r.end.split('\n');
    return `
      <tr class="${isCompleted ? '' : 'clickable'}" ${isCompleted ? '' : `onclick="goToDetail(${r.id})"`}>
        <td><span class="device-name">${r.device}</span></td>
        <td><span class="device-name">#${r.id}</span></td>
        <td>${startLines[0]}<br><span style="color:var(--muted);font-size:0.8rem;">${startLines[1]||''}</span></td>
        <td>${endLines[0]}<br><span style="color:var(--muted);font-size:0.8rem;">${endLines[1]||''}</span></td>
        <td>${r.duration}</td>
        <td>1</td>
        <td>${r.location}</td>
        <td>${badgeHtml(r.displayStatus)}</td>
        <td>
          <div class="action-btns">
            ${isCompleted ? '' : `
            <a href="reservationDetails.html?id=${r.id}&status=${r.status}" class="btn-view-icon" onclick="event.stopPropagation()" title="View">
              <i class="bi bi-eye"></i>
            </a>`}
            ${showDeleteBtn ? `
            <button class="btn-delete-icon" onclick="event.stopPropagation(); deleteRow(${r.id}, '${r.device}')" title="Cancel Reservation">
              <i class="bi bi-x-lg"></i>
            </button>` : ''}
          </div>
        </td>
      </tr>`;
  }).join('');

  // Mobile cards
  mobileList.innerHTML = rows.map(r => {
    const startLines = r.start.split('\n');
    const endLines   = r.end.split('\n');
    return `
       <div class="mobile-res-card${isCompleted ? ' not-clickable' : ''}" data-id="${r.id}">
        <div class="mobile-card-header">
          <span class="device-name">${r.device}</span>
          ${badgeHtml(r.displayStatus)}
        </div>
        <div class="mobile-meta">
          <span>ID: <strong>#${r.id}</strong></span>
          <span>Duration: <strong>${r.duration}</strong></span>
          <span>Start: <strong>${startLines[0]} ${startLines[1]||''}</strong></span>
          <span>End: <strong>${endLines[0]} ${endLines[1]||''}</strong></span>
          <span class="mobile-meta-full">Location: <strong>${r.location}</strong></span>
        </div>
      </div>`;
  }).join('');

  // Attach touch + click listeners to each mobile card (skip for completed tab)
  if (!isCompleted) {
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
