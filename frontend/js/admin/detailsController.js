class DetailsController {
    constructor({
        fetchUrl,
        leftPanelId = 'leftPanel',
        rightPanelId = 'rightPanel',
        placeholderId = 'rightPanelPlaceholder',
        detailsContainerId = 'rightPanelDetails',
        confirmBtnSelector = '.confirm-btn',
        leftPanelTitle = 'List',
        onInit = async () => {},
        renderCardHTML,
        populatedDetails,
        submitAction,
        idProperty = 'reservation_id'
    }) {
        this.token = localStorage.getItem('token')
        this.fetchUrl = fetchUrl
        this.leftPanelTitle = leftPanelTitle
        this.idProperty = idProperty

        this.leftPanel = document.getElementById(leftPanelId)
        this.rightPanel = document.getElementById(rightPanelId)
        this.placeholder = document.getElementById(placeholderId)
        this.detailsContainer = document.getElementById(detailsContainerId)
        this.confirmBtn = document.querySelector(confirmBtnSelector)

        this.onInit = onInit
        this.renderCardHTML = renderCardHTML
        this.populatedDetails = populatedDetails
        this.submitAction = submitAction

        this.items = []
        this.activeId = null
        
        this.start()
    }

    async start() {
        if (!this.leftPanel || !this.rightPanel) return

        // Run page-specific initializations
        await this.onInit()
        // Fetch and render list
        await this.refresh()
        this.setupListeners()
    }

    async refresh() {
        this.items = await this.fetchData()
        this.renderLeftPanel()
        this.updateRightPanel()
    }

    async fetchData() {
        try {
            const res = await fetch(this.fetchUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                }
            })

            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
            const data = await res.json()
            return data.requestsData || data.usersData || data.reservationsData || []

        } catch (error) {
            console.error('Error loading data: ', error)
            return []
        }
    }

    renderLeftPanel() {
        this.leftPanel.innerHTML = `<div class="panel-title">${this.leftPanelTitle}</div>`

        if (!this.items || this.items.length === 0) {
            this.leftPanel.insertAdjacentHTML('beforeend', '<div class="eq-meta" style="padding: 15px;">No items found.</div>')
            this.updateRightPanel(null)
            return
        }

        this.items.forEach((item, index) => {
            const cardHtml = this.renderCardHTML(item, index)
            this.leftPanel.insertAdjacentHTML('beforeend', cardHtml)
        })

        if (window.listController) {
            window.listController.apply();
        }


    }

    setupListeners() {
        // Handle card selection clicks
        this.leftPanel.addEventListener('click', (e) => {
            const card = e.target.closest('[data-index]')
            if (!card) return

            this.leftPanel.querySelectorAll('[data-index]').forEach(c => c.classList.remove('active'))
            card.classList.add('active')

            const index = parseInt(card.getAttribute('data-index'), 10)
            this.updateRightPanel(index)
        })

        // Handle confirm/submit button click
        if (this.confirmBtn) {
            // Replace button to clear old event listeners
            this.confirmBtn.replaceWith(this.confirmBtn.cloneNode(true))
            this.confirmBtn = document.querySelector('.confirm-btn')

            this.confirmBtn.addEventListener('click', async () => {
                if (!this.activeId) {
                    alert('Please select an item.')
                    return
                }

                const actionConfig = await this.submitAction(this.activeId)
                if (!actionConfig) return

                const success = await this.sendActionPayLoad(actionConfig)
                if (success) {
                    this.refresh()
                }
            })
        }
    }

    updateRightPanel(index) {
        const item = (index !== null && index !== undefined) ? this.items[index] : null

        if (!item) {
            this.activeId = null
            if (this.placeholder) this.placeholder.style.display = 'block'
            if (this.detailsContainer) this.detailsContainer.style.display = 'none'
            return
        }

        this.activeId = item[this.idProperty]
        if (this.placeholder) this.placeholder.style.display = 'none'
        if (this.detailsContainer) this.detailsContainer.style.display = 'block'

        this.populatedDetails(item)
    }

    async sendActionPayLoad({ url, method, body }) {
        try {
            const res = await fetch(url, {
                method: method || 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || 'Request failed.')
            }

            return true
        } catch (error) {
            console.error('Error submitting action details:', error)
            return false
        }

    }
}