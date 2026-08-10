const codeBoxes = document.querySelectorAll('.code-box')
const verifyBtn = document.getElementById('verifyBtn')
const loginError = document.getElementById('loginError')
const registerError = document.getElementById('registerError')
const verifyError = document.getElementById('verifyError')
const verificationModal = document.getElementById('verificationModal')
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
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    fullname: fullname, 
                    email: userEmailInMemory,
                    password: password 
                })
            })

            const data = await res.json()

            if (!res.ok) {
                registerError.textContent = data.error
                return
            }

            registerError.textContent = ''

            window.openVerificationModal()

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
            const res = await fetch('/api/auth/login', {
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
            localStorage.setItem('fullname', data.fullname)
            localStorage.setItem('email', email)
            
            if (data.role === 'student' || data.role === 'staff') {
                window.location.href = '/user/equipments_list.html'
            } else if (data.role === 'admin') {
                window.location.href = '/admin/dashboard.html'
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
            const res = await fetch('/api/auth/verify-email', {
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
                window.location.href = '/user/equipments_list.html'
            }
            
        } catch (error) {
            console.error(error)
            verifyError.textContent = 'Network error'
        }
    })
}

let cooldownTimerInterval = null

function startResendCooldown(seconds) {
    const resendBtn = document.getElementById('resendBtn')
    if (!resendBtn) return 

    clearInterval(cooldownTimerInterval)

    let timeLeft = seconds 
    resendBtn.innerHTML = `Resend Code (<span id="countdownTimer">${timeLeft}</span>s)`
    resendBtn.classList.add('disabled')

    const currentTimerSpan = document.getElementById('countdownTimer')

    cooldownTimerInterval = setInterval(() => {
        timeLeft--
        if (currentTimerSpan) {
            currentTimerSpan.textContent = timeLeft
        }

        if (timeLeft <= 0) {
            clearInterval(cooldownTimerInterval)
            resendBtn.classList.remove('disabled')
            resendBtn.innerHTML = 'Resend Code'
        }
    }, 1000)
}

window.onVerificationModalOpen = () => {
    const resendBtn = document.getElementById('resendBtn')
    const feedbackEl = document.getElementById('resendFeedback')

    if (feedbackEl) {
        feedbackEl.className = 'feedback-msg hidden'
    }

    if (resendBtn) {
        resendBtn.innerHTML = 'Resend Code (<span id="countdownTimer">60</span>s)'
        startResendCooldown(60)
    } 
}

document.addEventListener('DOMContentLoaded', () => {
    const resendBtn = document.getElementById('resendBtn')
    const feedbackEl = document.getElementById('resendFeedback')

    if (resendBtn) {
        resendBtn.addEventListener('click', async () => {
            if (!feedbackEl) return

            feedbackEl.style.display = 'none'
            feedbackEl.className = 'feedback-msg hidden'
            resendBtn.disabled = true

            try {
                if (!userEmailInMemory) {
                    alert('Session email missing. Please registering again.')
                    return
                }
                
                // Call your resend API endpoint
                const res = await fetch('/api/auth/resendCode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: userEmailInMemory })
                })

                const data = await res.json()

                if (!res.ok) {
                    if (data.secondsLeft) {
                        startResendCooldown(data.secondsLeft)
                    }
                    throw new Error(data.error || 'Failed to resend verification code.')
                }

                feedbackEl.textContent = 'A new verification code has been sent to your email.'
                feedbackEl.className = 'feedback-msg success'

                startResendCooldown(60)

                feedbackEl.className = 'feedback-msg hidden'

            } catch (error) {
                console.error('Error resending code:', error)
                
                feedbackEl.textContent = error.message
                feedbackEl.style.display = 'block'
                
                if (!resendBtn.innerHTML.includes('countdownTimer')) {
                    resendBtn.classList.remove('disabled')
                }
            }
        })
    }
})
