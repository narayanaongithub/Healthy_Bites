// JavaScript for Products Page

// DOM elements
const productsList = document.querySelector(".products-list");
const productCount = document.getElementById("productCount");
const emptyProducts = document.querySelector(".empty-products");
const productSearch = document.getElementById("productSearch");
const priceRange = document.getElementById("priceRange");
const priceValue = document.getElementById("priceValue");
const sortBy = document.getElementById("sortBy");
const resetFiltersBtn = document.getElementById("resetFilters");
const clearFiltersBtn = document.getElementById("clearFilters");
const categoryFilters = document.querySelectorAll(".category-filters input");
const dietaryFilters = document.querySelectorAll(".dietary-filters input");

// Admin elements
const adminControls = document.getElementById("adminControls");
const addProductBtn = document.getElementById("addProductBtn");
const inventoryBtn = document.getElementById("inventoryBtn");
const addProductModal = document.getElementById("addProductModal");
const inventoryModal = document.getElementById("inventoryModal");
const addProductForm = document.getElementById("addProductForm");
const inventoryTableBody = document.getElementById("inventoryTableBody");
const closeButtons = document.querySelectorAll(".close-btn");
const cancelButtons = document.querySelectorAll(".cancel-btn");

// Current filter state
let filterState = {
  search: "",
  categories: ["breakfast", "lunch", "dinner"],
  dietary: [],
  maxPrice: 50,
  sort: "popularity",
};

// Check if user is admin
function checkIfAdmin() {
  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  return userData.isAdmin === true;
}

// Initialize the page
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded event fired");
  const currentPage = window.location.pathname.split("/").pop();
  console.log("Current page:", currentPage);

  // Initialize cart
  console.log("Initializing cart...");
  initializeCart();

  // Check current page and load appropriate content
  console.log("Checking which page to initialize...");

  // Initialize specific pages
  if (currentPage === "products.html") {
    console.log("Initializing products page...");
    initProductPage();
  } else if (
    ["breakfast.html", "lunch.html", "dinner.html"].includes(currentPage)
  ) {
    const mealType = currentPage.replace(".html", "");
    console.log(`Loading ${mealType} products...`);

    // Use loadMealProducts for our meal-specific pages
    loadMealProducts(mealType);
  } else if (currentPage === "admin-products.html") {
    console.log("Checking admin status for admin-products page...");
    if (checkIfAdmin()) {
      console.log("User is admin, initializing admin page...");
      initAdminPage();
    } else {
      console.log("User is not admin, redirecting to index...");
      window.location.href = "index.html";
    }
  } else if (currentPage === "index.html" || currentPage === "") {
    console.log("Loading popular products for homepage...");
    // Load popular products for homepage
    loadPopularProducts();
  } else if (currentPage === "test-meals.html") {
    console.log("Test meals page loaded");
  } else {
    console.log("Page not recognized:", currentPage);
  }
});

// Initialize the page
async function initProductPage() {
  console.log("initProductPage: Starting initialization");

  // Get all relevant elements
  const productsList = document.querySelector(".products-list");
  console.log("initProductPage: productsList found?", !!productsList);

  const emptyProducts = document.querySelector(".empty-products");
  console.log("initProductPage: emptyProducts found?", !!emptyProducts);

  const productCount = document.getElementById("productCount");
  console.log("initProductPage: productCount found?", !!productCount);

  const categoryFilters = document.querySelectorAll(".category-filters input");
  console.log(
    "initProductPage: categoryFilters found?",
    categoryFilters.length
  );

  const productSearch = document.getElementById("productSearch");
  console.log("initProductPage: productSearch found?", !!productSearch);

  const sortBy = document.getElementById("sortBy");
  console.log("initProductPage: sortBy found?", !!sortBy);

  const resetFiltersBtn = document.getElementById("resetFilters");
  console.log("initProductPage: resetFiltersBtn found?", !!resetFiltersBtn);

  const clearFiltersBtn = document.getElementById("clearFilters");
  console.log("initProductPage: clearFiltersBtn found?", !!clearFiltersBtn);

  // Reset filter state
  console.log("initProductPage: Resetting filter state");
  filterState = {
    search: "",
    categories: ["breakfast", "lunch", "dinner"],
    sort: "popularity",
  };

  // Check if URL contains mealType parameter
  const urlParams = new URLSearchParams(window.location.search);
  const mealType = urlParams.get("mealType");
  console.log("initProductPage: URL mealType parameter:", mealType);

  if (mealType && ["breakfast", "lunch", "dinner"].includes(mealType)) {
    console.log(
      "initProductPage: Setting up for specific meal type:",
      mealType
    );
    // Select only that meal type
    filterState.categories = [mealType];

    // Update the checkboxes to match
    categoryFilters.forEach((filter) => {
      filter.checked = filter.value === mealType;
    });

    // Update the page title to reflect the selected meal type
    const titleEl = document.querySelector(".products-header h1");
    if (titleEl) {
      titleEl.textContent = `${
        mealType.charAt(0).toUpperCase() + mealType.slice(1)
      } Products`;
    }

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
  } else {
    console.log(
      "initProductPage: No specific meal type, showing all categories"
    );
    // Initialize the category checkboxes
    updateCategoryFilters();
  }

  // Show admin controls if user is admin
  const adminControls = document.getElementById("adminControls");
  if (adminControls && checkIfAdmin()) {
    console.log("initProductPage: User is admin, showing admin controls");
    adminControls.style.display = "block";
  }

  // Load products
  console.log(
    "initProductPage: Loading products with filter state:",
    filterState
  );

  // Add event listeners
  console.log("initProductPage: Setting up event listeners");
  addEventListeners();

  // Load products
  filterAndDisplayProducts();

  // Load cart count
  console.log("initProductPage: Updating cart count");
  updateCartCount();
}

// Add event listeners
function addEventListeners() {
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
  resetFiltersBtn?.addEventListener("click", resetFilters);

  // Clear filters button
  clearFiltersBtn?.addEventListener("click", resetFilters);

  // Admin buttons
  if (addProductBtn) {
    addProductBtn.addEventListener("click", function () {
      addProductModal.style.display = "block";
    });
  }

  if (inventoryBtn) {
    inventoryBtn.addEventListener("click", function () {
      populateInventoryTable();
      inventoryModal.style.display = "block";
    });
  }

  // Close buttons for modals
  closeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      addProductModal.style.display = "none";
      inventoryModal.style.display = "none";
    });
  });

  // Cancel buttons for modals
  cancelButtons.forEach((button) => {
    button.addEventListener("click", function () {
      addProductModal.style.display = "none";
      inventoryModal.style.display = "none";
    });
  });

  // Close modals when clicking outside
  window.addEventListener("click", function (event) {
    if (event.target === addProductModal) {
      addProductModal.style.display = "none";
    }
    if (event.target === inventoryModal) {
      inventoryModal.style.display = "none";
    }
  });

  // Add product form submission
  if (addProductForm) {
    addProductForm.addEventListener("submit", function (e) {
      e.preventDefault();
      addNewProduct();
    });
  }

  // Save inventory changes
  const saveInventoryBtn = document.querySelector(".save-inventory-btn");
  if (saveInventoryBtn) {
    saveInventoryBtn.addEventListener("click", saveInventoryChanges);
  }

  // Cancel inventory changes
  const cancelInventoryBtn = document.querySelector(".cancel-inventory-btn");
  if (cancelInventoryBtn) {
    cancelInventoryBtn.addEventListener("click", function () {
      inventoryModal.style.display = "none";
    });
  }
}

// Update category filters array based on checkboxes
function updateCategoryFilters() {
  filterState.categories = [];
  categoryFilters.forEach((filter) => {
    if (filter.checked) {
      filterState.categories.push(filter.value);
    }
  });
}

// Reset all filters to default
function resetFilters() {
  // Reset search
  if (productSearch) {
    productSearch.value = "";
    filterState.search = "";
  }

  // Reset category filters (all checked)
  categoryFilters.forEach((filter) => {
    filter.checked = true;
  });
  updateCategoryFilters();

  // Reset sort
  if (sortBy) {
    sortBy.value = "popularity";
    filterState.sort = "popularity";
  }

  // Reload products
  filterAndDisplayProducts();
}

async function filterAndDisplayProducts() {
  try {
    let products = [];

    // Multiple API calls approach - one per selected meal type
    // This ensures we get the right number of products per category
    const selectedCategories = filterState.categories;
    console.log("Selected meal types:", selectedCategories);

    // If no categories selected, show empty state
    if (selectedCategories.length === 0) {
      displayProducts([]);
      return;
    }

    // Show loading state
    const productsList = document.querySelector(".products-list");
    if (productsList) {
      productsList.innerHTML = `
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Loading products...</p>
        </div>
      `;
    }

    // Make a separate API call for each selected meal type
    const promises = selectedCategories.map(async (mealType) => {
      try {
        const apiBaseUrl = "http://localhost:5000"; // Direct access to API Gateway
        const cacheBuster = new Date().getTime();
        const response = await fetch(
          `${apiBaseUrl}/api/products/meal/${mealType}?_=${cacheBuster}`
        );

        if (!response.ok) {
          console.error(
            `Error fetching ${mealType} products:`,
            response.status
          );
          return [];
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error(`Invalid content type for ${mealType}:`, contentType);
          return [];
        }

        const rawText = await response.text();
        try {
          const mealProducts = JSON.parse(rawText);
          console.log(`Loaded ${mealProducts.length} ${mealType} products`);

          // Limit to 6 products per meal type to ensure consistent numbers
          return mealProducts.slice(0, 6);
        } catch (error) {
          console.error(`Error parsing ${mealType} products:`, error);
          return [];
        }
      } catch (error) {
        console.error(`Error fetching ${mealType} products:`, error);
        return [];
      }
    });

    // Wait for all API calls to complete
    const results = await Promise.all(promises);

    // Combine all products into a single array
    products = results.flat();

    // Apply search filter if needed
    if (filterState.search) {
      const searchTerm = filterState.search.toLowerCase();
      products = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm)
      );
    }

    // Sort products
    products = sortProducts(products, filterState.sort);

    // Display products
    console.log(`Displaying ${products.length} products`);
    displayProducts(products);
  } catch (error) {
    console.error("Error fetching and filtering products:", error);
    displayProducts([]);
  }
}

// Helper function to sort products
function sortProducts(products, sortOption) {
  const sortedProducts = [...products];

  switch (sortOption) {
    case "price-low":
      sortedProducts.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      sortedProducts.sort((a, b) => b.price - a.price);
      break;
    case "name-asc":
      sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
      break;
    default: // popularity
      sortedProducts.sort((a, b) => b.popularity - a.popularity);
      break;
  }

  return sortedProducts;
}

// Function to display products
function displayProducts(products, mealType) {
  // Try to find the appropriate container (meal-container or products-list)
  const mealContainer = document.querySelector(".meal-container");
  const productsList = document.querySelector(".products-list");

  // Choose which container to use
  let container = mealContainer || productsList;

  // Add null check to prevent errors
  if (!container) {
    console.error(
      "displayProducts: No .meal-container or .products-list element found in the DOM"
    );
    return;
  }

  // Update product count display if it exists
  if (productCount) {
    productCount.textContent = `(${products.length})`;
  }

  if (!products || products.length === 0) {
    container.innerHTML = `
      <div class="no-meals">
        <p>No ${mealType || "products"} available at the moment.</p>
      </div>
    `;

    // Show empty products message if it exists
    if (emptyProducts && container === productsList) {
      emptyProducts.style.display = "block";
    }

    return;
  }

  // Hide empty products message if it exists and we have products
  if (emptyProducts && container === productsList) {
    emptyProducts.style.display = "none";
  }

  // Generate appropriate HTML based on container type
  if (container === mealContainer) {
    // Meal container format (for meal-specific pages)
    let html = "";

    // Add timestamp for cache busting
    const timestamp = new Date().getTime();

    products.forEach((product) => {
      // Get meal type from product
      const productMealType = product.meal_type || mealType || "default";

      // Special handling for image paths
      let imagePath = product.image_url || "";

      // Special handling for known image file differences
      if (imagePath === "breakfast-2.jpg") {
        imagePath = "breakfast-2.jpeg";
      }

      // Special handling for lunch-6 which might exist in webp format
      if (productMealType === "lunch" && imagePath === "lunch-6.webp") {
        imagePath = "lunch-6.jpg";
      }

      // For lunch images, ensure we use jpg format
      if (productMealType === "lunch" && imagePath.endsWith(".webp")) {
        imagePath = imagePath.replace(".webp", ".jpg");
      }

      // Default image if none provided
      if (!imagePath) {
        imagePath = `${productMealType}.jpg`;
      }

      // Use a specific fallback image for each meal type
      const fallbackImage =
        productMealType === "lunch"
          ? "lunch.webp"
          : productMealType === "dinner"
          ? "dinner.jpg"
          : "breakfast.jpg";

      html += `
        <div class="meal-card">
          <img src="../static/images/${imagePath}?t=${timestamp}" alt="${
        product.name
      }"
               onerror="this.onerror=null; this.src='../static/images/${fallbackImage}?t=${timestamp}';">
          <div class="meal-info">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="meal-details">
              <div class="nutrition">
                <span><i class="fas fa-fire"></i> 450 cal</span>
                <span><i class="fas fa-drumstick-bite"></i> 35g protein</span>
              </div>
              <div class="price">$${product.price.toFixed(2)}</div>
            </div>
            <button class="add-to-cart" data-product-id="${
              product.id
            }">Add to Cart</button>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  } else {
    // Products list format (for main products page)
    container.innerHTML = products
      .map((product) => createProductCard(product))
      .join("");
  }

  // Add event listeners to the add-to-cart buttons
  document.querySelectorAll(".add-to-cart").forEach((button, index) => {
    button.addEventListener("click", function () {
      const productId = this.getAttribute("data-product-id");
      // If productId exists, use it; otherwise use the product from the array
      if (productId) {
        addToCart(products.find((p) => p.id == productId));
      } else {
        addToCart(products[index]);
      }
    });
  });
}

function createProductCard(product) {
  const isOutOfStock = product.inventory_count <= 0;
  const dietaryTags = Array.isArray(product.dietary_tags)
    ? product.dietary_tags
    : (product.dietary_tags || "")
        .split(",")
        .filter((tag) => tag.trim() !== "");

  // Get meal type from product
  const productMealType = product.meal_type || "default";

  // Add timestamp for cache busting
  const timestamp = new Date().getTime();

  // Properly handle image paths
  let imagePath = product.image_url || "";

  // Special handling for known image file differences
  if (imagePath === "breakfast-2.jpg") {
    imagePath = "breakfast-2.jpeg";
  }

  // Special handling for lunch-6 which might exist in webp format
  if (productMealType === "lunch" && imagePath === "lunch-6.webp") {
    imagePath = "lunch-6.jpg";
  }

  // For lunch images, ensure we use jpg format
  if (productMealType === "lunch" && imagePath.endsWith(".webp")) {
    imagePath = imagePath.replace(".webp", ".jpg");
  }

  if (!imagePath) {
    imagePath =
      productMealType !== "default"
        ? `${productMealType}.jpg`
        : "default-meal.jpg";
  }

  // Use specific fallback image for each meal type
  const fallbackImage =
    productMealType === "lunch"
      ? "lunch.webp"
      : productMealType === "dinner"
      ? "dinner.jpg"
      : "breakfast.jpg";

  // If not a full URL, add the static path
  const imageUrl = imagePath.startsWith("http")
    ? imagePath
    : `../static/images/${imagePath}?t=${timestamp}`;

  return `
    <div class="product-card ${isOutOfStock ? "out-of-stock" : ""}" data-id="${
    product.id
  }" data-meal-type="${product.meal_type || ""}">
      <div class="product-image">
        <img src="${imageUrl}" alt="${product.name}" 
             onerror="this.onerror=null; this.src='../static/images/${fallbackImage}?t=${timestamp}';" />
        ${
          isOutOfStock
            ? '<div class="out-of-stock-label">Out of Stock</div>'
            : ""
        }
        ${
          product.meal_type
            ? `<div class="product-category meal-type-${
                product.meal_type
              }">${formatTag(product.meal_type)}</div>`
            : ""
        }
      </div>
      <div class="product-content">
        <h3>${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-tags">
          ${dietaryTags
            .map(
              (tag) => `<span class="tag tag-${tag}">${formatTag(tag)}</span>`
            )
            .join("")}
        </div>
        <div class="product-details">
          <div class="product-nutrition">
            ${
              product.calories
                ? `<span><i class="fas fa-fire"></i> ${product.calories} cal</span>`
                : ""
            }
            ${
              product.protein
                ? `<span><i class="fas fa-drumstick-bite"></i> ${product.protein}g protein</span>`
                : ""
            }
            ${
              product.fiber
                ? `<span><i class="fas fa-leaf"></i> ${product.fiber}g fiber</span>`
                : ""
            }
          </div>
          <div class="product-price-cart">
            <span class="product-price">$${product.price.toFixed(2)}</span>
            <button class="add-to-cart" ${isOutOfStock ? "disabled" : ""}>
              <i class="fas fa-cart-plus"></i> Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Helper function to format tag names
function formatTag(tag) {
  return tag
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Helper function to get category name from ID
function getCategoryName(categoryId) {
  const categories = {
    1: "Vegan",
    2: "Vegetarian",
    3: "Protein-Rich",
    4: "Low-Carb",
    5: "Gluten-Free",
  };
  return categories[categoryId] || "Other";
}

function addToCart(product) {
  // Get existing cart from localStorage
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Check if product is already in cart
  const existingProductIndex = cart.findIndex((item) => item.id === product.id);

  if (existingProductIndex !== -1) {
    // Increment quantity if product already in cart
    cart[existingProductIndex].quantity += 1;
  } else {
    // Add product to cart with quantity 1
    const newProduct = { ...product, quantity: 1 };
    cart.push(newProduct);
  }

  // Save cart back to localStorage
  localStorage.setItem("cart", JSON.stringify(cart));

  // Update cart count
  updateCartCount();

  // Show notification
  showNotification(`${product.name} added to cart!`);
}

function showNotification(message) {
  // Check if notification container exists
  let notificationContainer = document.querySelector(".notification-container");

  // Create notification container if it doesn't exist
  if (!notificationContainer) {
    notificationContainer = document.createElement("div");
    notificationContainer.className = "notification-container";
    document.body.appendChild(notificationContainer);
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-check-circle"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close"><i class="fas fa-times"></i></button>
  `;

  // Add notification to container
  notificationContainer.appendChild(notification);

  // Add close event listener
  notification
    .querySelector(".notification-close")
    .addEventListener("click", () => {
      notification.classList.add("hide");
      setTimeout(() => {
        notification.remove();
      }, 300);
    });

  // Auto remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.add("hide");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Check if updateCartCount is defined, if not, define it
if (typeof updateCartCount !== "function") {
  console.log("Defining missing updateCartCount function");
  function updateCartCount() {
    console.log("updateCartCount: Updating cart count");
    try {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const totalItems = cart.reduce(
        (total, item) => total + (item.quantity || 1),
        0
      );

      const cartCountElements = document.querySelectorAll(".cart-count");
      cartCountElements.forEach((element) => {
        if (element) {
          element.textContent = totalItems;
        }
      });

      console.log(`updateCartCount: Cart has ${totalItems} items`);
    } catch (error) {
      console.error("updateCartCount: Error updating cart count:", error);
    }
  }
}

// Function to load meal-specific products and dynamically generate the meal cards
async function loadMealProducts(mealType) {
  console.log(`loadMealProducts: Attempting to load ${mealType} products...`);

  // Show loading spinner
  const mealsGrid = document.querySelector(".meals-grid");
  if (!mealsGrid) {
    console.error("loadMealProducts: No meals-grid element found in the DOM");
    return;
  }

  // Show loading spinner
  mealsGrid.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading ${mealType} options...</p>
    </div>
  `;

  try {
    // Use direct URL to API Gateway instead of relative URL
    const apiBaseUrl = "http://localhost:5000"; // Direct access to API Gateway
    console.log(
      `loadMealProducts: Fetching from: ${apiBaseUrl}/api/products/meal/${mealType}`
    );

    let response;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        // Add cache-busting parameter to ensure we get fresh data
        const cacheBuster = new Date().getTime();
        response = await fetch(
          `${apiBaseUrl}/api/products/meal/${mealType}?_=${cacheBuster}`
        );
        if (response.ok) break;

        retryCount++;
        console.log(
          `loadMealProducts: Retry ${retryCount}/${maxRetries} - Status: ${response.status}`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
      } catch (fetchError) {
        console.error(
          `loadMealProducts: Fetch error on attempt ${retryCount + 1}:`,
          fetchError
        );
        retryCount++;
        if (retryCount >= maxRetries) throw fetchError;
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
      }
    }

    console.log("loadMealProducts: Response status:", response.status);

    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    console.log("loadMealProducts: Content-Type:", contentType);

    // Get raw text first to handle parsing manually
    const rawText = await response.text();
    console.log(
      `loadMealProducts: Response raw text (first 50 chars): ${rawText.substring(
        0,
        50
      )}`
    );

    // Parse JSON manually to handle any issues
    let products;
    try {
      products = JSON.parse(rawText);
      console.log(
        `loadMealProducts: Successfully parsed JSON data with ${products.length} products`
      );

      // Debug image URLs
      console.log("Image URLs in API response:");
      products.forEach((product, index) => {
        console.log(
          `Product ${index + 1} (${product.name}): image_url = "${
            product.image_url
          }"`
        );
      });
    } catch (jsonError) {
      console.error("loadMealProducts: JSON parsing error:", jsonError);

      // Try to fix malformed JSON if possible
      if (rawText.trim().startsWith("[") && rawText.trim().endsWith("]")) {
        // It looks like JSON array but maybe has some invisible characters
        try {
          // Try removing non-ASCII characters and parse again
          const cleanText = rawText.replace(/[^\x20-\x7E]/g, "");
          products = JSON.parse(cleanText);
          console.log(
            `loadMealProducts: Successfully parsed cleaned JSON data with ${products.length} products`
          );
        } catch (error) {
          throw new Error(
            "Failed to parse API response as JSON even after cleaning"
          );
        }
      } else {
        throw new Error("API response is not JSON");
      }
    }

    // Clear the existing content
    mealsGrid.innerHTML = "";

    if (!Array.isArray(products)) {
      console.error("loadMealProducts: API did not return an array:", products);
      throw new Error("API did not return an array of products");
    }

    if (products.length === 0) {
      console.log(
        `loadMealProducts: No ${mealType} meals found, showing empty state`
      );
      mealsGrid.innerHTML = `<div class="no-meals">No meals available in this category.</div>`;
      return;
    }

    // Render meal cards
    renderMealCards(products, mealType, mealsGrid);
  } catch (error) {
    console.error(`Error loading ${mealType} products:`, error);
    mealsGrid.innerHTML = `
      <div class="error-message">
        <h3>Error loading meals from database</h3>
        <p>${error.message}</p>
        <p>Please check that all backend services are running:</p>
        <ul>
          <li>API Gateway (port 5000)</li>
          <li>Product Service (port 5003)</li>
          <li>Database (port 3307)</li>
        </ul>
        <p>Try running: <code>docker-compose ps</code> to verify services</p>
        <p>If services are not running, start them with: <code>docker-compose up -d</code></p>
        <button class="retry-button" onclick="location.reload()">Retry</button>
      </div>
    `;

    // Fall back to mock data if available
    fallbackToMockData(mealType, mealsGrid);
  }
}

// Helper function to fall back to mock data
async function fallbackToMockData(mealType, container) {
  try {
    console.log(`Attempting to load mock ${mealType} data as fallback...`);

    // Use direct URL to API Gateway instead of relative URL
    const apiBaseUrl = "http://localhost:5000"; // Direct access to API Gateway

    // Try multiple times with increasing delays
    let mockResponse = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        mockResponse = await fetch(`${apiBaseUrl}/api/mock/${mealType}`);
        if (mockResponse.ok) break;

        console.log(
          `Mock data attempt ${attempt}/3 failed with status ${mockResponse.status}`
        );
        await new Promise((resolve) => setTimeout(resolve, attempt * 500)); // Increasing delay
      } catch (e) {
        console.log(`Mock data attempt ${attempt}/3 failed with error`, e);
        if (attempt === 3) throw e;
        await new Promise((resolve) => setTimeout(resolve, attempt * 500)); // Increasing delay
      }
    }

    if (!mockResponse || !mockResponse.ok) {
      throw new Error(
        `Mock API returned status: ${mockResponse?.status || "unknown"}`
      );
    }

    // Get the raw text and parse it manually to avoid issues
    const rawText = await mockResponse.text();
    console.log(
      `Mock data raw text (first 50 chars): ${rawText.substring(0, 50)}`
    );

    // Parse the JSON manually
    let mockData;
    try {
      mockData = JSON.parse(rawText);
    } catch (jsonError) {
      console.error(`Error parsing mock ${mealType} data as JSON:`, jsonError);
      throw new Error("Mock API response is not JSON");
    }

    if (Array.isArray(mockData) && mockData.length > 0) {
      console.log(
        `Successfully loaded mock ${mealType} data with ${mockData.length} items`
      );
      container.innerHTML = `
        <div class="warning-message">
          <p>Using sample data - database connection issue detected.</p>
        </div>
      `;
      renderMealCards(mockData, mealType, container);
    } else {
      throw new Error("Mock API did not return an array of products");
    }
  } catch (mockError) {
    console.error(`Error loading mock ${mealType} data:`, mockError);
    // We already have an error message displayed, so just log this error
  }
}

// Helper function to render meal cards
function renderMealCards(products, mealType, container) {
  // Clear the container first
  container.innerHTML = "";

  console.log(`Rendering ${products.length} meal cards for ${mealType}`);

  // Add timestamp for cache busting
  const timestamp = new Date().getTime();

  products.forEach((product) => {
    const mealCard = document.createElement("div");
    mealCard.className = "meal-card";
    mealCard.dataset.id = `${mealType}-${product.id}`;
    mealCard.dataset.price = product.price;

    // Convert popularity (0-100) to rating (0-5)
    const rating = ((product.popularity || 80) / 20).toFixed(1);

    // Get image path from database with better debugging
    let imagePath = product.image_url || "";
    console.log(
      `Processing image for ${product.name} (ID: ${product.id}), original path: "${imagePath}"`
    );

    // Special handling for known image file differences
    if (imagePath === "breakfast-2.jpg") {
      imagePath = "breakfast-2.jpeg";
      console.log(`Changed breakfast-2.jpg to breakfast-2.jpeg`);
    }

    // Special handling for lunch-6 which might exist in webp format
    if (mealType === "lunch" && imagePath === "lunch-6.webp") {
      imagePath = "lunch-6.jpg";
      console.log(
        `Changed lunch-6.webp to lunch-6.jpg which is the correct file`
      );
    }

    // Default fallback if no image is available
    if (!imagePath) {
      imagePath = `${mealType}.jpg`;
      console.log(`No image path found, using default: ${imagePath}`);
    }

    // For lunch, make sure we use the jpg format
    if (mealType === "lunch" && imagePath.endsWith(".webp")) {
      imagePath = imagePath.replace(".webp", ".jpg");
      console.log(`Changed lunch webp to jpg: ${imagePath}`);
    }

    // Remove any leading slash
    if (imagePath.startsWith("/")) {
      imagePath = imagePath.substring(1);
      console.log(`Removed leading slash from path: ${imagePath}`);
    }

    // Force lowercase extension to ensure matching with files
    if (imagePath.includes(".")) {
      const [baseName, extension] = imagePath.split(".");
      imagePath = `${baseName}.${extension.toLowerCase()}`;
      console.log(`Normalized extension to lowercase: ${imagePath}`);
    }

    console.log(`Final image path: "../static/images/${imagePath}"`);

    // Use a specific fallback image for each meal type
    const fallbackImage =
      mealType === "lunch"
        ? "lunch.webp"
        : mealType === "dinner"
        ? "dinner.jpg"
        : "breakfast.jpg";

    mealCard.innerHTML = `
      <div class="meal-image">
        <img 
          src="../static/images/${imagePath}?t=${timestamp}" 
          alt="${product.name}" 
          onerror="this.onerror=null; this.src='../static/images/${fallbackImage}?t=${timestamp}'; console.error('Failed to load image: ../static/images/${imagePath}');"
        />
        <div class="meal-rating">
          <i class="fas fa-star"></i>
          <span>${rating}</span>
        </div>
      </div>
      <div class="meal-content">
        <h3>${product.name}</h3>
        <p class="meal-description">
          ${product.description}
        </p>
        <div class="meal-details">
          <div class="meal-nutrition">
            ${
              product.calories
                ? `<span><i class="fas fa-fire"></i> ${product.calories} cal</span>`
                : ""
            }
            ${
              product.protein
                ? `<span><i class="fas fa-drumstick-bite"></i> ${product.protein}g protein</span>`
                : ""
            }
            ${
              product.fiber
                ? `<span><i class="fas fa-leaf"></i> ${product.fiber}g fiber</span>`
                : ""
            }
          </div>
          <div class="meal-price-cart">
            <span class="meal-price">$${parseFloat(product.price).toFixed(
              2
            )}</span>
            <button class="add-to-cart">
              <i class="fas fa-cart-plus"></i> Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;

    // Add the meal card to the container
    container.appendChild(mealCard);

    // Add event listener for add to cart button
    const addToCartBtn = mealCard.querySelector(".add-to-cart");
    addToCartBtn.addEventListener("click", () => {
      addToCart(product);
    });

    // Additional check after rendering to verify image loaded
    const img = mealCard.querySelector("img");
    img.addEventListener("load", () => {
      console.log(`Image loaded successfully: ${img.src}`);
    });
    img.addEventListener("error", () => {
      console.error(`Failed to load image: ${img.src}, trying fallback`);
      img.src = `../static/images/${fallbackImage}`;
    });
  });
}

// Function to load popular products for homepage
async function loadPopularProducts() {
  try {
    const response = await fetch("/api/products/popular?limit=6");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const products = await response.json();

    // Get featured meals container
    const featuredMeals = document.querySelector(".featured-meals");
    if (!featuredMeals) return;

    // Clear any existing content
    featuredMeals.innerHTML = "";

    if (products.length === 0) {
      featuredMeals.innerHTML =
        '<div class="no-meals">No featured meals available.</div>';
      return;
    }

    // Generate HTML for featured meal cards
    products.forEach((product) => {
      const mealCard = document.createElement("div");
      mealCard.className = "meal-card";

      mealCard.innerHTML = `
        <div class="meal-image">
          <img src="../static/images/${product.image_url}" alt="${
        product.name
      }" />
          <div class="meal-tag">${formatTag(product.meal_type)}</div>
        </div>
        <h3>${product.name}</h3>
        <p>${product.description.substring(0, 80)}${
        product.description.length > 80 ? "..." : ""
      }</p>
        <div class="meal-price">$${product.price.toFixed(2)}</div>
        <button class="add-to-cart-btn" data-id="${
          product.id
        }">Add to Cart</button>
      `;

      // Add to container
      featuredMeals.appendChild(mealCard);

      // Add event listener
      const addToCartBtn = mealCard.querySelector(".add-to-cart-btn");
      addToCartBtn.addEventListener("click", () => {
        addToCart(product);
      });
    });
  } catch (error) {
    console.error("Error loading popular products:", error);
    const featuredMeals = document.querySelector(".featured-meals");
    if (featuredMeals) {
      featuredMeals.innerHTML = `<div class="error-message">Error loading featured meals: ${error.message}</div>`;
    }
  }
}

// Populate inventory table
function populateInventoryTable() {
  // Clear table
  inventoryTableBody.innerHTML = "";

  // Add each product to table
  products.forEach((product) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div class="product-info">
          <img src="${product.image}" alt="${product.name}" />
          <div>
            <strong>${product.name}</strong>
            <div>${product.description.substring(0, 50)}...</div>
          </div>
        </div>
      </td>
      <td>${product.category}</td>
      <td>
        <input type="number" class="stock-input" value="${
          product.stock
        }" min="0" data-id="${product.id}" />
      </td>
      <td>
        <div class="action-btns">
          <button class="action-btn edit-btn" data-id="${product.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete-btn" data-id="${product.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;

    // Add event listeners to buttons
    const editBtn = row.querySelector(".edit-btn");
    const deleteBtn = row.querySelector(".delete-btn");

    editBtn.addEventListener("click", function () {
      // In a real app, this would open an edit modal
      showNotification(`Editing ${product.name}`);
    });

    deleteBtn.addEventListener("click", function () {
      deleteProduct(product.id);
    });

    inventoryTableBody.appendChild(row);
  });
}

// Save inventory changes
function saveInventoryChanges() {
  // Get all stock inputs
  const stockInputs = document.querySelectorAll(".stock-input");

  // Update product stock values
  stockInputs.forEach((input) => {
    const productId = parseInt(input.dataset.id);
    const newStock = parseInt(input.value);

    // Find product and update stock
    const product = products.find((p) => p.id === productId);
    if (product) {
      product.stock = newStock;
    }
  });

  // Update display
  filterAndDisplayProducts();

  // Close modal
  inventoryModal.style.display = "none";

  // Show notification
  showNotification("Inventory updated successfully!");
}

// Delete product
function deleteProduct(productId) {
  // Confirm deletion
  if (confirm("Are you sure you want to delete this product?")) {
    // Remove product from array
    products = products.filter((product) => product.id !== productId);

    // Update inventory table
    populateInventoryTable();

    // Update display
    filterAndDisplayProducts();

    // Show notification
    showNotification("Product deleted successfully!");
  }
}

// User menu functionality
const userMenuBtn = document.getElementById("userMenuBtn");
const userDropdown = document.getElementById("userDropdown");

if (userMenuBtn && userDropdown) {
  userMenuBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    userDropdown.classList.toggle("active");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
      userDropdown.classList.remove("active");
    }
  });
}

// Logout functionality
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", function () {
    // Clear user login state
    localStorage.removeItem("userLoggedIn");
    localStorage.removeItem("userData");
    // The href in the HTML already handles the redirect
  });
}

// Fetch products from database
async function fetchProducts(mealType) {
  try {
    console.log(`Fetching ${mealType} products...`);

    // Use direct API Gateway URL
    const apiBaseUrl = "http://localhost:5000";
    const endpoint = `${apiBaseUrl}/api/products/meal/${
      mealType || "breakfast"
    }`;

    // Find container elements - check what's available
    const mealContainer = document.querySelector(".meal-container");
    const mealsGrid = document.querySelector(".meals-grid");
    const productsList = document.querySelector(".products-list");

    // Determine which container to use
    let container = mealContainer || mealsGrid || productsList;

    // Show loading spinner if any container exists
    if (container) {
      // Different loading display based on container type
      if (container === productsList) {
        container.innerHTML = `
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading products...</p>
          </div>
        `;
      } else {
        showLoadingSpinner();
      }
    } else {
      console.error("No valid container found in DOM");
      return; // Exit early if no containers exist
    }

    console.log(`Fetching from: ${endpoint}`);
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check content type for JSON before trying to parse
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("API response is not JSON");
    }

    // Get raw text and try to parse manually
    const rawText = await response.text();
    let products;

    try {
      products = JSON.parse(rawText);
      console.log(`Fetched ${products.length} ${mealType} products:`, products);
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError);
      throw new Error("Failed to parse API response as JSON");
    }

    // Check which container we need to use and display products accordingly
    if (mealContainer || productsList) {
      displayProducts(products, mealType);
    } else if (mealsGrid) {
      console.log("Using renderMealCards for meals-grid");
      // Since we already have the products, directly render them
      mealsGrid.innerHTML = "";
      renderMealCards(products, mealType, mealsGrid);
    }
  } catch (error) {
    console.error("Error fetching products:", error);

    // Handle the error based on available containers
    const mealContainer = document.querySelector(".meal-container");
    const mealsGrid = document.querySelector(".meals-grid");
    const productsList = document.querySelector(".products-list");

    // Determine which container to use for error messages
    if (mealContainer) {
      mealContainer.innerHTML = getErrorMessageHTML(error.message);
    } else if (mealsGrid) {
      mealsGrid.innerHTML = getErrorMessageHTML(error.message);
      // Try to load mock data as a fallback
      fallbackToMockData(mealType, mealsGrid);
    } else if (productsList) {
      productsList.innerHTML = getErrorMessageHTML(error.message);
      // Show empty products message
      const emptyProducts = document.querySelector(".empty-products");
      if (emptyProducts) {
        emptyProducts.style.display = "block";
        // Find paragraph element in emptyProducts
        const errorMessage = emptyProducts.querySelector("p");
        if (errorMessage) {
          errorMessage.innerHTML = `
            Error connecting to the database: ${error.message}<br><br>
            Please check that all backend services are running:<br>
            - API Gateway (port 5000)<br>
            - Product Service (port 5003)<br>
            - Database (port 3307)<br><br>
            Try running: <code>docker-compose ps</code> to verify services<br>
            If services are not running, start them with: <code>docker-compose up -d</code>
          `;
        }
      }
    }
  }
}

// Helper function to generate error message HTML
function getErrorMessageHTML(errorMessage) {
  return `
    <div class="error-message">
      <h3>Error loading meals from database</h3>
      <p>${errorMessage}</p>
      <p>Please check that all backend services are running:</p>
      <ul>
        <li>API Gateway (port 5000)</li>
        <li>Product Service (port 5003)</li>
        <li>Database (port 3307)</li>
      </ul>
      <p>Try running: <code>docker-compose ps</code> to verify services</p>
      <p>If services are not running, start them with: <code>docker-compose up -d</code></p>
      <button class="retry-button" onclick="location.reload()">Retry</button>
    </div>
  `;
}

// Get the meal type from the current page
function getMealTypeFromPage() {
  const path = window.location.pathname;
  if (path.includes("breakfast")) return "breakfast";
  if (path.includes("lunch")) return "lunch";
  if (path.includes("dinner")) return "dinner";
  return "breakfast"; // Default fallback
}

// Helper functions for UI state
function showLoadingSpinner() {
  // First check for meal-container, then fall back to meals-grid
  const container = document.querySelector(".meal-container");
  if (container) {
    container.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading meal options...</p>
      </div>
    `;
  } else {
    const mealsGrid = document.querySelector(".meals-grid");
    if (mealsGrid) {
      mealsGrid.innerHTML = `
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Loading meal options...</p>
        </div>
      `;
    }
  }
}

function hideLoadingSpinner() {
  const spinner = document.querySelector(".loading-spinner");
  if (spinner) {
    spinner.remove();
  }
}

function displayErrorMessage(message) {
  const container = document.querySelector(".meal-container");
  if (container) {
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>${message}</p>
      </div>
    `;
  }
}

// Add new product to database
async function addNewProduct(productData) {
  try {
    const apiBaseUrl = "http://localhost:5000";
    const response = await fetch(`${apiBaseUrl}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    if (response.ok) {
      showNotification("Product added successfully", "success");
      fetchProducts(); // Refresh product list
    } else {
      throw new Error("Failed to add product");
    }
  } catch (error) {
    console.error("Error adding product:", error);
    showNotification("Error adding product", "error");
  }
}

// Update product in database
async function updateProduct(productId, productData) {
  try {
    const apiBaseUrl = "http://localhost:5000";
    const response = await fetch(`${apiBaseUrl}/api/products/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    if (response.ok) {
      showNotification("Product updated successfully", "success");
      fetchProducts(); // Refresh product list
    } else {
      throw new Error("Failed to update product");
    }
  } catch (error) {
    console.error("Error updating product:", error);
    showNotification("Error updating product", "error");
  }
}

// Delete product from database
async function deleteProduct(productId) {
  try {
    const apiBaseUrl = "http://localhost:5000";
    const response = await fetch(`${apiBaseUrl}/api/products/${productId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      showNotification("Product deleted successfully", "success");
      fetchProducts(); // Refresh product list
    } else {
      throw new Error("Failed to delete product");
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    showNotification("Error deleting product", "error");
  }
}

// Update product inventory
async function updateInventory(productId, newStock) {
  try {
    const apiBaseUrl = "http://localhost:5000";
    const response = await fetch(
      `${apiBaseUrl}/api/products/${productId}/inventory`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stock: newStock }),
      }
    );

    if (response.ok) {
      showNotification("Inventory updated successfully", "success");
      fetchProducts(); // Refresh product list
    } else {
      throw new Error("Failed to update inventory");
    }
  } catch (error) {
    console.error("Error updating inventory:", error);
    showNotification("Error updating inventory", "error");
  }
}

// Initialize cart functionality
function initializeCart() {
  console.log("initializeCart: Setting up cart functionality");

  // Initialize cart if it doesn't exist
  if (!localStorage.getItem("cart")) {
    console.log(
      "initializeCart: No cart found in localStorage, creating empty cart"
    );
    localStorage.setItem("cart", JSON.stringify([]));
  } else {
    console.log("initializeCart: Existing cart found in localStorage");
  }

  // Update cart count display
  updateCartCount();
}
