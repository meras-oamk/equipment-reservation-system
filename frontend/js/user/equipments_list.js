let allEquipments = [];
let currentData = [];
let currentPage = 1;
const PAGE_SIZE = 18;
const equipmentGrid = document.getElementById('equipmentGrid');

    document.querySelectorAll('.dropdown-item').forEach(item => {

    item.addEventListener('click', function(e) {

        e.preventDefault();

        const dropdown = this.closest('.dropdown');

        document
            .querySelectorAll('.btn-category')
            .forEach(btn => {
                btn.classList.remove('active-category');
                btn.textContent = btn.dataset.label;
            });

        const categoryButton =
            dropdown.querySelector('.btn-category');

        categoryButton.classList.add('active-category');
        categoryButton.textContent = this.textContent;

        const category =
            categoryButton.dataset.category;

        const subcategory =
            this.dataset.subcategory;

        loadEquipment(category, subcategory);
    });

});
async function loadAllEquipment() {

    try {

        const response = await fetch(
            '/api/equipment/catalog'
        );

        const equipments =
            await response.json();

        allEquipments = equipments;
        currentData = equipments;
        currentPage = 1;
        renderEquipment();

    } catch (error) {

        console.error(error);

        equipmentGrid.innerHTML = `
            <p style="color:#888">Failed to load equipment.</p>
        `;
    }
}
function searchEquipment(keyword) {

    keyword = keyword.toLowerCase().trim();

    if (!keyword) {
        renderEquipment(allEquipments);
        return;
    }

    currentData = allEquipments.filter(item =>
        item.name?.toLowerCase().includes(keyword) ||
        item.category?.toLowerCase().includes(keyword) ||
        item.subcategory?.toLowerCase().includes(keyword)
    );
    currentPage = 1;
    renderEquipment();
}
async function loadEquipment(category, subcategory) {

    try {

        let url = `/api/equipment/catalog?category=${category}`;
        if (subcategory) url += `&subcategory=${encodeURIComponent(subcategory)}`;

        const response = await fetch(url);

        currentData = await response.json();
        currentPage = 1;
        renderEquipment();

    } catch (error) {

        console.error(error);

        equipmentGrid.innerHTML = `
            <p style="color:#888">Failed to load equipment.</p>
        `;
    }
}

function renderEquipment() {
    equipmentGrid.innerHTML = '';

    if (currentData.length === 0) {
        equipmentGrid.innerHTML = `<p style="color:#888;grid-column:1/-1">No equipment found.</p>`;
        renderPagination(0);
        return;
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = currentData.slice(start, start + PAGE_SIZE);

    pageItems.forEach(item => {
        const image = item.image_url || '../../assets/Equipment1.png';
        const desc = item.description ? item.description.replace(/^Details?:\s*/i, '') : '';
        equipmentGrid.innerHTML += `
            <a href="equipments_details.html?id=${item.id}" class="equipment-card">
                <img src="${image}" alt="${item.name}">
                <div class="card-body">
                    <div class="equipment-name">${item.name}</div>
                    <small class="text-muted d-block mb-2">${item.subcategory}</small>
                    <p class="small">${desc}</p>
                    <div class="availability">
                        <i class="bi bi-box-seam"></i>
                        Available: <strong>${item.available_count}</strong>
                    </div>
                </div>
            </a>
        `;
    });

    renderPagination(currentData.length);
}

function renderPagination(total) {
    let container = document.getElementById('pagination');
    if (!container) return;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    let html = `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">&#8592;</button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'page-active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">&#8594;</button>`;
    container.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    renderEquipment();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.goToPage = goToPage;

document.querySelectorAll('.btn-category')
.forEach(button => {

    button.addEventListener('click', function() {
        if (!this.classList.contains('active-category')) {
            document
                .querySelectorAll('.btn-category')
                .forEach(btn => {
                    btn.classList.remove('active-category');
                    btn.textContent = btn.dataset.label;
                });

            this.classList.add('active-category');
            loadEquipment(this.dataset.category);
        }
    });
});
document.querySelectorAll('.dropdown').forEach(dropdown => {
    dropdown.addEventListener('show.bs.dropdown', function(e) {
        const btn = this.querySelector('.btn-category');
        if (!btn.classList.contains('active-category')) {
            e.preventDefault();
        }
    });
});

window.addEventListener('DOMContentLoaded', () => {

    // Init Bootstrap dropdowns with fixed strategy to avoid overflow clipping on mobile
    document.querySelectorAll('.dropdown-toggle').forEach(el => {
        new bootstrap.Dropdown(el, {
            popperConfig: { strategy: 'fixed' }
        });
    });

    loadAllEquipment();

    document
        .getElementById('searchInput')
        .addEventListener('input', (e) => {

            searchEquipment(e.target.value);

        });

});