document.addEventListener('DOMContentLoaded', async function () {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    document.getElementById('checkout-device').textContent = 'Reservation not found.';
    return;
  }

  // Fix "Back" link to preserve id
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
      const d = new Date(datetimeStr);
      const time = d.toTimeString().slice(0, 5);
      const date = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      return { time, date };
    }

    const start = fmt(r.start_time);
    const end   = fmt(r.end_time);

    document.getElementById('checkout-device').textContent   = r.device || '—';
    document.getElementById('checkout-start').innerHTML       = `${start.time}<br>${start.date}`;
    document.getElementById('checkout-end').innerHTML         = `${end.time}<br>${end.date}`;
    document.getElementById('checkout-location').textContent  = r.pickup_location || '—';

    // Pass id forward to scanQrCode.html as well
    const scanBtn = document.querySelector('.btn-scan-qr');
    if (scanBtn) {
      scanBtn.setAttribute('onclick', `window.location.href='scanQrCode.html?id=${id}'`);
    }

  } catch (err) {
    console.error('Failed to load checkout details:', err);
    document.getElementById('checkout-device').textContent = 'Failed to load reservation.';
  }
});