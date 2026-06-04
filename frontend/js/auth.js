const loginForm = document.getElementById('loginForm')
const registerForm = document.getElementById('registerForm')

if (registerForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        const fullname = document.getElementById('registerFullname').value
        const email = document.getElementById('registerEmail').value
        const password = document.getElementById('registerPassword').value

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullname, email, password })
            })

            const data = await res.json()

            if (res.ok) {
                localStorage.setItem('token', data.token)
                window.location.href = 'html/user/equipment_list.html'
            } else {
                alert(data.message)
            }
        } catch (error) {
            console.error(err)
            alert('Error', error)
        }
    })
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        const email = document.getElementById('loginEmail').value
        const password = document.getElementById('loginPassword').value

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })

            const data = await res.json()

            if (res.ok) {
                localStorage.setItem('token', data.token)
                window.location.href = 'html/user/equipment_list.html'
            } else {
                alert(data.message)
            }
        } catch (error) {
            console.error(err)
            alert('Error', error)
        }
    })
}