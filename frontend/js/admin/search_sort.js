class ListController {
    constructor ({
        searchInputSelector,
        dropdownSelector,
        containerSelector,
        itemSelector,
        searchFields = [],
        filterCallback,
        sortCallback
    }) {
        this.searchInput = document.querySelector(searchInputSelector)
        this.dropdownContainer = document.querySelector(dropdownSelector)
        this.container = document.querySelector(containerSelector)
        this.itemSelector = itemSelector
        this.searchFields = searchFields

        this.filterCallback = filterCallback || (() => true)
        this.sortCallback = sortCallback || (() => 0)

        this.searchQuery = ''
        this.activeFilter = 'all'
        this.activeSort = 'all'

        this.init()
    }

    init() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim()
                this.apply()
            })
        }

        if (this.dropdownContainer) { 
            this.dropdownContainer.addEventListener('change', (e) => {
                const select = e.target
                const selectedOption = select.options[select.selectedIndex]
                
                const type = selectedOption.getAttribute('data-type')
                const value = selectedOption.value

                if (type === 'filter') {
                    this.activeFilter = value
                } else if (type === 'sort') {
                    this.activeSort = value
                }

                this.apply()
            })
        }
    }

    apply() {
        const items = document.querySelectorAll(this.itemSelector)

        items.forEach(item => {
            let textToSearch = ''
            if (this.searchFields.length > 0) {
                textToSearch = this.searchFields
                    .map(sel => {
                        const el = item.querySelector(sel)
                        return el ? el.textContent : ''
                    })
                    .join(' ')
            } else {
                textToSearch = item.textContent
            }

            const matchesSearch = textToSearch.toLowerCase().includes(this.searchQuery)

            const matchesFilter = this.activeFilter === 'all' || this.filterCallback(item, this.activeFilter)

            if ( matchesSearch & matchesFilter) {
                item.style.display = ''
            } else {
                item.style.display = 'none'
            }
        })

        if (this.container && this.activeSort !== 'all') {
            const itemsArray = Array.from(this.container.querySelectorAll(this.itemSelector))

            itemsArray.sort((a, b) => this.sortCallback(a, b, this.activeSort))

            itemsArray.forEach(item => this.container.appendChild(item))
        }
    }
}