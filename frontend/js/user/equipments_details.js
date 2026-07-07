    // ── LOAD EQUIPMENT DETAILS FROM URL PARAM ──
async function loadEquipmentDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        document.getElementById('detail-name').textContent = 'Equipment not found.';
        return;
    }

    try {
        // Fetch equipment and settings in parallel
        const [equipRes, settingsRes, locationsRes] = await Promise.all([
    fetch(`/api/equipment/types/${id}`),
    fetch('/api/settings'),
    fetch(`/api/equipment/types/${id}/locations`)
]);

if (!equipRes.ok) throw new Error('Not found');
const item      = await equipRes.json();
const settings  = await settingsRes.json();
const locations = await locationsRes.json();

// ── Populate location dropdown ──
const locationDropdown = document.getElementById('locationDropdown');
locationDropdown.innerHTML = `<li class="location-header"><i class="bi bi-geo-alt-fill me-1"></i> Select Pickup Location</li>`;

if (locations.length === 0) {
    locationDropdown.innerHTML += `<li class="location-item disabled">No locations available</li>`;
} else {
    locations.forEach((loc, index) => {
        locationDropdown.innerHTML += `
            <li class="location-item${index === 0 ? ' selected' : ''}" data-value="${loc.location}">
                <i class="bi bi-building me-2"></i>${loc.location}
                <span class="location-sub">${loc.available_count} available</span>
            </li>
        `;
    });

    // Default the pickup field to the first real location for this equipment
    pickupInput.value = locations[0].location;
}

        // ── Parse booking policy ──
        const general = settings.general_booking_settings || {};
        window.advanceBookingDays = general.advance_booking_days ?? 30;

        const categoryRules = settings.category_rules || {};
        const categoryRule  = categoryRules[item.category] || null;
        window.maxDuration     = categoryRule ? categoryRule.duration : null;
        window.maxDurationUnit = categoryRule ? categoryRule.unit.toLowerCase() : 'days';

        // ── Populate UI ──
        document.getElementById('detail-image').src                 = item.image_url || '';
        document.getElementById('detail-image').alt                 = item.name;
        document.getElementById('detail-subcategory').textContent   = item.subcategory;
        document.getElementById('detail-name').textContent          = item.name;
        document.getElementById('detail-available').textContent     = item.available_count;
        document.getElementById('detail-description').textContent   = item.description || 'No description available.';
        document.getElementById('modal-equipment-name').textContent = item.name;

        // Set max allowed start date based on advance booking window
        const maxStartDate = new Date();
        maxStartDate.setDate(maxStartDate.getDate() + window.advanceBookingDays);
        document.getElementById('startDate').max = maxStartDate.toISOString().split('T')[0];

        // Populate quantity dropdown up to available_count
        const qtySelect = document.getElementById('qtySelect');
        qtySelect.innerHTML = '';
        const max = Math.max(1, parseInt(item.available_count) || 1);
        for (let i = 1; i <= max; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = i;
            qtySelect.appendChild(opt);
        }

    } catch (err) {
        console.error(err);
        document.getElementById('detail-name').textContent = 'Failed to load equipment.';
    }
}

loadEquipmentDetails();

    // ── RESTRICT DATES TO TODAY OR FUTURE ──
const today = new Date().toISOString().split('T')[0]; // format: YYYY-MM-DD

const startDateInput = document.getElementById('startDate');
const endDateInput   = document.getElementById('endDate');

    // Set minimum date to today for both
startDateInput.min = today;
endDateInput.min   = today;

    // When start date changes, end date minimum updates to match
startDateInput.addEventListener('change', function () {
    endDateInput.min = this.value;

    // If end date is now before the new start date, reset it
    if (endDateInput.value && endDateInput.value < this.value) {
        endDateInput.value = '';
    }
});
    
    
    // Location dropdown
const locationBtn = document.getElementById('locationBtn');
const locationDropdown = document.getElementById('locationDropdown');
const pickupInput = document.getElementById('pickupInput');

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

// Select a location — use event delegation since items are added dynamically
locationDropdown.addEventListener('click', function (e) {
  const item = e.target.closest('.location-item');
  if (!item || item.classList.contains('disabled')) return;

  e.stopPropagation();
  pickupInput.value = item.getAttribute('data-value');
  locationDropdown.querySelectorAll('.location-item').forEach(i => i.classList.remove('selected'));
  item.classList.add('selected');
  closeLocationDropdown();
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

    confirmBtn.addEventListener('click', async function () {
  // Read form values
  const startDate = document.getElementById('startDate').value;
  const endDate   = document.getElementById('endDate').value;
  const startTime = document.getElementById('startTime').value;
  const endTime   = document.getElementById('endTime').value;
  const location  = document.getElementById('pickupInput').value;

  // ── VALIDATION ──
  const errors = [];

  if (!startDate) errors.push('Start Date');
  if (!endDate)   errors.push('End Date');
  if (!startTime) errors.push('Start Time');
  if (!endTime)   errors.push('End Time');
  if (!location)  errors.push('Pickup Location');

  // Date logic checks
  if (startDate && endDate && endDate < startDate) {
    errors.push('End Date cannot be before Start Date');
  }
  if (startDate && endDate && startDate === endDate && endTime <= startTime) {
    errors.push('End Time must be after Start Time on the same day');
  }

  if (errors.length > 0) {
    showValidationAlert(errors);
    return;
  }

  // ── POLICY VALIDATION ──
  const policyErrors = [];

  if (startDate) {
    const todayMs  = new Date().setHours(0, 0, 0, 0);
    const startMs  = new Date(startDate).getTime();
    const diffDays = Math.round((startMs - todayMs) / (1000 * 60 * 60 * 24));

    if (diffDays > window.advanceBookingDays) {
      policyErrors.push(
        `You can only book up to ${window.advanceBookingDays} days in advance`
      );
    }
  }

  if (startDate && endDate && startTime && endTime && window.maxDuration) {
    const start     = new Date(`${startDate}T${startTime}:00`);
    const end       = new Date(`${endDate}T${endTime}:00`);
    const diffHours = (end - start) / (1000 * 60 * 60);
    const diffDays  = diffHours / 24;

    const exceeded = window.maxDurationUnit === 'hours'
      ? diffHours > window.maxDuration
      : diffDays  > window.maxDuration;

    if (exceeded) {
      policyErrors.push(
        `Maximum reservation duration for this category is ${window.maxDuration} ${window.maxDurationUnit}`
      );
    }
  }

    if (policyErrors.length > 0) {
      showValidationAlert(policyErrors);
      return;
  }

  // ── POST TO BACKEND ──
  const token   = localStorage.getItem('token');
  const params  = new URLSearchParams(window.location.search);
  const type_id = params.get('id');

  const start_time = `${startDate}T${startTime}:00`;
  const end_time   = `${endDate}T${endTime}:00`;

  let reservationData;

  try {
    const res = await fetch('/api/reservation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type_id,
        start_time,
        end_time,
        quantity: document.getElementById('qtySelect').value,
        pickup_location: location
      })
    });

    if (!res.ok) {
      const err = await res.json();
      showValidationAlert([err.error || 'Reservation failed. Please try again.']);
      return;
    }

    reservationData = await res.json();
  } catch (err) {
    showValidationAlert(['Network error. Please try again.']);
    return;
  }

  // ── FORMAT & SHOW MODAL ──
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

  // reservationData is an array (one row per unit) — show the first one's ID
  const firstReservation = Array.isArray(reservationData) ? reservationData[0] : reservationData;
  document.getElementById('modal-reservation-id').textContent = firstReservation?.id ?? '—';

  successModal.classList.add('show');
});

// ── VALIDATION ALERT HELPER ──
function showValidationAlert(errors) {
  // Remove any existing alert first
  const existing = document.getElementById('validationAlert');
  if (existing) existing.remove();

  const isLogicError = errors.some(e => e.includes('cannot') || e.includes('must be'));
  const missingFields = errors.filter(e => !e.includes('cannot') && !e.includes('must be'));
  const logicErrors   = errors.filter(e =>  e.includes('cannot') ||  e.includes('must be'));

  let messageHTML = '';
  if (missingFields.length > 0) {
    messageHTML += `Please fill in the following fields: <strong>${missingFields.join(', ')}</strong>.`;
  }
  if (logicErrors.length > 0) {
    if (messageHTML) messageHTML += '<br>';
    messageHTML += logicErrors.map(e => `⚠️ ${e}.`).join('<br>');
  }

  const alert = document.createElement('div');
  alert.id = 'validationAlert';
  alert.style.cssText = `
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: #fff4f4;
    border: 1.5px solid #f28b82;
    border-left: 4px solid #e53935;
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 16px;
    font-size: 0.9rem;
    color: #b71c1c;
    animation: fadeInDown 0.25s ease;
  `;

  alert.innerHTML = `
    <i class="bi bi-exclamation-circle-fill" style="font-size:1.1rem; margin-top:2px; flex-shrink:0;"></i>
    <div>${messageHTML}</div>
  `;

  // Insert alert just above the Confirm button
  const confirmBtn = document.getElementById('confirmBtn');
  confirmBtn.parentElement.insertBefore(alert, confirmBtn);

  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    alert.style.transition = 'opacity 0.4s';
    alert.style.opacity = '0';
    setTimeout(() => alert.remove(), 400);
  }, 4000);

  // Scroll alert into view smoothly
  alert.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

    // Close on Close button
    modalCloseBtn.addEventListener('click', function () {
      successModal.classList.remove('show');
    });

    // Close on overlay click
    successModal.addEventListener('click', function (e) {
      if (e.target === successModal) successModal.classList.remove('show');
    });