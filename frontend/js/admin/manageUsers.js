const token = localStorage.getItem('token')
if (!token) {
    window.location.replace('../loginOrRegister.html')
}

const role = localStorage.getItem('role')
const name = localStorage.getItem('fullname')
const email = localStorage.getItem('email')

const userController = new DetailsController({
    fetchUrl: '/api/manageUsers/users',
    leftPanelTitle: 'Registered Users',
    idProperty: 'user_id',

    onInit: async function() {
        window.listController = new ListController({
            searchInputSelector: '.search-bar',
            dropdownSelector: '.filter-select',
            containerSelector: '#leftPanel', 
            itemSelector: '.user-card',   
            searchFields: ['.uname', '.search-payload'], 
    
            filterCallback: (card, value) => {
                const status = card.getAttribute('data-status')
                return status === value
            },
    
            sortCallback: (a, b, value) => {
                const timeA = new Date(a.getAttribute('data-joined')).getTime() || 0
                const timeB = new Date(b.getAttribute('data-joined')).getTime() || 0
                
                if (value === 'newest') return timeB - timeA
                if (value === 'oldest') return timeA - timeB

                return 0
            }          
        })

        const searchBar = document.querySelector('.search-bar')
        const filterSelect = document.querySelector('.filter-select')
        
        if (searchBar) {
            searchBar.addEventListener('input', resetRightPanel)
        }
        if (filterSelect) {
            filterSelect.addEventListener('change', resetRightPanel)
        }

        const originalRender = this.renderLeftPanel
        this.renderLeftPanel = function() {
            originalRender.call(this)
            updateUserStatistics(this.items)
        }
    },

    // Render left card list attaches the filtering attributes
    renderCardHTML: (user, index) => {
        const joinedDate = user.created_at
        const totalReservations = user.reservations.length || 0
        const overdue = user.overdue || 0
        const status = (user.status || 'active')

        const reservations = user.reservations || []
        const searchPayloadText = reservations.map(r => r.equipment?.category || '').join(' ')
        
        const overdueDisplay = overdue > 0 ? '' : 'display: none'
        let statusFlagDisplay = 'display: none'
        let statusFlagColor = ''

        if (status === 'banned') {
            statusFlagDisplay = ''
            statusFlagColor = '#dc3545'
        } else if (status === 'suspended') {
            statusFlagDisplay = ''
            statusFlagColor = '#ffc107'
        } else {
            statusFlagDisplay = 'display: none'
        }


        return `
            <div class="user-card" 
                 data-index="${index}" 
                 data-overdue="${overdue > 0}" 
                 data-joined="${joinedDate}"
                 data-reservations="${totalReservations}"
                 data-status="${status}">
                <div class="uname">${user.full_name}
                    <span class="overdue-tag" style="${statusFlagDisplay}">
                        <i class="bi bi-flag-fill" style="color: ${statusFlagColor};"></i>
                    </span>
                </div>
                <div class="uemail">${user.email}</div>
                <div class="umeta">${totalReservations} total reservations 
                    <span class="overdue-tag" style="${overdueDisplay}"><i class="bi bi-exclamation-triangle"></i> ${overdue} overdue</span>
                </div>
                <div class="search-payload" style="display: none;">${searchPayloadText}</div>
            </div>
        `
    },

    populatedDetails: (user) => {
        document.getElementById('dName').textContent = user.full_name
        const statusFlag = document.getElementById('dStatusFlag')
        if (statusFlag) {
            const status = (user.status || 'active')
            const flagIcon = statusFlag.querySelector('i')

            if (status === 'banned' || status === 'suspended') {
                statusFlag.style.display = 'inline-block'

                if (status === 'banned') {
                    flagIcon.style.color = '#dc3545'
                    statusFlag.title = 'Banned Account'
                } else if (status === 'suspended') {
                    flagIcon.style.color = '#f5a623'
                    statusFlag.title = 'Suspended Account'
                }
            } else {
                statusFlag.style.display = 'none'
            }
        }

        document.getElementById('dEmail').textContent = user.email
        document.getElementById('dId').textContent = user.user_id
        document.getElementById('dJoin').textContent = formatDate(user.created_at)

        const statusEl = document.getElementById('dStatus')
        if (statusEl) {
            const status = (user.status || 'active').toLowerCase()

            statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1)

            if (status === 'banned') {
                statusEl.style.color = '#dc3545'
            } else if (status === 'suspended') {
                statusEl.style.color = '#f5a623'
            } else {
                statusEl.style.color = '#28a745'
            }
        }

        const history = user.reservations || []

        const historyContainer = document.getElementById('dHistoryContainer')
        if (historyContainer) {    
            historyContainer.innerHTML = ''

            if (history.length === 0) {
                historyContainer.innerHTML = '<div class="eq-meta" style="padding: 10px 0; color: #888;">No reservation history found.</div>'
            } else {
                history.forEach(item => {
                    const category = (item.equipment.category).toUpperCase()
                    const eqName = item.equipment?.name || 'N/A'
                    const startDate = formatDate(item.start_time)
                    const endDate = formatDate(item.end_time)
                    const statusBadge = getHistoryStatusBadge(item.status)
                    
                    const cardHtml = `
                        <div class="history-card">
                            <div class="history-info">
                                <div class="h-name"> ${eqName}  -  ${category}</div>
                                <div class="h-dates">${startDate} → ${endDate}</div>
                            </div>
                            ${statusBadge}
                        </div>
                    `
                    historyContainer.insertAdjacentHTML('beforeend', cardHtml)
                })
            }
            
        }

        const actionsContainer = document.getElementById('dUserActionsContainer')
        if (actionsContainer) {
            actionsContainer.innerHTML = ''
    
            const status = user.status || 'active'
            let buttonsHtml = ''
    
            if (status === 'active') {
                buttonsHtml = `
                    <button class="user-action-btn suspend-btn">Suspend User</button>
                    <button class="user-action-btn ban-btn">Ban User</button>
                `
            } else if (status === 'suspended') {
                buttonsHtml = `
                    <button class="user-action-btn active-btn">Activate User</button>
                    <button class="user-action-btn ban-btn">Ban User</button>
                `
            } else if (status === 'banned') {
                buttonsHtml = `
                    <button class="user-action-btn active-btn">Activate User</button>
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

function resetRightPanel() {
    const placeholder = document.getElementById('rightPanelPlaceholder')
    const details = document.getElementById('rightPanelDetails')
    
    if (placeholder) placeholder.style.display = 'block'
    if (details) details.style.display = 'none'

    document.querySelectorAll('#leftPanel .user-card').forEach(card => {
        card.classList.remove('active')
    })
}

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

        if (res.status === 401) {
            localStorage.removeItem('token')
            window.location.replace('../../loginOrRegister.html')
            return
        }

        if (!res.ok) throw new Error('Failed to update status.')
        
        await userController.refresh()

        const index = userController.items.findIndex(user => user.user_id === userId)
        if (index !== -1) {
            userController.updateRightPanel(index)
            const card = document.querySelector(`#leftPanel [data-index="${index}"]`)
            if (card) {
                card.classList.add('active')
            }
        }

    } catch (error) {
        console.error('Error updating status:', error)
    }
}

function updateUserStatistics(users) {
    if (!users) return

    let total = users.length
    let active = 0
    let suspended = 0
    let banned = 0

    users.forEach(user => {
        const status = (user.status || 'active')

        if (status === 'active') {
            active++
        } else if (status === 'suspended') {
            suspended++
        } else if (status === 'banned') {
            banned++
        }
    })

    setStatValue('Total', total)
    setStatValue('Active', active)
    setStatValue('Suspended', suspended)
    setStatValue('Banned', banned)

}

function setStatValue(label, value) {
    const cards = document.querySelectorAll('.stat-card')
    cards.forEach(card => {
        const labelEl = card.querySelector('.stat-label')
        if (labelEl && labelEl.textContent.trim().toLowerCase() === label.toLowerCase()) {
            const valueEl = card.querySelector('.stat-value')
            if (valueEl) {
                valueEl.textContent = value
            }
        }
    })
}

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
                
                if (res.status === 401) {
                    localStorage.removeItem('token')
                    window.location.replace('../../loginOrRegister.html')
                    return
                }
                
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