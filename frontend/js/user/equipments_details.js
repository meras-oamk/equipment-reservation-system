    // Location dropdown
    const locationBtn = document.getElementById('locationBtn');
    const locationDropdown = document.getElementById('locationDropdown');
    const pickupInput = document.getElementById('pickupInput');
    const locationItems = document.querySelectorAll('.location-item');

    function openLocationDropdown() {
      locationDropdown.classList.add('show');
      locationBtn.style.background  = 'var(--orange)';
      locationBtn.style.borderColor = 'var(--orange)';
      locationBtn.style.color       = 'white';
    }

    function closeLocationDropdown() {
      locationDropdown.classList.remove('show');
      locationBtn.style.background  = '';
      locationBtn.style.borderColor = '';
      locationBtn.style.color       = '';
    }

    function toggleLocationDropdown() {
      locationDropdown.classList.contains('show') ? closeLocationDropdown() : openLocationDropdown();
    }

    // Open/close on icon click
    locationBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleLocationDropdown();
    });

    // Open/close on input click
    pickupInput.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleLocationDropdown();
    });

    // Select a location
    locationItems.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        pickupInput.value = this.getAttribute('data-value');
        locationItems.forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
        closeLocationDropdown();
      });
    });

    // Close when clicking outside
    document.addEventListener('click', function (e) {
      if (!locationDropdown.contains(e.target) && !locationBtn.contains(e.target) && !pickupInput.contains(e.target)) {
        closeLocationDropdown();
      }
    });

    // ── CONFIRMATION MODAL ──
    const confirmBtn   = document.getElementById('confirmBtn');
    const successModal = document.getElementById('successModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    confirmBtn.addEventListener('click', function () {
      // Read form values
      const startDate = document.getElementById('startDate').value;
      const endDate   = document.getElementById('endDate').value;
      const startTime = document.getElementById('startTime').value;
      const endTime   = document.getElementById('endTime').value;
      const location  = document.getElementById('pickupInput').value || 'Linnanmaa Kirjasto';

      // Format date dd/mm/yyyy
      function fmt(d) {
        if (!d) return '—';
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
      }

      document.getElementById('modal-start-time').textContent = startTime;
      document.getElementById('modal-start-date').textContent = fmt(startDate);
      document.getElementById('modal-end-time').textContent   = endTime;
      document.getElementById('modal-end-date').textContent   = fmt(endDate);
      document.getElementById('modal-location').textContent   = location;

      successModal.classList.add('show');
    });

    // Close on Close button
    modalCloseBtn.addEventListener('click', function () {
      successModal.classList.remove('show');
    });

    // Close on overlay click
    successModal.addEventListener('click', function (e) {
      if (e.target === successModal) successModal.classList.remove('show');
    });