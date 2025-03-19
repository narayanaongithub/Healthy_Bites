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
    card.setAttribute("data-meal-type", product.meal_type || "default");

    // Format price
    const formattedPrice = parseFloat(product.price).toFixed(2);

    // Handle tags if available
    const tagsHTML =
      product.tags && product.tags.length > 0
        ? `<div class="product-tags">
          ${product.tags
            .map((tag) => `<span class="product-tag">${tag}</span>`)
            .join("")}
         </div>`
        : "";

    // Use appropriate image path with timestamp to prevent caching
    const timestamp = new Date().getTime();

    // Build image path based on available information
    let imagePath;
    if (product.image_url) {
      imagePath = product.image_url.startsWith("http")
        ? product.image_url
        : `../static/images/${product.image_url}?t=${timestamp}`;
    } else if (product.image) {
      imagePath = product.image.startsWith("http")
        ? product.image
        : `../static/images/${product.image}?t=${timestamp}`;
    } else {
      // Use default images based on meal type
      const mealTypeImages = {
        breakfast: "breakfast.jpg",
        lunch: "lunch.webp",
        dinner: "dinner.jpg",
      };
      imagePath = `../static/images/${
        mealTypeImages[product.meal_type] || "default-meal.jpg"
      }?t=${timestamp}`;
    }

    // Create fallback image handler based on meal type
    const fallbackImage =
      product.meal_type === "lunch"
        ? "lunch.webp"
        : product.meal_type === "dinner"
        ? "dinner.jpg"
        : "breakfast.jpg";

    const imgErrorHandler = `onerror="this.onerror=null; this.src='../static/images/${fallbackImage}?t=${timestamp}';"`;

    card.innerHTML = `
      <div class="product-image">
        <img src="${imagePath}" alt="${product.name}" ${imgErrorHandler}>
        ${
          product.is_featured
            ? '<span class="featured-badge">Featured</span>'
            : ""
        }
      </div>
      <div class="product-content">
        <div class="product-category">${
          product.meal_type.charAt(0).toUpperCase() + product.meal_type.slice(1)
        }</div>
        <h3 class="product-title">${product.name}</h3>
        <p class="product-description">${
          product.description || "A delicious and nutritious meal option."
        }</p>
        ${tagsHTML}
        <div class="product-footer">
          <span class="product-price">$${formattedPrice}</span>
          <button class="add-to-cart-btn" data-product-id="${product.id}">
            <i class="fas fa-cart-plus"></i> Add to Cart
          </button>
        </div>
      </div>
    `;

    // Add event listener for Add to Cart button
    const addToCartBtn = card.querySelector(".add-to-cart-btn");
    if (addToCartBtn) {
      addToCartBtn.addEventListener("click", function () {
        addToCart(product);
      });
    }

    return card;
  }

  async function fetchAllProducts() {
    try {
      // Fetch products from all three meal types
      const mealTypes = ["breakfast", "lunch", "dinner"];
      let allProducts = [];

      // Use Promise.all to fetch all meal types in parallel
      const responses = await Promise.all(
        mealTypes.map((type) =>
          fetch(`http://localhost:5003/api/products/meal/${type}`)
            .then((response) => {
              if (!response.ok) {
                console.warn(
                  `API returned status ${response.status} for ${type} meals`
                );
                return { json: () => Promise.resolve([]) };
              }
              return response;
            })
            .then((response) => response.json())
            .catch((error) => {
              console.error(`Error fetching ${type} meals:`, error);
              return [];
            })
        )
      );

      // Process each meal type's response
      responses.forEach((meals, index) => {
        const mealType = mealTypes[index];
        console.log(`Fetched ${meals.length} ${mealType} meals`);

        // Process and add each meal to allProducts
        meals.forEach((meal) => {
          // Ensure meal has the correct meal_type
          meal.meal_type = mealType;

          // Process tags
          if (meal.dietary_tags && typeof meal.dietary_tags === "string") {
            meal.tags = meal.dietary_tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag);
          } else {
            meal.tags = [];
          }

          allProducts.push(meal);
        });
      });

      console.log(`Total products fetched: ${allProducts.length}`);
      return allProducts;
    } catch (error) {
      console.error("Error fetching products:", error);
      // Return fallback data if API fails
      return getFallbackData();
    }
  }

  function getFallbackData() {
    console.log("Using fallback data for products");

    // Create sample products for each meal type
    const sampleProducts = [
      // Breakfast items
      {
        id: 1,
        name: "Avocado Toast with Eggs",
        description: "Whole grain toast topped with avocado and poached eggs",
        price: 8.99,
        image: "breakfast.jpg",
        meal_type: "breakfast",
        tags: ["Vegetarian", "High-protein"],
        is_featured: true,
      },
      {
        id: 2,
        name: "Greek Yogurt Parfait",
        description: "Greek yogurt with fresh berries, honey and granola",
        price: 6.99,
        image: "breakfast.jpg",
        meal_type: "breakfast",
        tags: ["Vegetarian", "Low-calorie"],
      },
      // Lunch items
      {
        id: 3,
        name: "Grilled Chicken Salad",
        description:
          "Fresh greens with grilled chicken, avocado and light dressing",
        price: 10.99,
        image: "lunch.webp",
        meal_type: "lunch",
        tags: ["High-protein", "Low-carb"],
      },
      {
        id: 4,
        name: "Quinoa Veggie Bowl",
        description: "Protein-rich quinoa with roasted seasonal vegetables",
        price: 9.99,
        image: "lunch.webp",
        meal_type: "lunch",
        tags: ["Vegan", "Gluten-free"],
      },
      // Dinner items
      {
        id: 5,
        name: "Baked Salmon",
        description: "Wild-caught salmon with roasted vegetables and quinoa",
        price: 14.99,
        image: "dinner.jpg",
        meal_type: "dinner",
        tags: ["High-protein", "Omega-3"],
      },
      {
        id: 6,
        name: "Vegetable Stir Fry",
        description: "Fresh vegetables stir-fried with tofu in a light sauce",
        price: 11.99,
        image: "dinner.jpg",
        meal_type: "dinner",
        tags: ["Vegan", "Low-calorie"],
      },
    ];

    return sampleProducts;
  }
});

// Add to cart function
function addToCart(product) {
  try {
    // Get current cart from localStorage
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Ensure product has all required properties
    const productToAdd = {
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      meal_type: product.meal_type,
      quantity: 1,
      image: product.image || null,
      image_url: product.image_url || null,
      description: product.description || "",
    };

    // Check if product is already in cart
    const existingProductIndex = cart.findIndex(
      (item) => item.id === product.id
    );

    if (existingProductIndex >= 0) {
      // Product exists, increase quantity
      cart[existingProductIndex].quantity += 1;
    } else {
      // Add new product to cart
      cart.push(productToAdd);
    }

    // Save updated cart to localStorage
    localStorage.setItem("cart", JSON.stringify(cart));

    // Update cart count display
    updateCartCount();

    // Show notification
    showNotification(`Added ${product.name} to cart`);

    console.log("Updated cart:", cart);
  } catch (error) {
    console.error("Error adding to cart:", error);
    showNotification("Error adding item to cart");
  }
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

// Initialize cart functionality
function initializeCart() {
  // Initialize cart or get existing cart
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Clean up the cart to remove any problematic items
  cart = cart.map((item) => {
    // Ensure item has all required properties in the correct format
    return {
      id: item.id,
      name: typeof item.name === "string" ? item.name : "Unknown Item",
      price:
        typeof item.price === "number"
          ? item.price
          : typeof item.price === "string"
          ? parseFloat(item.price)
          : 0,
      meal_type: item.meal_type || "default",
      quantity: typeof item.quantity === "number" ? item.quantity : 1,
      image: item.image && typeof item.image === "string" ? item.image : null,
      image_url:
        item.image_url && typeof item.image_url === "string"
          ? item.image_url
          : null,
    };
  });

  // Save the clean cart back to localStorage
  localStorage.setItem("cart", JSON.stringify(cart));

  // Update cart count
  updateCartCount();

  // Add global function for backward compatibility
  window.addToCart = addToCart;
}
