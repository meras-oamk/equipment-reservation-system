const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

function showLogin() {
    loginForm.style.display = "block";
    registerForm.style.display = "none";

    loginTab.classList.add("active");
    registerTab.classList.remove("active");
}

function showRegister() {
    loginForm.style.display = "none";
    registerForm.style.display = "block";

    registerTab.classList.add("active");
    loginTab.classList.remove("active");
}

loginTab.addEventListener("click", showLogin);
registerTab.addEventListener("click", showRegister);

document.getElementById("showRegister")
    .addEventListener("click", function(e){
        e.preventDefault();
        showRegister();
    });

document.getElementById("showLogin")
    .addEventListener("click", function(e){
        e.preventDefault();
        showLogin();
    });
    /* Password visibility toggle */
    function setupPasswordToggle(passwordId, eyeId) {
    const password = document.getElementById(passwordId);
    const eye = document.getElementById(eyeId);

    eye.addEventListener("click", () => {
        const isPassword = password.type === "password";

        password.type = isPassword ? "text" : "password";

        eye.classList.toggle("fa-eye");
        eye.classList.toggle("fa-eye-slash");
    });
}

setupPasswordToggle("loginPassword", "loginEye");
setupPasswordToggle("registerPassword", "registerEye");

// Auto-select form based on URL param
const params = new URLSearchParams(window.location.search);
if (params.get('form') === 'register') {
    showRegister();
} else {
    showLogin();
}


//Auto move between boxes 
const codeInputs =
    document.querySelectorAll(".code-box");

codeInputs.forEach((input, index) => {

    input.addEventListener("input", () => {

        if(input.value.length === 1 &&
           index < codeInputs.length - 1){

            codeInputs[index + 1].focus();
        }
    });

    input.addEventListener("keydown", (e) => {

        if(
            e.key === "Backspace" &&
            input.value === "" &&
            index > 0
        ){
            codeInputs[index - 1].focus();
        }
    });

});

window.openVerificationModal = () => {
    const modal = document.getElementById('verificationModal');
    if (modal) {
        verificationModal.style.display = 'flex'
        
        window.onVerificationModalOpen(); 
    }
};

//get the full code
document
.getElementById("verifyBtn")
.addEventListener("click", () => {

    let code = "";

    document
    .querySelectorAll(".code-box")
    .forEach(input => {
        code += input.value;
    });

});