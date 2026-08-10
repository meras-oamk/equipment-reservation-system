const express = require('express')
const router = express.Router()
const adminStatisticsHelpers = require('../helpers/adminStatistics')
const { authenticate, authorizeRole } = require('../helpers/role')

router.get('/dashboard-stats', authenticate, authorizeRole('admin'), async (req, res) => {
    try {
        const stats = await adminStatisticsHelpers.inventoryUtilization()
        const demandTrends = await adminStatisticsHelpers.demandTrends()
        const popularity = await adminStatisticsHelpers.popularity()

        return res.status(200).json({ stats, demandTrends, popularity })
    } catch (error) {
        console.log('Error get stats: ', error.message)
        return res.status(401).json({ error: error.message })
    }
})

router.get('/reservations-stats', authenticate, authorizeRole('admin'), async (req, res) => {
    try {
        const loanOutcomes = await adminStatisticsHelpers.loanOutcomes()
        const weeklyLoad = await adminStatisticsHelpers.weeklyLoad()
        const avgDuration = await adminStatisticsHelpers.avgDuration()

        return res.status(200).json({ loanOutcomes, weeklyLoad, avgDuration })
    } catch (error) {
        console.log('Error get stats: ', error.message)
        return res.status(401).json({ error: error.message })
    }
})

module.exports = router