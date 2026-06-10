const menuBtn = document.querySelector(".menu-btn");
const mobileMenu = document.querySelector(".mobile-menu");

menuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("show");
});

const categories = {
    vr: [
        "All VR",
        "VR Headsets",
        "VR Controllers",
        "VR Sensors"
    ],

    electronics: [
        "All Electronics",
        "Cameras",
        "Drones",
        "Microphones"
    ],

    laptops: [
        "All Laptops",
        "Gaming Laptops",
        "MacBooks",
        "Business Laptops"
    ]
};

const buttons = document.querySelectorAll('.btn-category');
const dropdown = document.getElementById('subcategoryDropdown');

buttons.forEach(button => {

    button.addEventListener('click', function() {

        // Active button color
        buttons.forEach(btn =>
            btn.classList.remove('active-category')
        );

        this.classList.add('active-category');

        // Update dropdown
        const category = this.dataset.category;
        const subcategories = categories[category];

        dropdown.innerHTML = '';

        subcategories.forEach(sub => {

            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;

            dropdown.appendChild(option);
        });

    });

});
document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', function (e) {
        e.preventDefault();

        const selectedSubcategory = this.dataset.subcategory;
        const selectedText = this.textContent;

        console.log('Selected:', selectedSubcategory);

        // Change button text
        const dropdownButton =
            this.closest('.dropdown').querySelector('.dropdown-toggle');

        dropdownButton.textContent = selectedText;

        // Filter equipment here
        filterEquipment(selectedSubcategory);
    });
});

function filterEquipment(subcategory) {
    console.log('Filtering by:', subcategory);
}
