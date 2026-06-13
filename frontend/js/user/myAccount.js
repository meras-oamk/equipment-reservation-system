document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token')
    const form = document.forms["resetPasswordForm"];
    
    if (!form) return;
    if (!token) {
        window.location.href = '/loginOrRegister.html';
        return;
    };

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
                body: JSON.stringify({ newPassword: newPassword })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to reset password");
            };
            
            alert("Password reset successfully");
    
            const modal = bootstrap.Modal.getInstance(
                document.getElementById("resetPasswordModal")
            );
    
            modal.hide();    
            form.reset();        

        } catch (error) {
            console.error("Reset password error: ", error)
            alert(error.message || "Something went wrong. Please try again.");
        };

    });

});