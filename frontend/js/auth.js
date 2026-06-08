const codeBoxes = document.querySelectorAll('.code-box')
const verifyBtn = document.getElementById('verifyBtn')
const loginError = document.getElementById('loginError')
const registerError = document.getElementById('registerError')
const verifyError = document.getElementById('verifyError')
const verificationModal = document.getElementById('verificationModal')
const changePasswordBtn = document.getElementById('changePasswordBtn')
const resendCode = document.getElementById('resendCode')

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
            registerError.textContent = 'Only OAMK accounts are allowed!'
            return
        }

        userEmailInMemory = email

        try {
            const res = await fetch('http://localhost:3001/api/auth/register', {
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
                registerError.textContent = data.error
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
            const res = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email,
                    password: password 
                })
            })

            const data = await res.json()

            if (!res.ok) {
                loginError.textContent = data.error
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
            const res = await fetch('http://localhost:3001/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmailInMemory,
                    verificationCode: combinedCode
                })
            })

            const data = await res.json()

            if (!res.ok) {
                verifyError.textContent = data.error
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

if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', async () => {
        const token = localStorage.getItem('token')
        if (!token) {
            window.location.href = '/login.html'
            return
        }

        try {
            const res = await fetch('http://localhost:3001/api/auth/change-password', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ fullname, email, password })
            })

            const data = await res.json()

            if (res.ok) {
                
            }
        } 
    })
}

if (resendCode) {
    resendCode.addEventListener('click', async (e) => {
        e.preventDefault()

        if (!userEmailInMemory) {
            alert('Session email missing. Please registering again.')
            return
        }

        resendCode.textContent = 'Sending...'

        try {
            const res = await fetch('http://localhost:3001/api/auth/resendCode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmailInMemory })
            })

            const data = await res.json();

            if (!res.ok) {
                verifyError.textContent = data.error
                return
            }

            verifyError.textContent = ''
        } catch (error) {
            console.error("Network problem resending token code:", error)
            verifyError.textContent = 'Network error'
        } finally {
            resendLink.textContent = "Resend Code"
        }
    })
}    




