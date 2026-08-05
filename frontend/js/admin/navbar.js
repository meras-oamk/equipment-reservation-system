(function () {
    document.addEventListener("DOMContentLoaded", () => {
        const sidebarContainer = document.getElementById("sidebar-container")
        if (!sidebarContainer) return

        const fullname = localStorage.getItem('fullname') || 'Admin User'
        const email = localStorage.getItem('email') || 'admin.user@example.com'

        const navLinks = [
            { name: 'Dashboard', filename: 'dashboard.html', path: `/admin/dashboard.html`, icon: 'bi-grid' },
            { name: 'Reservations', filename: 'reservations_list.html', path: `/admin/reservations_list.html`, icon: 'bi-calendar-check' },
            { name: 'Equipments', filename: 'equipments_list.html', path: `/admin/equipments_list.html`, icon: 'bi-box-seam' },
            { name: 'Configuration', filename: 'configuration.html', path: `/admin/configuration.html`, icon: 'bi-gear' },
            { name: 'Manage Users', filename: 'manageUsers.html', path: `/admin/manageUsers.html`, icon: 'bi-people' },
            { name: 'Equipment Logs', filename: 'logs.html', path: `/admin/logs_list.html`, icon: 'bi-journal-text' },
            { name: 'Booking Policies', filename: 'bookingPolicies.html', path: `/admin/booking_policies.html`, icon: 'bi-book' }
        ]

        const currentPath = window.location.pathname

        let html = `
        <aside class="sidebar text-center">
          <div class="sidebar-profile">
            <h6>${fullname}</h6>
            <small>${email}</small>
          </div>

          <nav class="sidebar-nav">
        `

        navLinks.forEach(link => {
            const activeClass = currentPath.endsWith(link.filename) ? 'active' : ''
            
            html += `
                <a class="nav-item ${activeClass}" href="${link.path}">
                    <i class="bi ${link.icon}"></i> ${link.name}
                </a>
            `
        })

        html += `
          </nav>

          <div class="sidebar-footer d-flex justify-content-center align-items-center">
            <div class="logout-btn" id="sidebarLogoutBtn" style="cursor: pointer">
              <i class="bi bi-box-arrow-right"></i> Log out
            </div>
          </div>
        </aside>
        `

        sidebarContainer.innerHTML = html

        const logoutBtn = document.getElementById('sidebarLogoutBtn')
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