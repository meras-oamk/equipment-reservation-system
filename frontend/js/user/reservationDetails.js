document.addEventListener('DOMContentLoaded', async function () {

  const splitBtn       = document.getElementById('splitBtn');
  const actionDropdown = document.getElementById('actionDropdown');

  // ── READ ID AND STATUS FROM URL ──
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  const status = params.get('status') || 'inactive';

  // ── UPDATE STATUS BADGE ──
  const badgeEl = document.querySelector('.status-banner span');
  if (badgeEl) {
    badgeEl.className   = `badge-${status}`;
    badgeEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  }

  // ── HIDE "SELECT YOUR ACTION" FOR EXPIRED ──
  if (splitBtn && status === 'expired') {
    splitBtn.style.display = 'none';
  }

  // ── DISABLE "RETURN" OPTION FOR INACTIVE RESERVATIONS ──
  if (status === 'inactive') {
    const returnOption = document.querySelector('.action-option[data-href="reservationAction_checkout.html"]');
    if (returnOption) {
      returnOption.classList.add('disabled');
      returnOption.removeAttribute('data-href');
    }
  }

  // ── FETCH AND POPULATE RESERVATION DETAILS ──
  if (id) {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/reservation/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const r = await res.json();

        function fmt(datetimeStr) {
          const d = new Date(datetimeStr);
          const time = d.toTimeString().slice(0, 5);
          const date = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
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