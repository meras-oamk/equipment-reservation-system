document.addEventListener('DOMContentLoaded', async function () {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    document.getElementById('checkin-device').textContent = 'Reservation not found.';
    return;
  }

  // Fix "Back" link to preserve id and status
  const backLink = document.getElementById('backLink');
  if (backLink) {
    backLink.href = `reservationDetails.html?id=${id}`;
  }

  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`/api/reservation/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Failed to load reservation.');
    const r = await res.json();

    function fmt(datetimeStr) {
      const clean = datetimeStr.replace(' ', 'T').slice(0, 16);
      const [datePart, timePart] = clean.split('T');
      const [year, month, day] = datePart.split('-');
      return { time: timePart, date: `${day}/${month}/${year}` };
    }

    const start = fmt(r.start_time);
    const end   = fmt(r.end_time);

    document.getElementById('checkin-device').textContent   = r.device || '—';
    document.getElementById('checkin-start').innerHTML       = `${start.time}<br>${start.date}`;
    document.getElementById('checkin-end').innerHTML         = `${end.time}<br>${end.date}`;
    document.getElementById('checkin-location').textContent  = r.pickup_location || '—';

    // Pass id forward to scanQrCode.html as well
    const scanBtn = document.querySelector('.btn-scan-qr');
    if (scanBtn) {
      scanBtn.setAttribute('onclick', `window.location.href='scanQrCode.html?id=${id}'`);
    }

  } catch (err) {
    console.error('Failed to load checkin details:', err);
    document.getElementById('checkin-device').textContent = 'Failed to load reservation.';
  }
});