let allEquipments = [];
const equipmentGrid =
    document.getElementById('equipmentGrid');

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

        renderEquipment(equipments);

    } catch (error) {

        console.error(error);

        equipmentGrid.innerHTML = `
            <div class="col-12 text-center">
                Failed to load equipment.
            </div>
        `;
    }
}
function searchEquipment(keyword) {

    keyword = keyword.toLowerCase().trim();

    if (!keyword) {
        renderEquipment(allEquipments);
        return;
    }

    const filtered = allEquipments.filter(item => {

        return (
            item.name?.toLowerCase().includes(keyword) ||
            item.category?.toLowerCase().includes(keyword) ||
            item.subcategory?.toLowerCase().includes(keyword)
        );

    });

    renderEquipment(filtered);
}
async function loadEquipment(category, subcategory) {

    try {

       const response = await fetch(
    `/api/equipment/catalog?category=${category}&subcategory=${encodeURIComponent(subcategory)}`
);

        const equipments =
            await response.json();

        renderEquipment(equipments);

    } catch (error) {

        console.error(error);

        equipmentGrid.innerHTML = `
            <div class="col-12 text-center">
                Failed to load equipment.
            </div>
        `;
    }
}

function renderEquipment(equipments) {

    equipmentGrid.innerHTML = '';

    if (equipments.length === 0) {

        equipmentGrid.innerHTML = `
            <div class="col-12 text-center">
                No equipment found.
            </div>
        `;

        return;
    }

    equipments.forEach(item => {

        equipmentGrid.innerHTML += `
            <div class="col-6 col-md-4">

                <div class="card equipment-card h-100">

                    <img
                        src="${item.image_url}"
                        class="card-img-top"
                        alt="${item.name}"
                    >

                    <div class="card-body">

                        <h6 class="equipment-name">
                            ${item.name}
                        </h6>

                        <small class="text-muted d-block mb-2">
                            ${item.subcategory}
                        </small>

                        <p class="small">
                            ${item.description}
                        </p>

                        <div class="availability">
                            <i class="bi bi-box-seam"></i>
                            Available quantity:
                            <strong>${item.available_count}</strong>
                        </div>

                    </div>

                </div>

            </div>
        `;
    });
}
document.querySelectorAll('.btn-category')
.forEach(button => {

    button.addEventListener('click', function() {

        document
            .querySelectorAll('.btn-category')
            .forEach(btn =>
                btn.classList.remove('active-category')
            );

        this.classList.add('active-category');
    });

});

window.addEventListener('DOMContentLoaded', () => {
    loadAllEquipment();
});
window.addEventListener('DOMContentLoaded', () => {

    loadAllEquipment();

    document
        .getElementById('searchInput')
        .addEventListener('input', (e) => {

            searchEquipment(e.target.value);

        });

});