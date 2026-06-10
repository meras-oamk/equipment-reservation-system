    const splitBtn       = document.getElementById('actionSplitBtn');
    const actionDropdown = document.getElementById('actionDropdown');

    // Toggle dropdown
    splitBtn.addEventListener('click', function (e) {
      const isOpen = actionDropdown.classList.toggle('show');
      splitBtn.classList.toggle('open', isOpen);
    });

    // Navigate on option select
    document.querySelectorAll('.action-option').forEach(opt => {
      opt.addEventListener('click', function (e) {
        e.stopPropagation();
        window.location.href = this.dataset.href;
      });
    });

    // Close when clicking outside
    document.addEventListener('click', function (e) {
      if (!splitBtn.contains(e.target)) {
        actionDropdown.classList.remove('show');
        splitBtn.classList.remove('open');
      }
    });