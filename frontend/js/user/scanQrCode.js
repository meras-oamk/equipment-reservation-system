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

    const scanConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
    };

    try {
        const cameras = await Html5Qrcode.getCameras();

        let target;
        if (cameras.length) {
            const backCamera = cameras.find(c => /back|rear|environment/i.test(c.label));
            const hasLabels = cameras.some(c => c.label && c.label.trim() !== '');

            if (backCamera) {
                target = backCamera.id;
            } else if (!hasLabels) {
                // iOS Safari: labels are empty before permission is granted — use facingMode instead
                target = { facingMode: "environment" };
            } else {
                target = cameras[cameras.length - 1].id;
            }
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