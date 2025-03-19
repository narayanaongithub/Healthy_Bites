// Common user menu functionality for all pages
document.addEventListener("DOMContentLoaded", function () {
  // Initialize user dropdown menu
  const userMenuBtn = document.querySelector(".user-menu-btn");
  const userDropdown = document.querySelector(".dropdown-menu");

  if (userMenuBtn && userDropdown) {
    // Toggle dropdown when clicking the button
    userMenuBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      userDropdown.classList.toggle("active");

      // Toggle aria-expanded attribute for accessibility
      const isExpanded = userDropdown.classList.contains("active");
      userMenuBtn.setAttribute("aria-expanded", isExpanded);
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (e) {
      if (
        userDropdown.classList.contains("active") &&
        !userMenuBtn.contains(e.target) &&
        !userDropdown.contains(e.target)
      ) {
        userDropdown.classList.remove("active");
        userMenuBtn.setAttribute("aria-expanded", "false");
      }
    });

    // Close dropdown when pressing escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && userDropdown.classList.contains("active")) {
        userDropdown.classList.remove("active");
        userMenuBtn.setAttribute("aria-expanded", "false");
      }
    });

    // Prevent dropdown from closing when clicking inside it
    userDropdown.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  // Setup logout functionality if logout button exists
  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      // Clear user session data
      localStorage.removeItem("userLoggedIn");
      localStorage.removeItem("userData");
      localStorage.removeItem("accessToken");
      // The redirect is handled by the href attribute in the HTML
    });
  }

  // Initialize cart if needed
  initializeCart();

  // Update cart count display
  updateCartCount();

  // For testing cart functionality - optional handler for cart icon
  const cartIcon = document.querySelector(".cart-icon");
  if (cartIcon) {
    // Add right-click event listener to add a test item to cart
    cartIcon.addEventListener("contextmenu", function (e) {
      e.preventDefault(); // Prevent context menu from showing
      addTestItemToCart();
      return false;
    });
  }
});

// Initialize cart functionality
function initializeCart() {
  console.log("Initializing cart on page load");

  // Check if cart exists in localStorage, if not, create it
  if (!localStorage.getItem("cart")) {
    console.log("No cart found in localStorage, creating empty cart");
    localStorage.setItem("cart", JSON.stringify([]));
  } else {
    // Cart exists, make sure it's valid JSON
    try {
      const cart = JSON.parse(localStorage.getItem("cart"));
      if (!Array.isArray(cart)) {
        // If cart is not an array, reset it
        console.log("Cart in localStorage is not an array, resetting");
        localStorage.setItem("cart", JSON.stringify([]));
      }
    } catch (error) {
      console.error("Error parsing cart from localStorage:", error);
      // Reset cart if there's an error
      localStorage.setItem("cart", JSON.stringify([]));
    }
  }
}

// Function to update cart count
function updateCartCount() {
  try {
    // Find all cart count elements
    const cartCountElements = document.querySelectorAll(".cart-count");

    // Get cart directly from localStorage to ensure it's current
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Calculate total items
    const totalItems = cart.reduce(
      (sum, item) => sum + (parseInt(item.quantity) || 1),
      0
    );

    console.log(`Cart count: Total items in cart: ${totalItems}`);

    // Update all cart count elements on the page
    cartCountElements.forEach((element) => {
      element.textContent = totalItems;
      console.log(`Updated cart count element: ${element.id || "unnamed"}`);
    });

    // Store the count in sessionStorage for cross-page consistency
    sessionStorage.setItem("cartCount", totalItems);

    console.log(`Cart count updated: ${totalItems} items`);
  } catch (error) {
    console.error("Error updating cart count:", error);
  }
}

// Function to add a test item to the cart for debugging
function addTestItemToCart() {
  try {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Create a test item
    const testItem = {
      id: "test-" + Date.now(),
      name: "Test Item",
      price: 9.99,
      quantity: 1,
      image: "../static/images/logo.jpeg",
      category: "Test",
    };

    // Add the item to cart
    cart.push(testItem);

    // Save back to localStorage
    localStorage.setItem("cart", JSON.stringify(cart));

    // Update cart count
    updateCartCount();

    // Show notification if function exists
    if (typeof showNotification === "function") {
      showNotification("Test item added to cart!");
    } else {
      alert("Test item added to cart!");
    }

    console.log("Test item added to cart:", testItem);
  } catch (error) {
    console.error("Error adding test item to cart:", error);
  }
}
