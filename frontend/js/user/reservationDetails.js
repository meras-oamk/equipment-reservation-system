document.addEventListener('DOMContentLoaded', function () {

  const splitBtn       = document.getElementById('splitBtn');
  const actionDropdown = document.getElementById('actionDropdown');

  // ── READ STATUS FROM URL ──
  const params = new URLSearchParams(window.location.search);
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
      window.location.href = this.dataset.href;
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