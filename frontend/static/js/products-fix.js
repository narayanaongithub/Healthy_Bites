// JavaScript for Products Page (Fixed version)

document.addEventListener("DOMContentLoaded", async function () {
  console.log("Product page fix loaded");

  // Initialize cart
  initializeCart();

  // Get page elements
  const productsList = document.querySelector(".products-list");
  const productCount = document.getElementById("productCount");
  const emptyProducts = document.querySelector(".empty-products");
  const productSearch = document.getElementById("productSearch");
  const sortBy = document.getElementById("sortBy");
  const resetFiltersBtn = document.getElementById("resetFilters");
  const clearFiltersBtn = document.getElementById("clearFilters");
  const categoryFilters = document.querySelectorAll(".category-filters input");

  // Current filter state
  let filterState = {
    search: "",
    categories: ["breakfast", "lunch", "dinner"],
    sort: "popularity",
  };

  // Add event listeners
  // Search input
  productSearch?.addEventListener("input", function () {
    filterState.search = this.value.toLowerCase();
    filterAndDisplayProducts();
  });

  // Sort select
  sortBy?.addEventListener("change", function () {
    filterState.sort = this.value;
    filterAndDisplayProducts();
  });

  // Category filters
  categoryFilters?.forEach((filter) => {
    filter.addEventListener("change", function () {
      updateCategoryFilters();
      filterAndDisplayProducts();
    });
  });

  // Reset filters button
  resetFiltersBtn?.addEventListener("click", function () {
    resetFilters();
  });

  // Clear filters button
  clearFiltersBtn?.addEventListener("click", function () {
    resetFilters();
  });

  // Initialize with URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const mealType = urlParams.get("mealType");

  if (mealType && ["breakfast", "lunch", "dinner"].includes(mealType)) {
    console.log("Setting up for specific meal type:", mealType);
    // Select only that meal type
    filterState.categories = [mealType];

    // Update the checkboxes to match
    categoryFilters.forEach((filter) => {
      filter.checked = filter.value === mealType;
    });

    // Update the page title
    const titleEl = document.querySelector(".products-header h1");
    if (titleEl) {
      titleEl.textContent = `${
        mealType.charAt(0).toUpperCase() + mealType.slice(1)
      } Products`;
    }

    // Update the description
    const descEl = document.querySelector(".products-header p");
    if (descEl) {
      const descriptions = {
        breakfast: "Start your day right with our nutritious breakfast options",
        lunch: "Fresh and energizing meals to power you through your day",
        dinner:
          "Complete your day with our nutritious and satisfying dinner choices",
      };

      descEl.textContent =
        descriptions[mealType] ||
        "Discover our selection of healthy and nutritious products";
    }
  }

  // Load initial products
  await filterAndDisplayProducts();

  // Update cart count
  updateCartCount();

  // Functions
  function updateCategoryFilters() {
    const selectedCategories = [];
    categoryFilters.forEach((filter) => {
      if (filter.checked) {
        selectedCategories.push(filter.value);
      }
    });

    // Update filter state
    if (selectedCategories.length > 0) {
      filterState.categories = selectedCategories;
    } else {
      // If no categories selected, select all by default
      filterState.categories = ["breakfast", "lunch", "dinner"];
      categoryFilters.forEach((filter) => {
        filter.checked = true;
      });
    }
  }

  function resetFilters() {
    // Reset search
    if (productSearch) {
      productSearch.value = "";
    }

    // Reset categories
    categoryFilters.forEach((filter) => {
      filter.checked = true;
    });

    // Reset sort
    if (sortBy) {
      sortBy.value = "popularity";
    }

    // Update filter state
    filterState = {
      search: "",
      categories: ["breakfast", "lunch", "dinner"],
      sort: "popularity",
    };

    // Reload products
    filterAndDisplayProducts();
  }

  async function filterAndDisplayProducts() {
    if (!productsList) return;

    // Show loading
    productsList.innerHTML = `
      <div class="loading-spinner" style="text-align: center; padding: 2rem;">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #0c3c30;"></i>
        <p>Loading products...</p>
      </div>
    `;

    try {
      // Fetch all products from API
      const allProducts = await fetchAllProducts();

      // Filter products
      let filteredProducts = allProducts;

      // Filter by category
      if (filterState.categories.length > 0) {
        filteredProducts = filteredProducts.filter((product) =>
          filterState.categories.includes(product.meal_type)
        );
      }

      // Filter by search
      if (filterState.search) {
        filteredProducts = filteredProducts.filter(
          (product) =>
            product.name.toLowerCase().includes(filterState.search) ||
            (product.description &&
              product.description.toLowerCase().includes(filterState.search))
        );
      }

      // Sort products
      filteredProducts = sortProducts(filteredProducts, filterState.sort);

      // Update product count
      if (productCount) {
        productCount.textContent = `(${filteredProducts.length})`;
      }

      // Display products or empty message
      if (filteredProducts.length > 0) {
        displayProducts(filteredProducts);
        if (emptyProducts) {
          emptyProducts.style.display = "none";
        }
      } else {
        productsList.innerHTML = "";
        if (emptyProducts) {
          emptyProducts.style.display = "flex";
        }
      }
    } catch (error) {
      console.error("Error filtering products:", error);
      productsList.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 2rem;">
          <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #ff5252;"></i>
          <p>Error loading products. Please try again later.</p>
        </div>
      `;
    }
  }

  function sortProducts(products, sortOption) {
    switch (sortOption) {
      case "price-low":
        return [...products].sort((a, b) => a.price - b.price);
      case "price-high":
        return [...products].sort((a, b) => b.price - a.price);
      case "name-asc":
        return [...products].sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return [...products].sort((a, b) => b.name.localeCompare(a.name));
      case "popularity":
      default:
        // Sort by featured first, then by ID (assuming lower IDs are more popular)
        return [...products].sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return a.id - b.id;
        });
    }
  }

  function displayProducts(products) {
    productsList.innerHTML = "";

    products.forEach((product) => {
      const productCard = createProductCard(product);
      productsList.appendChild(productCard);
    });
  }

  function createProductCard(product) {
    const card = document.createElement("div");
    card.className = "product-card";

    // Format price
    const formattedPrice = parseFloat(product.price).toFixed(2);

    // Tags
    const tagsHTML =
      product.tags && product.tags.length > 0
        ? `<div class="product-tags">${product.tags
            .map((tag) => `<span class="product-tag">${tag}</span>`)
            .join("")}</div>`
        : "";

    // Use appropriate image path
    const timestamp = new Date().getTime(); // Add timestamp to prevent caching
    const imagePath = product.image_url
      ? product.image_url.startsWith("http")
        ? product.image_url
        : `../static/images/${product.image_url}?t=${timestamp}`
      : "../static/images/default-meal.jpg?t=${timestamp}";

    card.innerHTML = `
      <div class="product-image">
        <img src="${imagePath}" alt="${product.name}">
        ${
          product.is_featured
            ? '<span class="featured-badge">Featured</span>'
            : ""
        }
      </div>
      <div class="product-content">
        <h3 class="product-title">${product.name}</h3>
        <p class="product-description">${
          product.description || "A delicious and nutritious meal option."
        }</p>
        ${tagsHTML}
        <div class="product-footer">
          <span class="product-price">$${formattedPrice}</span>
          <button class="add-to-cart-btn" data-product-id="${
            product.id
          }" onclick="addToCart(${JSON.stringify(product).replace(
      /"/g,
      "&quot;"
    )})">
            <i class="fas fa-cart-plus"></i> Add to Cart
          </button>
        </div>
      </div>
    `;

    return card;
  }

  async function fetchAllProducts() {
    try {
      const response = await fetch("http://localhost:5003/api/products");
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      console.log(`Fetched ${data.length} products from API`);

      // Process any string dietary tags into arrays
      data.forEach((product) => {
        if (product.dietary_tags && typeof product.dietary_tags === "string") {
          product.tags = product.dietary_tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag);
        } else if (Array.isArray(product.dietary_tags)) {
          product.tags = product.dietary_tags;
        } else {
          product.tags = [];
        }
      });

      return data;
    } catch (error) {
      console.error("Error fetching products:", error);
      // Return an empty array in case of error - don't use mock data
      return [];
    }
  }

  function getFallbackData() {
    // This function is kept empty as we're not using mock data
    return [];
  }
});

// Add to cart function
function addToCart(product) {
  // Get current cart from localStorage
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Check if product is already in cart
  const existingProductIndex = cart.findIndex((item) => item.id === product.id);

  if (existingProductIndex >= 0) {
    // Product exists, increase quantity
    cart[existingProductIndex].quantity += 1;
  } else {
    // Product doesn't exist, add to cart with quantity 1
    product.quantity = 1;
    cart.push(product);
  }

  // Save updated cart to localStorage
  localStorage.setItem("cart", JSON.stringify(cart));

  // Update cart count display
  updateCartCount();

  // Show notification
  showNotification(`Added ${product.name} to cart`);
}

// Update cart count
function updateCartCount() {
  const cartCountElement = document.getElementById("cartCount");
  if (cartCountElement) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCountElement.textContent = totalItems;
  }
}

// Show notification
function showNotification(message) {
  // Create notification element if it doesn't exist
  let notification = document.querySelector(".notification");
  if (!notification) {
    notification = document.createElement("div");
    notification.className = "notification";
    document.body.appendChild(notification);

    // Add styles
    notification.style.position = "fixed";
    notification.style.top = "20px";
    notification.style.right = "20px";
    notification.style.backgroundColor = "#0c3c30";
    notification.style.color = "white";
    notification.style.padding = "0.75rem 1.5rem";
    notification.style.borderRadius = "4px";
    notification.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";
    notification.style.transform = "translateX(120%)";
    notification.style.transition = "transform 0.3s ease";
    notification.style.zIndex = "1000";
  }

  // Set message and show notification
  notification.textContent = message;
  notification.style.transform = "translateX(0)";

  // Hide notification after 3 seconds
  setTimeout(() => {
    notification.style.transform = "translateX(120%)";
  }, 3000);
}

// Initialize cart
function initializeCart() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Check if cart exists
  if (!localStorage.getItem("cart")) {
    localStorage.setItem("cart", JSON.stringify([]));
  }

  // Update cart count
  updateCartCount();
}
