let demandLineChart = null
let popularityBarChart = null

// Hardcoded categoties to clean frontend display labels
const categoryDisplayMap = {
    'vr_ar': 'VR/AR',
    'robotics': 'Robotics',
    'audio_video': 'Audio/Video',
    'laboratory': 'Laboratory',
    'computing': 'Computing',
    'iot_embedded': 'IoT/Embedded'
}

document.addEventListener('DOMContentLoaded', () => {
    initLineChart()
    initBarChart()

    fetchDashboardStats()
});

function initLineChart() {
    const lineCtx = document.getElementById('demandLineChart').getContext('2d')
    demandLineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Active Loans',
                data: [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 3,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#888', font: { size: 11 } }
                },
                y: {
                    border: { dash: [5, 5] },
                    ticks: { color: '#888', font: { size: 11 }, stepSize: 20 }
                }
            }
        }
    });
}

function initBarChart() {
    const barCtx = document.getElementById('popularityBarChart').getContext('2d')
    popularityBarChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Reservations',
                data: [],
                backgroundColor: '#f5a623',
                borderRadius: 6,
                barThickness: 16
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { border: { dash: [5, 5] } },
                    ticks: { color: '#888', font: { size: 11 } }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#333', font: { size: 12, weight: '500' } }
                }
            }
        }
    })
}

async function fetchDashboardStats() {
    try {
        const token = localStorage.getItem('token')
        
        const res = await fetch('/api/stats/dashboard-stats', {
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
        
        const data = await res.json()

        if (data.stats) {
            updateUtilizationCard(data.stats)
        }

        if (data.demandTrends) {
            updateLineChart(data.demandTrends)
        }

        if (data.popularity) {
            updateBarChart(data.popularity)
        }

    } catch (error) {
        console.error('Error loading dashboard statistics: ', error)
        document.getElementById('utilizationSubtext').textContent = 'Error loading system metrics.'
    }
}

function updateUtilizationCard(stats) {
    const rate = stats.utilization_rate
    const total = stats.total_units
    const active = stats.active_units

    const gradeInfo = getGradeInfo(rate)

    const gradePercentEl = document.getElementById('utilizationPercent')
    const subtextEl = document.getElementById('utilizationSubtext')

    if (gradePercentEl) {
        gradePercentEl.textContent = `${rate}%`
        gradePercentEl.style.color = gradeInfo.color
    }
    if (subtextEl) {
        subtextEl.textContent = `${gradeInfo.summary}. ${active} of ${total} modular units are currently active.`
    }

    const circle = document.getElementById('utilizationProgressCircle')
    if (circle) {
        const circumference = 251.2
        const clampedRate = Math.min(Math.max(rate, 0), 100)
        const offset = circumference - (clampedRate / 100) * circumference
        
        circle.style.strokeDashoffset = offset
        circle.style.stroke = gradeInfo.color
    }
}

function updateLineChart(trends) {
    if (!demandLineChart) return

    const labels = trends.map(t => formatDateLabel(t.week_start))
    const dataPoints = trends.map(t => t.reservation_count)

    demandLineChart.data.labels = labels
    demandLineChart.data.datasets[0].data = dataPoints
    
    demandLineChart.update()
}

function updateBarChart(popularity) {
    if (!popularityBarChart) return

    const labels = popularity.map(p => categoryDisplayMap[p.category] || p.category)
    const dataPoints = popularity.map(p => p.reservation_count)

    popularityBarChart.data.labels = labels
    popularityBarChart.data.datasets[0].data = dataPoints
    
    popularityBarChart.update()
}

function formatDateLabel(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date)) return dateString
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getGradeInfo(rate) {
    if (rate >= 85) {
        return { color: '#28a745', summary: 'Excellent efficiency' }
    } else if (rate >= 70) {
        return { color: '#17a2b8', summary: 'Optimal efficiency' }
    } else if (rate >= 50) {
        return { color: '#ffc107', summary: 'Moderate utilization' }
    } else if (rate >= 30) {
        return { color: '#fd7e14', summary: 'Low utilization' }
    } else {
        return { color: '#dc3545', summary: 'High equipment idle rate' }
    }
}