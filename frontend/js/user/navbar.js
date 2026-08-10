(function () {
    const token = localStorage.getItem('token')
    if (!token) {
        window.location.href = '/index.html'
        return
    }

    document.addEventListener('DOMContentLoaded', () => {
        const staticContainer = document.getElementById('static-container')
        if (!staticContainer) return

        const navLinks = [
            { name: 'Equipments', filename: 'equipments_list.html', path: '/user/equipments_list.html' },
            { name: 'Reservations', filename: 'myReservation.html', path: '/user/myReservation.html' },
            { name: 'My Account', filename: 'myAccount.html', path: '/user/myAccount.html' }
        ]

        const currentPath = window.location.pathname

        let html = `
            <nav class='top-navbar'>
                <img src="../../Assets/Logo.png" alt="Logo" class="logo">
                <button class="nav-toggle" id="navToggle"><i class="bi bi-list"></i></button>

                <div class='nav-links' id='navLinks'>
        `

        navLinks.forEach(link => {
            const activeClass = currentPath.endsWith(link.filename) ? 'active' : ''

            html += `
                <a class="nav-item ${activeClass}" href="${link.path}">
                    ${link.name}
                </a>
            `
        })

        html += `
                <button type='button' class="logout" id="logoutBtn">
                    Log out
                </button>
            </div>
        </nav>
        `

        staticContainer.innerHTML = html

        const navToggle = document.getElementById('navToggle')
        const navLinksContainer = document.getElementById('navLinks')
        if (navToggle && navLinksContainer) {
            navToggle.addEventListener('click', () => {
                navLinksContainer.classList.toggle('open')
            })
        }

        const logoutBtn = document.getElementById('logoutBtn')
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault()
                localStorage.removeItem('token')
                localStorage.removeItem('role')
                localStorage.removeItem('fullname')
                localStorage.removeItem('email')
                
                window.location.href = `/index.html`
            })
        }
    })
})()