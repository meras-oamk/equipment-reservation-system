document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("resetPasswordForm");

    if (!form) return;

    form.addEventListener("submit", function(e){

        e.preventDefault();

        const newPassword =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if(newPassword !== confirmPassword){
            alert("Passwords do not match");
            return;
        }

        alert("Password reset successfully");

        const modal = bootstrap.Modal.getInstance(
            document.getElementById("resetPasswordModal")
        );

        modal.hide();
    });

});