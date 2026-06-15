const token = localStorage.getItem('token')
// let returnRequests = []
// let activeReservationId = null

// document.addEventListener("DOMContentLoaded", () => {
//     initDashboard()
// })

// async function initDashboard() {
//     await populatedConditionOptions()
//     returnRequests = await fetchReturnRequests()
//     renderLeftPanel(returnRequests)
//     setupListeners()
// }

// async function fetchReturnRequests() {
//     try {
//         const res = await fetch('/api/reservation/return-requests', {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json' ,
//                 'Authorization': `Bearer ${token}`
//             }
//         })

//         if (!res.ok) {
//             throw new Error(`HTTP error! status: ${res.status}`)
//         }

//         const data = await res.json()
//         return data.requestsData || []

//     } catch (error) {
//         console.error('Error loading return requests:', error)
//         return []
//     }
// }

// async function populatedConditionOptions() {
//     try {
//         const res = await fetch('/api/reservation/conditions', {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json' ,
//                 'Authorization': `Bearer ${token}`
//             }
//         })

//         if (!res.ok) {
//             throw new Error('Failed to fetch conditions')
//         }

//         const { conditionOptions } = await res.json()
//         const selectElement = document.querySelector('.condition-select')

//         if (selectElement && conditionOptions) {
//             selectElement.innerHTML = ''
//             conditionOptions.forEach(condition => {
//                 const option = document.createElement('option')
//                 option.value = condition
//                 const withSpaces = condition.replace(/_/g, ' ')
//                 option.textContent = withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1)
//                 selectElement.appendChild(option)
//             })
//         }
//     } catch (error) {
//         console.error('Error loading condition options: ', error)
//     }
// }

// async function submitReturn(id, condition, notes) {
//     try {
//         const res = await fetch(`/api/reservation/${id}/return`, {
//             method: 'PUT',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${token}`
//             },
//             body: JSON.stringify({ condition, notes })
//         })

//         if (!res.ok) {
//             const errorData = await res.json()
//             throw new Error(errorData.error || 'Failed to complete return process.')
//         }

//         return true
//     } catch (error) {
//         console.error('Error submitting return details: ', error)
//         return false;
//     }
// }

// function renderLeftPanel(requests) {
//     const leftPanel = document.getElementById('leftPanel')
//     if (!leftPanel) return

//     leftPanel.innerHTML = '<div class="panel-title">Return Requests</div>'

//     if (!requests || requests.length === 0) {
//         leftPanel.insertAdjacentHTML('beforeend', '<div class="eq-meta" style="padding: 15px;">No pending requests.</div>')
//         activeReservationId = null
//         updateRightPanel(null)
//         return
//     }

//     requests.forEach((item, index) => {
//         const eqName = item.equipment_name || `Equipment Type #${item.type_id}`
//         const unitName = item.qr_code || `Unit #${item.unit_id}`
//         const userName = item.full_name || `User ID: ${item.user_id}`

//         const cardHtml = `
//             <div class="request-card" data-index="${index}">
//                 <div class="eq-name">${eqName}</div>
//                 <div class="eq-meta">Unit: ${unitName}</div>
//                 <div class="eq-meta">${userName}</div>
//             </div>
//         `;

//         leftPanel.insertAdjacentHTML('beforeend', cardHtml)
//     })

//         updateRightPanel(null)
// }

// function setupListeners() {
//     const leftPanel = document.getElementById('leftPanel')
//     const confirmBtn = document.querySelector('.confirm-btn')
//     if (!leftPanel) return

//     if (leftPanel) {
//         leftPanel.addEventListener('click', (e) => {
//             const card = e.target.closest('.request-card')
//             if (!card) return
    
//             document.querySelectorAll('.request-card').forEach(c => c.classList.remove('active'))
        
//             card.classList.add('active')
    
//             const index = parseInt(card.getAttribute('data-index'), 10)
    
//             updateRightPanel(index)
//         })
//     }

//     if (confirmBtn) {
//         confirmBtn.addEventListener('click', async () => {
//             if (!activeReservationId) {
//                 alert('Please select a return request first.')
//                 return
//             }

//             const condition = document.querySelector('.condition-select').value
//             const notes = document.querySelector('.inspection-note').value

//             const isSuccess = await submitReturn(activeReservationId, condition, notes)

//             if (isSuccess) {
//                 initDashboard()
//             }
//         })
//     }
// }

// function updateRightPanel(index) {
//     const placeholder = document.getElementById('rightPanelPlaceholder')
//     const detailsContainer = document.getElementById('rightPanelDetails')

//     if (!rightPanel) return

//     const r = (index !== null && index !== undefined) ? returnRequests[index] : null

//     if (!r) {
//         activeReservationId = null

//         if (placeholder) placeholder.style.display = 'block'
//         if (detailsContainer) detailsContainer.style.display = 'none'

//         return
//     }

//     activeReservationId = r.reservation_id;
//     if (placeholder) placeholder.style.display = 'none'
//     if (detailsContainer) detailsContainer.style.display = 'block'

//     document.querySelector('.inspection-note').value = ''
//     const select = document.querySelector('.condition-select')
//     if (select) select.selectedIndex = 0

//     document.getElementById('detailName').textContent     = r.equipment_name || `Equipment #${r.type_id}`
//     document.getElementById('detailId').textContent       = r.reservation_id
//     document.getElementById('detailUnit').textContent     = r.qr_code || r.unit_id
//     document.getElementById('detailUser').textContent     = r.full_name || r.user_id
//     document.getElementById('detailEmail').textContent    = r.email || 'No email provided'
//     document.getElementById('detailLocation').textContent = r.location || 'Linnanmaa Kirjasto'

//     document.getElementById('detailStart').innerHTML      = formatDate(r.start_time)
//     document.getElementById('detailEnd').innerHTML        = formatDate(r.end_time)
//     document.getElementById('detailReturn').innerHTML     = formatDate(r.return_time)
// }



async function populatedConditionOptions() {
    try {
        const res = await fetch('/api/reservation/conditions', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json' ,
                'Authorization': `Bearer ${token}`
            }
        })

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
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
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
            document.getElementById('detailReturn').innerHTML     = formatDate(r.return_time)
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
