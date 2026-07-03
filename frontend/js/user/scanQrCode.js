document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const reservationId = params.get('id');

    if (!reservationId) {
        alert('Reservation ID missing');
        history.back();
        return;
    }

    const html5QrCode = new Html5Qrcode("reader");

    Html5Qrcode.getCameras()
        .then(cameras => {
            if (!cameras.length) {
                alert("No camera found");
                return;
            }

            html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: 250
                },
                async (decodedText) => {
                    try {

                        html5QrCode.stop();

                        console.log("QR:", decodedText);

                        const token = localStorage.getItem('token');

                        const res = await fetch(
                            `/api/reservation/${reservationId}/scan`,
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    qr_code: decodedText
                                })
                            }
                        );

                        const data = await res.json();

                        if (!res.ok) {
                            alert(data.error);
                            return;
                        }

                        alert(data.message);

window.location.href =
    'myReservation.html';

                    } catch (err) {
                        console.error(err);
                        alert('Scan failed');
                    }
                }
            );
        })
        .catch(err => {
            console.error(err);
            alert('Unable to access camera');
        });
});

