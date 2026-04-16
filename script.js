// State Management module pattern
const state = {
    allProducts: [],
    displayedProducts: [],
    cartCount: 0,
    categories: []
};

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    loadProducts();
});

function setupEventListeners() {
    document.getElementById("searchInput").addEventListener("input", (e) => handleSearch(e.target.value));
    document.getElementById("categoryFilter").addEventListener("change", (e) => handleCategoryFilter(e.target.value));
    document.getElementById("sortFilter").addEventListener("change", (e) => handleSort(e.target.value));
}

// Task 1 & 7: Fetch Data & Error Handling
async function loadProducts() {
    ui.showLoader(true);
    try {
        const res = await fetch("https://fakestoreapi.com/products");
        if (!res.ok) throw new Error("Network response was not ok");

        const data = await res.json();
        state.allProducts = data;
        state.displayedProducts = [...data];

        // Task 2: Extract unique categories
        state.categories = ["all", ...new Set(data.map(p => p.category))];

        ui.renderCategories(state.categories);
        ui.renderProducts(state.displayedProducts);
    } catch (error) {
        console.error("Error loading products:", error);
        ui.showError("Failed to load products. Please check your network and try again.");
    } finally {
        ui.showLoader(false);
    }
}

// Task 3: Search Functionality
function handleSearch(query) {
    const searchTerm = query.toLowerCase().trim();
    applyFilters(searchTerm, document.getElementById("categoryFilter").value);
}

// Task 2: Category Filter
function handleCategoryFilter(category) {
    applyFilters(document.getElementById("searchInput").value, category);
}

// Combines filters to allow compound filtering (search + category)
function applyFilters(searchTerm, category) {
    let filtered = state.allProducts;

    if (category !== "all") {
        filtered = filtered.filter(p => p.category === category);
    }

    if (searchTerm) {
        searchTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm)
        );
    }

    state.displayedProducts = filtered;

    const currentSort = document.getElementById("sortFilter").value;
    if (currentSort) {
        handleSort(currentSort);
    } else {
        ui.renderProducts(state.displayedProducts);
    }
}

// Task 5: Sort Logic
function handleSort(order) {
    let sorted = [...state.displayedProducts];
    if (order === "low") {
        sorted.sort((a, b) => a.price - b.price);
    } else if (order === "high") {
        sorted.sort((a, b) => b.price - a.price);
    }

    state.displayedProducts = sorted;
    ui.renderProducts(sorted);
}

// Task 6: Add to Cart (Global to be used in inline onclick)
window.addToCart = function () {
    state.cartCount++;
    ui.updateCartCount(state.cartCount);
}

// Task 4: Show Detail View
window.viewDetails = function (id) {
    const product = state.allProducts.find(p => p.id === id);
    if (product) {
        ui.showProductModal(product);
    }
}

// Task 8 & 10: Reusable UI Rendering Module
const ui = {
    renderProducts: (products) => {
        const container = document.getElementById("productContainer");
        container.innerHTML = "";

        if (products.length === 0) {
            container.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="text-muted fs-5">No products found matching your criteria.</div>
          <button class="btn btn-outline-primary mt-3" onclick="document.getElementById('searchInput').value=''; document.getElementById('categoryFilter').value='all'; handleSearch('');">Clear Filters</button>
        </div>`;
            return;
        }

        const html = products.map(p => `
      <div class="col-xl-3 col-lg-4 col-md-6 col-sm-12 mb-4 d-flex align-items-stretch">
        <div class="card w-100">
          <div class="card-img-top-wrapper">
            <img src="${p.image}" alt="${p.title}">
          </div>
          <div class="card-body d-flex flex-column">
            <h6 class="card-title text-truncate" title="${p.title}">${p.title}</h6>
            <span class="badge bg-light text-dark border mb-2 align-self-start text-capitalize">${p.category}</span>
            <div class="mt-auto pt-3 d-flex justify-content-between align-items-center mb-3">
              <span class="price-badge">$${p.price.toFixed(2)}</span>
              <div class="text-warning small fw-bold">
                ★ ${p.rating.rate} <span class="text-muted fw-normal">(${p.rating.count})</span>
              </div>
            </div>
            <div class="d-flex gap-2 mt-auto">
              <button class="btn btn-outline-primary flex-grow-1" onclick="viewDetails(${p.id})">Details</button>
              <button class="btn btn-primary flex-grow-1" onclick="addToCart()">Add to Cart</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

        container.innerHTML = html;
    },

    renderCategories: (categories) => {
        const dropdown = document.getElementById("categoryFilter");
        dropdown.innerHTML = categories.map(cat =>
            `<option value="${cat}">${cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}</option>`
        ).join('');
    },

    updateCartCount: (count) => {
        const el = document.getElementById("cartCount");
        el.innerText = count;
        // Tiny pop animation for visual feedback
        const badge = el.closest('.cart-badge');
        if (badge) {
            badge.style.transform = "scale(1.15)";
            setTimeout(() => { badge.style.transform = "scale(1)"; }, 150);
        }
    },

    showProductModal: (product) => {
        document.getElementById("modalTitle").innerText = product.title;
        document.getElementById("modalBody").innerHTML = `
      <div class="text-center mb-4 p-3 bg-light rounded-3">
        <img src="${product.image}" alt="${product.title}" style="max-height: 250px; object-fit: contain;">
      </div>
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="price-badge m-0">$${product.price.toFixed(2)}</h4>
        <span class="badge bg-warning text-dark fs-6 shadow-sm">★ ${product.rating.rate} (${product.rating.count} reviews)</span>
      </div>
      <span class="badge bg-light text-dark border mb-3 text-capitalize px-3 py-2 fs-6">${product.category}</span>
      <p class="text-secondary" style="line-height: 1.6; font-size: 1.05rem;">${product.description}</p>
    `;
        const modal = new bootstrap.Modal(document.getElementById("productModal"));
        modal.show();
    },

    showLoader: (show) => {
        const loader = document.getElementById("loader");
        const container = document.getElementById("productContainer");
        if (show) {
            loader.style.display = "flex";
            container.style.display = "none";
        } else {
            loader.style.display = "none";
            container.style.display = "flex";
        }
    },

    showError: (msg) => {
        document.getElementById("productContainer").innerHTML = `
      <div class="col-12 py-5">
        <div class="alert alert-danger d-flex align-items-center rounded-3 shadow-sm border-0" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-exclamation-triangle-fill flex-shrink-0 me-3" viewBox="0 0 16 16">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          </svg>
          <div>
            <strong>Opps!</strong> ${msg}
          </div>
        </div>
      </div>`;
        document.getElementById("productContainer").style.display = "flex";
    }
};
