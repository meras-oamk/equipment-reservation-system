document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    const form = document.forms["resetPasswordForm"];

    if (!token) {
        window.location.href = '/loginOrRegister.html';
        return;
    }

    loadUserProfile();   

    if (!form) return;

    form.addEventListener("submit", async function(e){
        e.preventDefault();

        const newPassword =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if(newPassword !== confirmPassword){
            alert("Passwords do not match");
            return;
        }

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    newPassword
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error);
            }

            alert("Password reset successfully");

            const modal = bootstrap.Modal.getInstance(
                document.getElementById("resetPasswordModal")
            );

            modal.hide();
            form.reset();

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    });
});
async function loadUserProfile() {

    const token = localStorage.getItem('token');

    try {

        const res = await fetch('/api/users/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const user = await res.json();

        if (!res.ok) {
            throw new Error(user.error);
        }

        document.getElementById('profileName').textContent =
            user.full_name;

        document.getElementById('profileEmail').textContent =
            user.email;

        document.getElementById('profileRole').textContent =
            user.role.charAt(0).toUpperCase() +
            user.role.slice(1);

    } catch (error) {
        console.error('Profile load error:', error);
    }
}