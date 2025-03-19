// JavaScript for Meal Pages (breakfast, lunch, and dinner)

document.addEventListener("DOMContentLoaded", async function () {
  console.log("Meal page fix loaded");

  // Get the current page path to determine the meal type
  const pagePath = window.location.pathname;
  console.log("Current path:", pagePath);

  // Determine meal type from URL
  let mealType = "breakfast"; // Default
  if (pagePath.includes("lunch")) {
    mealType = "lunch";
  } else if (pagePath.includes("dinner")) {
    mealType = "dinner";
  } else if (pagePath.includes("breakfast")) {
    mealType = "breakfast";
  }

  console.log("Detected meal type:", mealType);

  // Get DOM elements
  const mealsContainer = document.querySelector(".meals-grid");
  const mealCount = document.getElementById("mealCount");
  const pageTitle = document.querySelector(".page-title");
  const pageDescription = document.querySelector(".page-description");

  // Update page title if not already set
  if (pageTitle && !pageTitle.textContent.includes(mealType)) {
    pageTitle.textContent = `${
      mealType.charAt(0).toUpperCase() + mealType.slice(1)
    } Meals`;
  }

  // Update page description based on meal type
  if (pageDescription) {
    const descriptions = {
      breakfast: "Start your day right with our nutritious breakfast options.",
      lunch: "Fresh and energizing meals to power you through your day.",
      dinner:
        "Complete your day with our nutritious and satisfying dinner choices.",
    };

    pageDescription.textContent =
      descriptions[mealType] ||
      "Discover our selection of healthy and nutritious meals.";
  }

  // Fetch and display meals
  try {
    // Show loading state
    if (mealsContainer) {
      mealsContainer.innerHTML = `
        <div class="loading-spinner" style="grid-column: span 3; text-align: center; padding: 2rem;">
          <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #0c3c30;"></i>
          <p>Loading ${mealType} meals...</p>
        </div>
      `;
    }

    // Fetch meals data
    const meals = await fetchMealsByType(mealType);

    // Update count if element exists
    if (mealCount) {
      mealCount.textContent = `(${meals.length})`;
    }

    // Display meals if any found
    if (meals.length > 0 && mealsContainer) {
      displayMeals(meals, mealsContainer);
    } else if (mealsContainer) {
      mealsContainer.innerHTML = `
        <div class="empty-meals" style="grid-column: span 3; text-align: center; padding: 2rem;">
          <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #ff9800;"></i>
          <p>No ${mealType} meals are currently available.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error(`Error loading ${mealType} meals:`, error);
    if (mealsContainer) {
      mealsContainer.innerHTML = `
        <div class="error-message" style="grid-column: span 3; text-align: center; padding: 2rem;">
          <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #ff5252;"></i>
          <p>Error loading meals. Please try again later.</p>
        </div>
      `;
    }
  }

  // Initialize cart functionality
  initializeCart();

  // Functions
  async function fetchMealsByType(type) {
    try {
      const response = await fetch(
        `http://localhost:5003/api/products/meal/${type}`
      );

      if (!response.ok) {
        console.warn(
          `API returned status ${response.status} for ${type} meals`
        );
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      console.log(`Fetched ${data.length} ${type} meals from API`);

      // Process tags from dietary_tags if needed
      data.forEach((meal) => {
        if (meal.dietary_tags && typeof meal.dietary_tags === "string") {
          meal.tags = meal.dietary_tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag);
        } else {
          meal.tags = [];
        }
      });

      // Limit to 6 meals per type
      return data.slice(0, 6);
    } catch (error) {
      console.error(`Error fetching ${type} meals:`, error);
      throw error; // Let the error propagate to be handled by the caller
    }
  }

  function displayMeals(meals, container) {
    container.innerHTML = "";

    meals.forEach((meal) => {
      const mealCard = createMealCard(meal);
      container.appendChild(mealCard);
    });
  }

  function createMealCard(meal) {
    const card = document.createElement("div");
    card.className = "meal-card";

    // Format price
    const formattedPrice = parseFloat(meal.price).toFixed(2);

    // Handle tags if available
    const tagsHTML =
      meal.tags && meal.tags.length > 0
        ? `<div class="meal-tags">${meal.tags
            .map((tag) => `<span class="meal-tag">${tag}</span>`)
            .join("")}</div>`
        : "";

    // Use appropriate image path
    const timestamp = new Date().getTime(); // Add timestamp to prevent caching
    const imagePath = meal.image_url
      ? meal.image_url.startsWith("http")
        ? meal.image_url
        : `../static/images/${meal.image_url}?t=${timestamp}`
      : "../static/images/default-meal.jpg?t=${timestamp}";

    card.innerHTML = `
      <div class="meal-image">
        <img src="${imagePath}" alt="${meal.name}">
        ${
          meal.is_featured ? '<span class="featured-badge">Featured</span>' : ""
        }
      </div>
      <div class="meal-content">
        <h3 class="meal-title">${meal.name}</h3>
        <p class="meal-description">${
          meal.description || "A delicious and nutritious meal option."
        }</p>
        ${tagsHTML}
        <div class="meal-footer">
          <span class="meal-price">$${formattedPrice}</span>
          <button class="add-to-cart-btn" data-product-id="${meal.id}">
            <i class="fas fa-cart-plus"></i> Add to Cart
          </button>
        </div>
      </div>
    `;

    // Add event listener to the Add to Cart button
    const addToCartBtn = card.querySelector(".add-to-cart-btn");
    if (addToCartBtn) {
      addToCartBtn.addEventListener("click", function () {
        addToCart(meal);
      });
    }

    return card;
  }

  // Add to cart function
  function addToCart(product) {
    try {
      // Get current cart from localStorage
      let cart = JSON.parse(localStorage.getItem("cart")) || [];

      // Check if product is already in cart
      const existingProductIndex = cart.findIndex(
        (item) => item.id === product.id
      );

      if (existingProductIndex >= 0) {
        // Product exists, increase quantity
        cart[existingProductIndex].quantity += 1;
      } else {
        // Product doesn't exist, add to cart with quantity 1
        const productToAdd = {
          ...product,
          quantity: 1,
        };
        cart.push(productToAdd);
      }

      // Save updated cart to localStorage
      localStorage.setItem("cart", JSON.stringify(cart));

      // Update cart count display
      updateCartCount();

      // Show notification
      showNotification(`Added ${product.name} to cart`);

      // Log cart state for debugging
      console.log("Current cart:", cart);
    } catch (error) {
      console.error("Error adding to cart:", error);
      showNotification("Error adding item to cart");
    }
  }

  // Update cart count
  function updateCartCount() {
    try {
      const cartCountElement = document.getElementById("cartCount");
      if (cartCountElement) {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const totalItems = cart.reduce(
          (total, item) => total + (item.quantity || 0),
          0
        );
        cartCountElement.textContent = totalItems;

        // Log cart count for debugging
        console.log("Cart count updated:", totalItems);
      }
    } catch (error) {
      console.error("Error updating cart count:", error);
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

    // Set notification message
    notification.textContent = message;

    // Show notification
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // Hide notification after 3 seconds
    setTimeout(() => {
      notification.style.transform = "translateX(120%)";
    }, 3000);
  }

  // Initialize cart
  function initializeCart() {
    // Initialize cart count on page load
    updateCartCount();

    // Add global function for backward compatibility
    window.addToCart = addToCart;
  }
});
