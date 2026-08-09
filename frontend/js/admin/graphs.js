let demandLineChart = null
let popularityBarChart = null
let outcomesDoughnutChart = null
let weeklyLoadChart = null
let durationBarChart = null

const categoryDisplayMap = {
    'vr_ar': 'VR/AR',
    'robotics': 'Robotics',
    'audio_video': 'Audio/Video',
    'laboratory': 'Laboratory',
    'computing': 'Computing',
    'iot_embedded': 'IoT/Embedded'
}

// Doughnut center text
const centerTextPlugin = {
    id: 'centerTextPlugin',
    afterDraw(chart) {
        const { chartArea: { left, right, top, bottom } } = chart
        
        const centerX = (left + right) / 2
        const centerY = (top + bottom) / 2
        
        const container = chart.canvas.parentNode;
        const textDiv = container.querySelector('.doughnut-center-text')
        
        if (textDiv) {
            textDiv.style.left = `${centerX}px`
            textDiv.style.top = `${centerY}px`
            textDiv.style.transform = 'translate(-50%, -50%)'
            textDiv.style.position = 'absolute'
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initLineChart()
    initBarChart()

    initOutcomesChart()
    initWeeklyLoadChart()
    initDurationChart()

    fetchDashboardStats()
    fetchReservationStats()
})



function initLineChart() {
    const lineCanvas = document.getElementById('demandLineChart')
    if (!lineCanvas) return

    const lineCtx = lineCanvas.getContext('2d')
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
                    ticks: { color: '#888', font: { size: 11 } ,maxTicksLimit: 5, precision: 0 }
                }
            }
        }
    })
}

function initBarChart() {
    const barCanvas = document.getElementById('popularityBarChart')
    if (!barCanvas) return

    const barCtx = barCanvas.getContext('2d')
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
        document.querySelectorAll('utilizationSubtext').textContent = 'Error loading system metrics.'
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

    const labels = trends.map(t => t.week_label)
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

function initOutcomesChart() {
    const outcomesCanvas = document.getElementById('outcomesDoughnutChart')
    if (!outcomesCanvas) return

    const outcomesCtx = outcomesCanvas.getContext('2d')
    outcomesDoughnutChart = new Chart(outcomesCtx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Cancelled', 'Overdue', 'Approved', 'Active', 'Pending Return'],
            datasets: [{
                data: [0, 0, 0, 0, 0, 0],
                backgroundColor: [
                    '#2E7D32', 
                    '#757575', 
                    '#c62828', 
                    '#1565C0', 
                    '#17a2b8', 
                    '#ffc107'  
                ],
                borderWidth: 2,
                cutout: '72%' 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        padding: 10,
                        font: { size: 11, weight: '500' }
                    }
                }
            }
        },
        plugins: [centerTextPlugin]
    })
}

function initWeeklyLoadChart() {
    const weeklyLoadChartCanvas = document.getElementById('weeklyLoadChart')
    if (!weeklyLoadChartCanvas) return

    const loadCtx = weeklyLoadChartCanvas.getContext('2d')
    
    weeklyLoadChart = new Chart(loadCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Expected Returns',
                    data: [0, 0, 0, 0, 0, 0, 0], 
                    backgroundColor: '#1565C0',
                    borderRadius: 4,
                    barThickness: 20
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { boxWidth: 10, font: { size: 11 } }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 11 } }
                },
                y: {
                    beginAtZero: true,
                    border: { dash: [5, 5] },
                    ticks: { font: { size: 11 } }
                }
            }
        }
    })
}

function initDurationChart() {
    const durationCanvas = document.getElementById('durationBarChart')
    if (!durationCanvas) return

    const durationCtx = durationCanvas.getContext('2d')
    durationBarChart = new Chart(durationCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Avg. Hours',
                data: [], 
                backgroundColor: '#f5a623', 
                borderRadius: 4,
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
                    ticks: { font: { size: 11 } }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#333', font: { size: 11, weight: '500' } }
                }
            }
        }
    })
}

async function fetchReservationStats() {
    try {
        const token = localStorage.getItem('token')

        const res = await fetch('/api/stats/reservations-stats', {
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
        
        if (data.loanOutcomes) {
            updateOutcomesChart(data.loanOutcomes)
        }
        
        if (data.weeklyLoad) {
            updateWeeklyLoadChart(data.weeklyLoad)
        }
        
        if (data.avgDuration) {
            updateDurationChart(data.avgDuration)
        }
    } catch (error) {
        console.error('Error loading reservations statistics: ', error)
        document.querySelectorAll('utilizationSubtext').textContent = 'Error loading system metrics.'
    }
}

function updateOutcomesChart(loanOutcomes) {
    if (!outcomesDoughnutChart) return

    const outcomes = Object.fromEntries(
        loanOutcomes.map(({ status, total_reservations }) => [
            status,
            Number(total_reservations),
        ])
    )

    const dataPoints = [
        outcomes.completed,
        outcomes.cancelled,
        outcomes.overdue,
        outcomes.approved,
        outcomes.active,
        outcomes.pending_return
    ]

    outcomesDoughnutChart.data.datasets[0].data = dataPoints
    outcomesDoughnutChart.update()

    document.getElementById('outcomesTotal').textContent = outcomes.total
}

function updateWeeklyLoadChart(weeklyLoad) {
    if (!weeklyLoadChart) return
    
    const labels = weeklyLoad.map(d => d.day)
    const dataPoints = weeklyLoad.map(d => d.due_returns)

    weeklyLoadChart.data.labels = labels
    weeklyLoadChart.data.datasets[0].data = dataPoints
    weeklyLoadChart.update()
}

function updateDurationChart(avgDuration) {
    if (!durationBarChart) return

    const labels = avgDuration.map(d => categoryDisplayMap[d.category] || d.category)
    const dataPoints = avgDuration.map(d => d.avg_days)

    durationBarChart.data.labels = labels
    durationBarChart.data.datasets[0].data = dataPoints
    durationBarChart.update()
}

