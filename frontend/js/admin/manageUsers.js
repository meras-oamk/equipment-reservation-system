const token = localStorage.getItem('token')
const role = localStorage.getItem('role')
const name = localStorage.getItem('fullname')
const email = localStorage.getItem('email')

const userController = new DetailsController({
    fetchUrl: '/api/manageUsers/users',
    leftPanelTitle: 'Registered Users',
    idProperty: 'user_id',

    // Render left card list attaches the filtering attributes
    renderCardHTML: (user, index) => {
        const joinedDate = user.created_at || user.joined_date || new Date().toISOString()
        const totalReservations = user.total_reservations || 0
        const overdue = user.overdue || 0

        const overdueDisplay = overdue > 0 ? '' : 'display: none'

        return `
            <div class="user-card" 
                 data-index="${index}" 
                 data-overdue="${overdue > 0}" 
                 data-joined="${joinedDate}" 
                 data-reservations="${totalReservations}">
                <div class="uname">${user.full_name}</div>
                <div class="uemail">${user.email}</div>
                <div class="umeta">${totalReservations} total reservations 
                    <span class="overdue-tag" style="${overdueDisplay}">${overdue} overdue</span>
                </div>
            </div>
        `
    },

    populatedDetails: (user) => {
        document.getElementById('dName').textContent = user.full_name
        document.getElementById('dEmail').textContent = user.email
        document.getElementById('dId').textContent = user.user_id
        document.getElementById('dJoin').textContent = formatDate(user.created_at)
        document.getElementById('dStatus').textContent = user.status

        const history = user.reservations || []
        const activeCount = history.filter(r => r.status?.toLowerCase() === 'active').length
        const overdueCount = history.filter(r => r.status?.toLowerCase() === 'overdue').length

        document.getElementById('dTotal').textContent = history.length
        document.getElementById('dActive').textContent = activeCount
        document.getElementById('dOverdue').textContent = overdueCount

        const historyContainer = document.getElementById('dHistoryContainer')
        if (historyContainer) {    
            historyContainer.innerHTML = ''

            if (history.length === 0) {
                historyContainer.innerHTML = '<div class="eq-meta" style="padding: 10px 0; color: #888;">No reservation history found.</div>'
                return
            }
            
            history.forEach(item => {
                const category = (item.equipment.category).toUpperCase()
                const eqName = item.equipment?.name || 'N/A'
                const startDate = formatDate(item.start_time)
                const endDate = formatDate(item.end_time)
                const statusBadge = getHistoryStatusBadge(item.status)
                
                const cardHtml = `
                    <div class="history-card">
                        <div class="history-info">
                            <div class="h-name"> ${eqName} → ${category}</div>
                            <div class="h-dates">${endDate} → ${startDate}</div>
                        </div>
                        ${statusBadge}
                    </div>
                `
                historyContainer.insertAdjacentHTML('beforeend', cardHtml)
            })
        }

        const actionsContainer = document.getElementById('dUserActionsContainer')
        if (actionsContainer) {
            actionsContainer.innerHTML = ''
    
            const status = user.status || 'active'
            let buttonsHtml = ''
    
            if (status === 'active') {
                buttonsHtml = `
                    <button class="suspend-btn" style="background-color: #ffc107; color: #212529; border: none; padding: 10px 15px; border-radius: 8px; font-weight: 600; cursor: pointer;">Suspend User</button>
                    <button class="ban-btn" style="background-color: #dc3545; color: white; border: none; padding: 10px 15px; border-radius: 8px; font-weight: 600; cursor: pointer;">Ban User</button>
                `
            } else if (status === 'suspended') {
                buttonsHtml = `
                    <button class="active-btn" style="background-color: #28a745; color: white; border: none; padding: 10px 15px; border-radius: 8px; font-weight: 600; cursor: pointer;">Activate User</button>
                    <button class="ban-btn" style="background-color: #dc3545; color: white; border: none; padding: 10px 15px; border-radius: 8px; font-weight: 600; cursor: pointer;">Ban User</button>
                `
            } else if (status === 'banned') {
                buttonsHtml = `
                    <button class="active-btn" style="background-color: #28a745; color: white; border: none; padding: 10px 15px; border-radius: 8px; font-weight: 600; cursor: pointer;">Activate User</button>
                `
            }
    
            actionsContainer.innerHTML = buttonsHtml;
    
            const suspendBtn = actionsContainer.querySelector('.suspend-btn')
            const banBtn = actionsContainer.querySelector('.ban-btn')
            const activeBtn = actionsContainer.querySelector('.active-btn')
    
            if (suspendBtn) {
                suspendBtn.addEventListener('click', () => updateUserStatus(user.user_id, 'suspended'))
            }
            if (banBtn) {
                banBtn.addEventListener('click', () => updateUserStatus(user.user_id, 'banned'))
            }
            if (activeBtn) {
                activeBtn.addEventListener('click', () => updateUserStatus(user.user_id, 'active'))
            }
        }
    }
})

async function updateUserStatus(userId, newStatus) {
    try {
        const res = await fetch(`/api/manageUsers/${userId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        })

        if (!res.ok) throw new Error('Failed to update status.')
        
        userController.refresh()
    } catch (error) {
        console.error('Error updating status:', error)
    }
}

const userFilter = new ListController({
    searchInputSelector: '.search-bar',
    dropdownSelector: '.filter-dropdown-container',
    containerSelector: '#leftPanel', 
    itemSelector: '.request-card',   
    searchFields: ['.user-name', '.user-meta', 'eq-name', 'eq-type'], 

    filterCallback: (card, value) => {
        if (value === 'overdue') {
            return card.getAttribute('data-overdue') === 'true'
        }
        return true
    },

    sortCallback: (a, b, value) => {
        if (value === 'join_date') {
            return new Date(b.getAttribute('data-joined')) - new Date(a.getAttribute('data-joined'))
        }
        if (value === 'total_reservations') {
            return parseInt(b.getAttribute('data-reservations'), 10) - parseInt(a.getAttribute('data-reservations'), 10)
        }
        return 0
    }
})

function copyCredentials() {
    const name = document.getElementById('successFullName').textContent
    const email = document.getElementById('successEmail').textContent
    const password = document.getElementById('successPassword').textContent

    const textToCopy = `Name: ${name}\nEmail: ${email}\nPassword: ${password}`

    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            const feedback = document.getElementById('copyFeedback')
            if (feedback) {
                feedback.textContent = 'Credentials copied to clipboard'
            }
        })
        .catch(error => {
            console.error('Failed to copy text: ', error)
            alert('Failed to copy to clipboard. Please select the text and copy manually.')
        })
}

async function initManageUsers() {
    userDetails = await fetchUserDetails()
    renderLeftUserPanel(userDetails)
    setupPanelListeners
}

document.addEventListener("DOMContentLoaded", () => {
    const addAdminForm = document.querySelector('form#addAdmin')
    const addAdminError = document.getElementById('addAdminError')
    const addAdminModal = document.getElementById("addAdminModal")
    const addAdminSuccessModal = document.getElementById("addAdminSuccessModal")

    // Admin Modal Triggers
    window.openAdminModal = () => {
        if (addAdminModal) addAdminModal.classList.add("open")
    }
    window.closeAdminModal = () => {
        if (addAdminModal) addAdminModal.classList.remove("open")
        if (addAdminError) addAdminError.textContent = ""
        if (addAdminForm) addAdminForm.reset()
    }
    if (addAdminModal) {
        addAdminModal.addEventListener("click", function(e) {
            if (e.target === this) closeAdminModal()
        })
    }

    // Success Modal Triggers
    window.openAdminSuccessModal = () => {
        if (addAdminSuccessModal) addAdminSuccessModal.classList.add("open")
    }
    window.closeAdminSuccessModal = () => {
        if (addAdminSuccessModal) addAdminSuccessModal.classList.remove("open")
        const feedback = document.getElementById('copyFeedback')
        if (feedback) feedback.textContent = ''
    }
    if (addAdminSuccessModal) {
        addAdminSuccessModal.addEventListener("click", function(e) {
            if (e.target === this) closeAdminSuccessModal()
        })
    }

    if (addAdminForm) {
        addAdminForm.addEventListener('submit', async function(e) {
            e.preventDefault()
            if (addAdminError) addAdminError.textContent = ''

            const fullname = document.getElementById('adminAddFullname').value.trim()
            const email = document.getElementById('adminAddEmail').value.trim()
            const password = document.getElementById('adminAddPassword').value.trim()

            if (!fullname || !email || !password) {
                if (addAdminError) addAdminError.textContent = 'Missing field!'
                return
            }

            try {
                const res = await fetch('/api/auth/admin/add-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ fullname, email, password })
                })

                const data = await res.json()

                if (!res.ok) {
                    if (addAdminError) addAdminError.textContent = data.error || 'Failed to add admin'
                    return
                }

                closeAdminModal()

                document.getElementById('successFullName').textContent = fullname
                document.getElementById('successEmail').textContent = email
                document.getElementById('successPassword').textContent = password
                openAdminSuccessModal()
                
                userController.refresh();

            } catch (error) {
                console.error("Error adding admin:", error)
                if (addAdminError) addAdminError.textContent = 'Network error'
            }
        })
    }
})

function formatDate(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
}

function getHistoryStatusBadge(status) {
    if (!status) return '<span>N/A</span>'

     switch (status.toLowerCase()) {
        case 'approved':
            return '<span class="badge-approved">Approved</span>'
        case 'active':
            return '<span class="badge-active">Active</span>'
        case 'pending_return':
            return '<span class="badge-pending">Pending Return</span>'
        case 'overdue':
            return '<span class="badge-overdue">Overdue</span>'
        case 'completed':
            return '<span class="badge-completed">Completed</span>'
        case 'cancelled':
            return '<span class="badge-cancelled">Cancelled</span>'
        default:
            return `<span>${status}</span>`
    }
}