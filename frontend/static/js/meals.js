// Meals Page JavaScript

// Initialize cart from localStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Function to update cart count
function updateCartCount() {
  const cartCount = document.getElementById("cartCount");
  if (cartCount) {
    const totalItems = cart.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0
    );
    cartCount.textContent = totalItems;
  }
}

// Function to show notification
function showNotification(message) {
  // Remove existing notification if any
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  document.body.appendChild(notification);

  // Show notification with animation
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // Hide notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Function to handle user menu
function initializeUserMenu() {
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userDropdown = document.getElementById("userDropdown");

  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener("click", function () {
      userDropdown.classList.toggle("active");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (event) {
      if (
        !userMenuBtn.contains(event.target) &&
        !userDropdown.contains(event.target)
      ) {
        userDropdown.classList.remove("active");
      }
    });
  }
}

// Function to handle meal card animations
function initializeMealCardAnimations() {
  const mealCards = document.querySelectorAll(".meal-card");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  mealCards.forEach((card) => {
    observer.observe(card);
  });
}

// Function to handle add to cart functionality
function initializeAddToCart() {
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", function () {
      const mealCard = this.closest(".meal-card");
      if (!mealCard) return;

      const mealId = mealCard.getAttribute("data-id");
      const mealName =
        mealCard.querySelector("h3")?.textContent || "Unknown Item";
      const mealPrice = parseFloat(mealCard.getAttribute("data-price")) || 0;
      const mealImage =
        mealCard.querySelector(".meal-image img")?.src ||
        "../static/images/logo.jpeg";
      const mealCategory =
        document.querySelector(".meals-header h1")?.textContent.split(" ")[0] ||
        "Unknown";

      // Check if item already in cart
      const existingItemIndex = cart.findIndex((item) => item.id === mealId);

      if (existingItemIndex > -1) {
        // Item exists, increase quantity if less than 10
        if (cart[existingItemIndex].quantity < 10) {
          cart[existingItemIndex].quantity += 1;
          showNotification(`Increased ${mealName} quantity in cart!`);
        } else {
          showNotification(`Maximum quantity reached for ${mealName}`);
          return;
        }
      } else {
        // Add new item to cart
        cart.push({
          id: mealId,
          name: mealName,
          price: Number(mealPrice),
          quantity: 1,
          image: mealImage,
          category: mealCategory,
        });
        showNotification(`${mealName} added to cart!`);
      }

      // Save cart to localStorage
      localStorage.setItem("cart", JSON.stringify(cart));

      // Update cart count
      updateCartCount();

      // Visual feedback on button
      this.classList.add("added");
      this.innerHTML = '<i class="fas fa-check"></i> Added';

      setTimeout(() => {
        this.classList.remove("added");
        this.innerHTML = '<i class="fas fa-cart-plus"></i> Add to Cart';
      }, 2000);
    });
  });
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Update cart count on page load
  updateCartCount();

  // Initialize user menu
  initializeUserMenu();

  // Initialize meal card animations
  initializeMealCardAnimations();

  // Initialize add to cart functionality
  initializeAddToCart();
});
