const token = localStorage.getItem('token')
if (!token) {
    alert('Login to see contents!') 
    window.location.replace('../../loginOrRegister.html')
}

// =====================
// LOAD SETTINGS
// =====================

async function loadSettings() {
    try {
        const res = await fetch('/api/settings', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })

        if (res.status === 401) {
            localStorage.removeItem('token')
            window.location.replace('../../loginOrRegister.html')
            return
        }

        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)

        const settings = await res.json()

        document.querySelectorAll('[data-setting]').forEach(el => {
            const settingKey = el.dataset.setting
            const field = el.dataset.field
            const cat = el.dataset.cat
            const group = settings[settingKey]
            if (!group) return

            const value = cat ? group[cat]?.[field] : group[field]
            if (value === undefined) return

            if (el.type === 'checkbox') {
                el.checked = value
            } else {
                el.value = value
            }
        })
    } catch (error) {
        console.error('Failed to load settings:', error)
    }
}

// =====================
// EDIT / SAVE TOGGLE
// =====================

function collectSectionData(card, settingKey) {
    const fields = card.querySelectorAll(`[data-setting="${settingKey}"]`)
    const data = {}

    fields.forEach(el => {
        const field = el.dataset.field
        const cat = el.dataset.cat
        let value
        if (el.type === 'checkbox') value = el.checked
        else if (el.type === 'number') value = Number(el.value)
        else value = el.value

        if (cat) {
            if (!data[cat]) data[cat] = {}
            data[cat][field] = value
        } else {
            data[field] = value
        }
    })

    return data
}

async function saveSetting(card, settingKey) {
    const data = collectSectionData(card, settingKey)

    try {
        const res = await fetch(`/api/settings/${settingKey}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        })

        if (res.status === 401) {
            localStorage.removeItem('token')
            alert('Your token is expired or invalid. Please login again!')
            window.location.replace('../../loginOrRegister.html')
            return 
        }

        const result = await res.json()
        if (!res.ok) {
            alert(`Failed to save: ${result.error || 'Unknown error'}`)
            return false
        }
        return true
    } catch (error) {
        alert('Failed to connect to server.')
        return false
    }
}

async function toggleEdit(btn, settingKey) {
    const card = btn.closest('.section-card')
    const editing = btn.classList.contains('is-editing')

    if (editing) {
        // currently editing -> Save
        const ok = await saveSetting(card, settingKey)
        if (!ok) return

        btn.classList.remove('is-editing')
        card.querySelectorAll('input, select, textarea').forEach(el => el.disabled = true)
        btn.innerHTML = '<i class="bi bi-pencil"></i> Edit'
    } else {
        // currently locked -> Edit
        btn.classList.add('is-editing')
        card.querySelectorAll('input, select, textarea').forEach(el => el.disabled = false)
        btn.innerHTML = '<i class="bi bi-check-lg"></i> Save'
    }
}

document.addEventListener('DOMContentLoaded', loadSettings)
