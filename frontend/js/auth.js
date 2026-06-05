const codeBoxes = document.querySelectorAll('.code-box')
const verifyBtn = document.getElementById('verifyBtn')

let userEmailInMemory = ''

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        const fullname = document.getElementById('registerFullname').value
        const email = document.getElementById('registerEmail').value
        const password = document.getElementById('registerPassword').value

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

        } catch (error) {
            console.error(error)
            alert('Error:' + error.message)
        }
    })
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        const email = document.getElementById('loginEmail').value
        const password = document.getElementById('loginPassword').value

        console.log(email)
        console.log(password)

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

            if (res.ok) {
                localStorage.setItem('token', data.token)
                localStorage.setItem('role', data.role)

                if (data.role === 'student' || data.role === 'staff') {
                    window.location.href = './user/equipments_list.html'
                } else if (data.role === 'admin') {
                    window.location.href = './admin/dashboard.html'
                }
            } else {
                alert(data.error || 'Verification failed!')
            }
        } catch (error) {
            console.error(error)
            alert('Error' + error.message)
        }
    })
}

if (verificationModal && verifyBtn) {
    verifyBtn.addEventListener('click', async () => {
        let combinedCode = ''
        codeBoxes.forEach(box => combinedCode += box.value)

        if (combinedCode.length < 6) {
            alert('Please enter 6 digits.')
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

            if (res.ok) {
                localStorage.setItem('token', data.token)
                localStorage.setItem('role', data.role)

                if (data.role === 'student' || data.role === 'staff') {
                    window.location.href = './user/equipments_list.html'
                }
            } else {
                alert(data.error || 'Verification failed!')
            }
        } catch (error) {
            console.error('Network error: ', error)
        }
    })
}



