const token = localStorage.getItem('token')
const role = localStorage.getItem('role')
const name = localStorage.getItem('fullname')
const email = localStorage.getItem('email')

// let userDetails = []
// let activeUserId = null

// function copyCredentials() {
//     const name = document.getElementById('successFullName').textContent
//     const email = document.getElementById('successEmail').textContent
//     const password = document.getElementById('successPassword').textContent

//     const textToCopy = `Name: ${name}\nEmail: ${email}\nPassword: ${password}`

//     navigator.clipboard.writeText(textToCopy)
//         .then(() => {
//             const feedback = document.getElementById('copyFeedback')
//             if (feedback) {
//                 feedback.textContent = 'Credentials copied to clipboard'
//             }
//         })
//         .catch(error => {
//             console.error('Failed to copy text: ', error)
//             alert('Failed to copy to clipboard. Please select the text and copy manually.')
//         })
// }

// new ListController({
//     searchInputSelector: '.search-bar',
//     dropdownSelector: '.filter-dropdown-container',
//     containerSelector: '.table-wrap',
//     itemSelector: '.table-row',
//     searchFields: ['.user-name', '.user-email'],
//     filterCallback: (row, value) => {
//         if (value === 'overdue') {
//             return row.getAttribute('data-overdue') === 'true'
//         }
//         return true
//     },
//     sortCallback: (a, b, value) => {
//         if (value === 'join_date') {
//             return new Date(b.getAttribute('data-joined')) - new Date(a.getAttribute('data-joined'))
//         }
//         if (value === 'total_reservations') {
//             return parseInt(b.getAttribute('data-reservations'), 10) - parseInt(a.getAttribute('data-reservations'), 10)
//         }
//         return 0
//     }
// });

// document.addEventListener("DOMContentLoaded", () => {
//     initManageUsers()

//     const addAdminForm = document.querySelector('form#addAdmin')
//     const addAdminError = document.getElementById('addAdminError')
//     const addAdminModal = document.getElementById("addAdminModal")
//     const addAdminSuccessModal = document.getElementById("addAdminSuccessModal")

//     const addEquipmentModal = document.getElementById("addEquipmentModal")
//     const addEquipmentForm = document.querySelector("form#addEquipment")
//     const addEquipmentError = document.getElementById("addEquipmentError")

    
//     // Equipment Modal Triggers
//     window.openModal = () => {
//         if (addEquipmentModal) addEquipmentModal.classList.add("open")
//     }
//     window.closeModal = () => {
//         if (addEquipmentModal) addEquipmentModal.classList.remove("open")
//         if (addEquipmentForm) addEquipmentForm.reset()
//         if (addEquipmentError) addEquipmentError.textContent = ""
//     }
//     if (addEquipmentModal) {
//         addEquipmentModal.addEventListener("click", function(e) {
//             if (e.target === this) closeModal()
//         })
//     }

//     // Admin Modal Triggers
//     window.openAdminModal = () => {
//         if (addAdminModal) addAdminModal.classList.add("open")
//     }
//     window.closeAdminModal = () => {
//         if (addAdminModal) addAdminModal.classList.remove("open")
//         if (addAdminError) addAdminError.textContent = ""
//         if (addAdminForm) addAdminForm.reset()
//     }
//     if (addAdminModal) {
//         addAdminModal.addEventListener("click", function(e) {
//             if (e.target === this) closeAdminModal()
//         })
//     }

//     // Success Modal Triggers
//     window.openAdminSuccessModal = () => {
//         if (addAdminSuccessModal) addAdminSuccessModal.classList.add("open")
//     }
//     window.closeAdminSuccessModal = () => {
//         if (addAdminSuccessModal) addAdminSuccessModal.classList.remove("open")
//         const feedback = document.getElementById('copyFeedback')
//         if (feedback) feedback.textContent = ''
//     }
//     if (addAdminSuccessModal) {
//         addAdminSuccessModal.addEventListener("click", function(e) {
//             if (e.target === this) closeAdminSuccessModal()
//         })
//     }

//     if (addAdminForm) {
//         addAdminForm.addEventListener('submit', async function(e) {
//             e.preventDefault()
//             if (addAdminError) addAdminError.textContent = ''

//             const fullname = document.getElementById('adminAddFullname').value.trim()
//             const email = document.getElementById('adminAddEmail').value.trim()
//             const password = document.getElementById('adminAddPassword').value.trim()

//             if (!fullname || !email || !password) {
//                 if (addAdminError) addAdminError.textContent = 'Missing field!'
//                 return
//             }

//             try {
//                 const res = await fetch('http://localhost:3001/api/auth/admin/add-user', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': `Bearer ${token}`
//                     },
//                     body: JSON.stringify({ fullname, email, password })
//                 })

//                 const data = await res.json()

//                 if (!res.ok) {
//                     if (addAdminError) addAdminError.textContent = data.error || 'Failed to add admin'
//                     return
//                 }

//                 closeAdminModal()

//                 document.getElementById('successFullName').textContent = fullname
//                 document.getElementById('successEmail').textContent = email
//                 document.getElementById('successPassword').textContent = password
//                 openAdminSuccessModal()
                
//             } catch (error) {
//                 console.error("Error adding admin:", error)
//                 if (addAdminError) addAdminError.textContent = 'Network error'
//             }
//         })
//     }
// })

// async function initManageUsers() {
//     userDetails = await fetchUserDetails()
//     renderLeftUserPanel(userDetails)
//     setupPanelListeners
// }

function formatDate(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
}

const userController = new DetailsController({
    fetchUrl: '/api/manageUsers/users',
    leftPanelTitle: 'Registered Users',
    idProperty: 'user_id',

    // Render left card list attaches the filtering attributes
    renderCardHTML: (user, index) => {
        const joinedDate = user.created_at || user.joined_date || new Date().toISOString()
        const totalReservations = user.total_reservations || 0
        const hasOverdue = user.has_overdue || false

        return `
            <div class="user-card" 
                 data-index="${index}" 
                 data-overdue="${hasOverdue}" 
                 data-joined="${joinedDate}" 
                 data-reservations="${totalReservations}">
                <div class="uname">${user.full_name}</div>
                <div class="uemail">${user.email}</div>
                <div class="umeta">${totalReservations} total reservations</div>
            </div>
        `
    },

    populatedDetails: (user) => {
        document.getElementById('dName').textContent = user.full_name
        document.getElementById('dEmail').textContent = user.email
        document.getElementById('dId').textContent = user.id
        document.getElementById('dActive').textContent = user.is_active ? 'Active' : 'Inactive'
        document.getElementById('dJoin').textContent = formatDate(user.created_at)
        document.getElementById('dTotal').textContent = user.total_reservations || 0
        document.getElementById('dActive').textContent = user.active_count || 0
        document.getElementById('dOverdue').textContent = user.overdue_count || 0

        const historyContainer = document.getElementById('dHistoryContainer')
        if (historyContainer) {
            historyContainer.innerHTML = '<div class="eq-meta" style="padding: 10px 0;">Loading history...</div>'

            
        }
    }
})

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


