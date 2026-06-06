const codeBoxes = document.querySelectorAll('.code-box')
const verifyBtn = document.getElementById('verifyBtn')
const loginError = document.getElementById('loginError')
const registerError = document.getElementById('registerError')
const verifyError = document.getElementById('verifyError')
const verificationModal = document.getElementById('verificationModal')

const BACKEND_URL = 'reservation-faevbvdgeybqg4fv.swedencentral-01.azurewebsites.net'

let userEmailInMemory = ''

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        registerError.textContent = ''

        const fullname = document.getElementById('registerFullname').value.trim()
        const email = document.getElementById('registerEmail').value.trim()
        const password = document.getElementById('registerPassword').value.trim()

        if (!fullname || !email || !password) {
            registerError.textContent = 'All fields are required.'
            return
        }

        if (!email.endsWith('@oamk.fi') && !email.endsWith('@students.oamk.fi')) {
            registerError.textContent = 'Use student email'
            return
        }

        userEmailInMemory = email

        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    fullname: fullname, 
                    email: userEmailInMemory,
                    password: password 
                })
            })

            const data = await res.json();

            if (!res.ok) {
                registerError.textContent = data.message
                return
            }

            registerError.textContent = ''

            verificationModal.style.display = 'flex'

        } catch (error) {
            console.error(error)
            registerError.textContent = 'Network error'
        }
    })
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        loginError.textContent = ''
        
        const email = document.getElementById('loginEmail').value.trim()
        const password = document.getElementById('loginPassword').value.trim()

        if (!email || !password) {
            loginError.textContent = 'Email and password are required.'
            return
        }

        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email,
                    password: password 
                })
            })

            const data = await res.json()

            if (!res.ok) {
                loginError.textContent = data.message
                return
            }

            localStorage.setItem('token', data.token)
            localStorage.setItem('role', data.role)
            
            if (data.role === 'student' || data.role === 'staff') {
                window.location.href = './user/equipments_list.html'
            } else if (data.role === 'admin') {
                window.location.href = './admin/dashboard.html'
            }

            loginError.textContent = ''

        } catch (error) {
            console.error(error)
            loginError.textContent = 'Network error'
        }
    })
}

if (verificationModal && verifyBtn) {
    verifyBtn.addEventListener('click', async () => {
        verifyError.textContent = ''

        let combinedCode = ''
        codeBoxes.forEach(box => combinedCode += box.value)

        if (combinedCode.length < 6) {
            verifyError.textContent = 'Please enter 6 digits.'
            return
        }

        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmailInMemory,
                    verificationCode: combinedCode
                })
            })

            const data = await res.json()

            if (!res.ok) {
                verifyError.textContent = data.message
                return
            }

            console.log('Role: ' + data.role)

            localStorage.setItem('token', data.token)
            localStorage.setItem('role', data.role)

            verifyError.textContent = ''
            
            if (data.role === 'student' || data.role === 'staff') {
                window.location.href = './user/equipments_list.html'
            }
            
        } catch (error) {
            console.error(error)
            verifyError.textContent = 'Network error'
        }
    })
}



