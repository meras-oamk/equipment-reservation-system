const token = localStorage.getItem('token')

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

    const addEquipmentModal = document.getElementById("addEquipmentModal")
    const addEquipmentForm = document.querySelector("form#addEquipment")
    const addEquipmentError = document.getElementById("addEquipmentError")

    
    // Equipment Modal Triggers
    window.openModal = () => {
        if (addEquipmentModal) addEquipmentModal.classList.add("open")
    }
    window.closeModal = () => {
        if (addEquipmentModal) addEquipmentModal.classList.remove("open")
        if (addEquipmentForm) addEquipmentForm.reset()
        if (addEquipmentError) addEquipmentError.textContent = ""
    }
    if (addEquipmentModal) {
        addEquipmentModal.addEventListener("click", function(e) {
            if (e.target === this) closeModal()
        })
    }

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
                const res = await fetch('http://localhost:3001/api/auth/admin/add-user', {
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
                
            } catch (error) {
                console.error("Error adding admin:", error)
                if (addAdminError) addAdminError.textContent = 'Network error'
            }
        })
    }
})