let currentEquipmentId = null;

// ── LOAD EQUIPMENT DETAILS FROM URL PARAM ──
async function loadEquipmentDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    currentEquipmentId = id;

    if (!id) {
        document.getElementById('detail-name').textContent = 'Equipment not found.';
        return;
    }

    try {
        const [equipRes, settingsRes] = await Promise.all([
            fetch(`/api/equipment/types/${id}`),
            fetch('/api/settings')
        ]);

        if (!equipRes.ok) throw new Error('Not found');
        const item     = await equipRes.json();
        const settings = await settingsRes.json();

        // Initial location load — no date/time selected yet, shows static availability
        await refreshLocations();

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

        const maxStartDate = new Date();
        maxStartDate.setDate(maxStartDate.getDate() + window.advanceBookingDays);
        document.getElementById('startDate').max = maxStartDate.toISOStrin
        g().split('T')[0];

        /*const qtySelect = document.getElementById('qtySelect');
        qtySelect.innerHTML = '';
        const max = Math.max(1, parseInt(item.available_count) || 1);
        for (let i = 1; i <= max; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = i;
            qtySelect.appendChild(opt);
        }*/

    } catch (err) {
        console.error(err);
        document.getElementById('detail-name').textContent = 'Failed to load equipment.';
    }
}

// ── FETCH + RENDER LOCATIONS (static, or filtered by selected date/time) ──
async function refreshLocations() {
    const locationDropdown = document.getElementById('locationDropdown');
    const pickupInput = document.getElementById('pickupInput');

    const startDate = document.getElementById('startDate').value;
    const endDate   = document.getElementById('endDate').value;
    const startTime = document.getElementById('startTime').value;
    const endTime   = document.getElementById('endTime').value;

    let url = `/api/equipment/types/${currentEquipmentId}/locations`;

    // Only pass a date/time window once all four fields are filled
    if (startDate && endDate && startTime && endTime) {
        const start_time = `${startDate}T${startTime}:00`;
        const end_time   = `${endDate}T${endTime}:00`;
        url += `?start_time=${encodeURIComponent(start_time)}&end_time=${encodeURIComponent(end_time)}`;
    }

    let locations;
    try {
        const res = await fetch(url);
        locations = await res.json();
    } catch (err) {
        console.error('Failed to load locations:', err);
        locations = [];
    }

    pickupInput.value = '';
    locationDropdown.innerHTML = `<li class="location-header"><i class="bi bi-geo-alt-fill me-1"></i> Select Pickup Location</li>`;

    if (locations.length === 0) {
        locationDropdown.innerHTML += `<li class="location-item disabled">No locations available for this time</li>`;
        updateQuantityOptions(1); // no locations — fall back to a single option
    } else {
        locations.forEach((loc, index) => {
            locationDropdown.innerHTML += `
                <li class="location-item${index === 0 ? ' selected' : ''}" data-value="${loc.location}" data-count="${loc.available_count}">
                    <i class="bi bi-building me-2"></i>${loc.location}
                    <span class="location-sub">${loc.available_count} available</span>
                </li>
            `;
        });
        pickupInput.value = locations[0].location;
        updateQuantityOptions(locations[0].available_count);
    }
}

// ── UPDATE QUANTITY DROPDOWN TO MATCH SELECTED LOCATION'S AVAILABLE COUNT ──
function updateQuantityOptions(count) {
    const qtySelect = document.getElementById('qtySelect');
    const max = Math.max(1, parseInt(count) || 1);

    const previousValue = parseInt(qtySelect.value) || 1;

    qtySelect.innerHTML = '';
    for (let i = 1; i <= max; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = i;
        qtySelect.appendChild(opt);
    }

    // Keep the previously selected quantity if it's still valid for the new location,
    // otherwise reset to 1
    qtySelect.value = previousValue <= max ? previousValue : 1;
}

loadEquipmentDetails();

// ── RESTRICT DATES TO TODAY OR FUTURE ──
const today = new Date().toISOString().split('T')[0];

const startDateInput = document.getElementById('startDate');
const endDateInput   = document.getElementById('endDate');
const startTimeInput = document.getElementById('startTime');
const endTimeInput   = document.getElementById('endTime');

startDateInput.min = today;
endDateInput.min   = today;

startDateInput.addEventListener('change', function () {
    endDateInput.min = this.value;
    if (endDateInput.value && endDateInput.value < this.value) {
        endDateInput.value = '';
    }
    refreshLocations();
});

// Re-fetch locations whenever any of the four date/time fields change
endDateInput.addEventListener('change', refreshLocations);
startTimeInput.addEventListener('change', refreshLocations);
endTimeInput.addEventListener('change', refreshLocations);

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

locationBtn.addEventListener('click', function (e) {
  e.stopPropagation();
  toggleLocationDropdown();
});

pickupInput.addEventListener('click', function (e) {
  e.stopPropagation();
  toggleLocationDropdown();
});

locationDropdown.addEventListener('click', function (e) {
  const item = e.target.closest('.location-item');
  if (!item || item.classList.contains('disabled')) return;

  e.stopPropagation();
  pickupInput.value = item.getAttribute('data-value');
  locationDropdown.querySelectorAll('.location-item').forEach(i => i.classList.remove('selected'));
  item.classList.add('selected');
  closeLocationDropdown();

  const count = item.getAttribute('data-count');
  updateQuantityOptions(count);
});

document.addEventListener('click', function (e) {
  if (!locationDropdown.contains(e.target) && !locationBtn.contains(e.target) && !pickupInput.contains(e.target)) {
    closeLocationDropdown();
  }
});

// ── CONFIRMATION MODAL ── (unchanged from your existing code below this point)
const confirmBtn   = document.getElementById('confirmBtn');
const successModal = document.getElementById('successModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');

confirmBtn.addEventListener('click', async function () {
  const startDate = document.getElementById('startDate').value;
  const endDate   = document.getElementById('endDate').value;
  const startTime = document.getElementById('startTime').value;
  const endTime   = document.getElementById('endTime').value;
  const location  = document.getElementById('pickupInput').value;

  const errors = [];

  if (!startDate) errors.push('Start Date');
  if (!endDate)   errors.push('End Date');
  if (!startTime) errors.push('Start Time');
  if (!endTime)   errors.push('End Time');
  if (!location)  errors.push('Pickup Location');

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

  // Show ALL reservation IDs created in this booking (one per unit, for quantity > 1)
  const allReservations = Array.isArray(reservationData) ? reservationData : [reservationData];
  const idLabel = document.getElementById('modal-reservation-id-label');
  const idValue = document.getElementById('modal-reservation-id');

  if (allReservations.length > 1) {
    idLabel.textContent = 'Reservation IDs';
    idValue.textContent = allReservations.map(r => `#${r.id}`).join(', ');
  } else {
    idLabel.textContent = 'Reservation ID';
    idValue.textContent = allReservations[0]?.id ?? '—';
  }

  successModal.classList.add('show');
});

function showValidationAlert(errors) {
  const existing = document.getElementById('validationAlert');
  if (existing) existing.remove();

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

  const confirmBtn = document.getElementById('confirmBtn');
  confirmBtn.parentElement.insertBefore(alert, confirmBtn);

  setTimeout(() => {
    alert.style.transition = 'opacity 0.4s';
    alert.style.opacity = '0';
    setTimeout(() => alert.remove(), 400);
  }, 4000);

  alert.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

modalCloseBtn.addEventListener('click', function () {
  successModal.classList.remove('show');
});

successModal.addEventListener('click', function (e) {
  if (e.target === successModal) successModal.classList.remove('show');
});


