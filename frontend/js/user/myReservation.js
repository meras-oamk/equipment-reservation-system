const reservations = {
      inactive: [
        { id: 1, device: 'NewBeeDrone Replacement', start: '12:00\n12/06/2026', end: '18:00\n15/06/2026', duration: '4 days', location: 'Linnanmaa Kirjasto', status: 'inactive' },
        { id: 2, device: 'NewBeeDrone Replacement', start: '12:00\n12/06/2026', end: '18:00\n15/06/2026', duration: '4 days', location: 'Linnanmaa Kirjasto', status: 'inactive' },
        { id: 3, device: 'NewBeeDrone Replacement', start: '12:00\n12/06/2026', end: '18:00\n15/06/2026', duration: '4 days', location: 'Linnanmaa Kirjasto', status: 'inactive' },
        { id: 4, device: 'NewBeeDrone Replacement', start: '12:00\n12/06/2026', end: '18:00\n15/06/2026', duration: '4 days', location: 'Linnanmaa Kirjasto', status: 'inactive' },
      ],
      active: [
        { id: 5, device: 'NewBeeDrone Replacement', start: '09:00\n10/06/2026', end: '18:00\n12/06/2026', duration: '2 days', location: 'Oulu City Library', status: 'active' },
      ],
      expired: [
        { id: 6, device: 'NewBeeDrone Replacement', start: '08:00\n01/06/2026', end: '18:00\n03/06/2026', duration: '2 days', location: 'Ritaharju Library', status: 'expired' },
        { id: 7, device: 'NewBeeDrone Replacement', start: '10:00\n05/06/2026', end: '17:00\n07/06/2026', duration: '2 days', location: 'Linnanmaa Kirjasto', status: 'expired' },
      ],
    };

    let currentTab = 'inactive';

    function badgeHtml(status) {
      const map = { inactive: 'badge-inactive', active: 'badge-active', expired: 'badge-expired' };
      const label = status.charAt(0).toUpperCase() + status.slice(1);
      return `<span class="badge-status ${map[status]}">${label}</span>`;
    }

    function renderTable(tab) {
      const rows = reservations[tab];
      const tbody = document.getElementById('tableBody');
      const mobileList = document.getElementById('mobileList');

      if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="bi bi-calendar-x"></i><p>No reservations found.</p></div></td></tr>`;
        mobileList.innerHTML = `<div class="empty-state"><i class="bi bi-calendar-x"></i><p>No reservations found.</p></div>`;
        return;
      }

      // Desktop rows
      tbody.innerHTML = rows.map(r => {
        const startLines = r.start.split('\n');
        const endLines   = r.end.split('\n');
        const isClickable = r.status === 'inactive';
        return `
          <tr class="${isClickable ? 'clickable' : ''}" ${isClickable ? `onclick="goToDetail(${r.id})"` : ''}>
            <td><span class="device-name">${r.device}</span></td>
            <td>${startLines[0]}<br><span style="color:var(--muted);font-size:0.8rem;">${startLines[1]||''}</span></td>
            <td>${endLines[0]}<br><span style="color:var(--muted);font-size:0.8rem;">${endLines[1]||''}</span></td>
            <td>${r.duration}</td>
            <td>${r.location}</td>
            <td>${badgeHtml(r.status)}</td>
            <td>
              <div class="action-btns">
                <a href="reservationAction.html?id=${r.id}" class="btn-view-icon" onclick="event.stopPropagation()" title="View">
                  <i class="bi bi-eye"></i>
                </a>
                <button class="btn-delete-icon" onclick="event.stopPropagation(); deleteRow(${r.id})" title="Cancel">
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
              <span>Start: <strong>${startLines[0]} ${startLines[1]||''}</strong></span>
              <span>End: <strong>${endLines[0]} ${endLines[1]||''}</strong></span>
              <span>Duration: <strong>${r.duration}</strong></span>
              <span>Location: <strong>${r.location}</strong></span>
            </div>
          </div>`;
      }).join('');
    }

    function goToDetail(id) {
      window.location.href = `reservation-detail.html?id=${id}`;
    }

    function deleteRow(id) {
      for (const tab in reservations) {
        reservations[tab] = reservations[tab].filter(r => r.id !== id);
      }
      renderTable(currentTab);
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

    // Initial render
    renderTable(currentTab);