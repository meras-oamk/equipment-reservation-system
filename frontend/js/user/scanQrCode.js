document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const reservationId = params.get('id');

    if (!reservationId) {
        alert('Reservation ID missing');
        history.back();
        return;
    }

    const html5QrCode = new Html5Qrcode("reader");

    async function onScanSuccess(decodedText) {
        try {
            await html5QrCode.stop();
            console.log("QR:", decodedText);

            const token = localStorage.getItem('token');
            const res = await fetch(`/api/reservation/${reservationId}/scan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ qr_code: decodedText })
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error);
                return;
            }
            alert(data.message);
            window.location.href = 'myReservation.html';
        } catch (err) {
            console.error(err);
            alert('Scan failed');
        }
    }

    const scanConfig = { fps: 10, qrbox: 250 };

    try {
        const cameras = await Html5Qrcode.getCameras();

        let target;
        if (cameras.length) {
            const backCamera = cameras.find(c => /back|rear|environment/i.test(c.label));
            target = backCamera ? backCamera.id : cameras[cameras.length - 1].id;
        } else {
            // No enumerable cameras — fall back to a plain string facingMode hint
            target = { facingMode: "environment" };
        }

        await html5QrCode.start(target, scanConfig, onScanSuccess);

    } catch (err) {
        console.error("Camera start failed:", err);
        alert("Unable to access camera. Please check camera permissions in your browser settings.");
    }
});