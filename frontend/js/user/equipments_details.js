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