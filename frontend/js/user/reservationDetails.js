document.addEventListener('DOMContentLoaded', async function () {

  const splitBtn       = document.getElementById('splitBtn');
  const actionDropdown = document.getElementById('actionDropdown');

  // ── READ ID AND STATUS FROM URL ──
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  
  

  // ── FETCH AND POPULATE RESERVATION DETAILS ──
  if (id) {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/reservation/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const r = await res.json();

        let displayStatus;

const now = new Date();
const endTime = new Date(r.end_time);

if (r.status === 'approved') {
    displayStatus = 'inactive';
}
else if (r.status === 'pending_return') {
    displayStatus = 'pending approval';
}
else if (r.status === 'overdue') {
    displayStatus = 'overdue';
}
else if (r.status === 'active') {
    displayStatus = endTime < now ? 'overdue' : 'active';
}
else {
    displayStatus = 'completed';
}

        const status = r.status;

const badgeEl = document.getElementById('detail-status-badge');

if (displayStatus === 'pending approval') {
    badgeEl.className = 'badge-pending-approval';
} else {
    badgeEl.className = `badge-${displayStatus}`;
}

badgeEl.textContent =
    displayStatus
        .split(' ')
        .map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join(' ');

    if (displayStatus === 'inactive') {
    const returnOption = document.querySelector(
        '.action-option[data-href="reservationAction_checkout.html"]'
    );

    if (returnOption) {
        returnOption.classList.add('disabled');
        returnOption.removeAttribute('data-href');
    }
}

if (displayStatus === 'active' || displayStatus === 'overdue') {
    const pickupOption = document.querySelector(
        '.action-option[data-href="reservationAction_checkin.html"]'
    );

    if (pickupOption) {
        pickupOption.classList.add('disabled');
        pickupOption.removeAttribute('data-href');
    }
}

        function fmt(datetimeStr) {
    const [datePart, timePart] = datetimeStr.split(/[T ]/);
    const [year, month, day] = datePart.split('-');
    const time = timePart.slice(0, 5);
    const date = `${day}/${month}/${year}`;
    return { time, date };
}

        const start = fmt(r.start_time);
        const end   = fmt(r.end_time);

        const diffMs   = new Date(r.end_time) - new Date(r.start_time);
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const duration = diffDays === 1 ? '1 day' : `${diffDays} days`;

        console.log('detail-category element:', document.getElementById('detail-category'));
console.log('Full document body innerHTML snippet:', document.querySelector('.status-banner')?.outerHTML);
document.getElementById('detail-category').textContent      = r.category || '—';
        document.getElementById('detail-device').textContent        = r.device || '—';
        document.getElementById('detail-start-time').firstChild.textContent = start.time + ' ';
document.getElementById('detail-start-date').textContent            = start.date;
document.getElementById('detail-end-time').firstChild.textContent   = end.time + ' ';
document.getElementById('detail-end-date').textContent              = end.date;
        document.getElementById('detail-duration').textContent      = duration;
        document.getElementById('detail-pickup-location').textContent = r.pickup_location || '—';
        document.getElementById('detail-reservation-id').textContent = `#${r.id}`;
      }
    } catch (err) {
      console.error('Failed to load reservation details:', err);
    }
  }

  // ── TOGGLE DROPDOWN ──
  if (splitBtn) {
    splitBtn.addEventListener('click', function () {
      const isOpen = actionDropdown.classList.toggle('show');
      splitBtn.classList.toggle('open', isOpen);
    });
  }

  // ── NAVIGATE ON OPTION SELECT ──
  document.querySelectorAll('.action-option').forEach(opt => {
    opt.addEventListener('click', function (e) {
      e.stopPropagation();
      if (this.classList.contains('disabled') || !this.dataset.href) return;
      window.location.href = `${this.dataset.href}?id=${id}`;
    });
  });

  // ── CLOSE WHEN CLICKING OUTSIDE ──
  document.addEventListener('click', function (e) {
    if (splitBtn && !splitBtn.contains(e.target)) {
      actionDropdown.classList.remove('show');
      splitBtn.classList.remove('open');
    }
  });

});