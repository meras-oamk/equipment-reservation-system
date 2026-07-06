const token = localStorage.getItem('token')

async function populatedConditionOptions() {
    try {
        const res = await fetch('/api/reservation/conditions', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json' ,
                'Authorization': `Bearer ${token}`
            }
        })

        if (res.status === 401) {
            localStorage.removeItem('token')
            alert('Your token is expired or invatid. Please login again!')
            window.location.replace('../../loginOrRegister.html')
            return []
        }

        if (!res.ok) {
            throw new Error('Failed to fetch conditions')
        }

        const { conditionOptions } = await res.json()
        const selectElement = document.querySelector('.condition-select')

        if (selectElement && conditionOptions) {
            selectElement.innerHTML = ''
            conditionOptions.forEach(condition => {
                const option = document.createElement('option')
                option.value = condition
                const withSpaces = condition.replace(/_/g, ' ')
                option.textContent = withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1)
                selectElement.appendChild(option)
            })
        }
    } catch (error) {
        console.error('Error loading condition options: ', error)
    }
}

function formatDate(isoString) {
    if (!isoString) return 'N/A';
    const clean = isoString.replace(' ', 'T').slice(0, 19)
    const [datePart, timePart] = clean.split('T')
    const [year, month, day] = datePart.split('-')
    const [hours, minutes] = timePart.split(':')
    return `${hours}:${minutes} &nbsp; ${day}/${month}/${year}`
}

document.addEventListener('DOMContentLoaded', () => {
    new DetailsController({
        fetchUrl: '/api/reservation/return-requests',
        leftPanelTitle: 'Return Requests',
        idProperty: 'reservation_id',
    
        onInit: async () => {
            await populatedConditionOptions()
        },
    
        renderCardHTML: (item, index) => {
            const eqName = item.equipment_name || `Equipment Type #${item.type_id}`
            const unitName = item.qr_code || `Unit #${item.unit_id}`
            const userName = item.full_name || `User ID: ${item.user_id}`
            return `
                <div class="request-card" data-index="${index}">
                    <div class="eq-name">${eqName}</div>
                    <div class="eq-meta">Unit: ${unitName}</div>
                    <div class="eq-meta">${userName}</div>
                </div>
            `
        },
    
        // Define right panel details
        populatedDetails: (r) => {
            document.querySelector('.inspection-note').value = ''
            const select = document.querySelector('.condition-select')
            if (select) select.selectedIndex = 0;
    
            document.getElementById('detailName').textContent     = r.equipment_name || `Equipment #${r.type_id}`
            document.getElementById('detailId').textContent       = r.reservation_id
            document.getElementById('detailUnit').textContent     = r.qr_code || r.unit_id
            document.getElementById('detailUser').textContent     = r.full_name || r.user_id
            document.getElementById('detailEmail').textContent    = r.email || 'No email provided'
            document.getElementById('detailLocation').textContent = r.location || 'Linnanmaa Kirjasto'
    
            document.getElementById('detailStart').innerHTML      = formatDate(r.start_time)
            document.getElementById('detailEnd').innerHTML        = formatDate(r.end_time)
            document.getElementById('detailReturn').innerHTML     = formatDate(r.return_scan_time)
        },
    
        submitAction: async (activeId) => {
            const condition = document.querySelector('.condition-select').value
            const notes = document.querySelector('.inspection-note').value
    
            return {
                url: `/api/reservation/${activeId}/return`,
                method: 'PUT',
                body: { condition, notes }
            }
        }
    })
})
