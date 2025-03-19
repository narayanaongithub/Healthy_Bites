// JavaScript for Cart Page

// Initialize cart from localStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// DOM elements
let cartItemsContainer;
let emptyCartMessage;
let subtotalPriceElement;
let taxPriceElement;
let totalPriceElement;
let deliveryFeeElement;
let checkoutBtn;
let promoCodeInput;
let applyPromoBtn;
let cartCountElement;
let userMenuBtn;
let userDropdown;

// Constants
const DELIVERY_FEE = 3.99;
const TAX_RATE = 0.1; // 10% tax

// Initialize the page
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Cart page loaded");
  initializeDOMElements();
  initializeDropdown();
  ensureDropdownBehavior();
  await updateCartDisplay();
});

// Function to initialize DOM elements
function initializeDOMElements() {
  cartItemsContainer = document.querySelector(".cart-items");
  emptyCartMessage = document.querySelector(".empty-cart-message");
  subtotalPriceElement = document.querySelector(".subtotal-price");
  taxPriceElement = document.querySelector(".tax-price");
  totalPriceElement = document.querySelector(".total-price");
  deliveryFeeElement = document.querySelector(".delivery-fee");
  checkoutBtn = document.querySelector(".checkout-btn");
  promoCodeInput = document.getElementById("promoCode");
  applyPromoBtn = document.getElementById("applyPromo");
  cartCountElement = document.getElementById("cartCount");
  userMenuBtn = document.querySelector(".user-menu-btn");
  userDropdown = document.querySelector(".dropdown-menu");
}

// Function to initialize dropdown functionality
function initializeDropdown() {
  // Only initialize if there's no existing onClick handler
  if (userMenuBtn && userDropdown && !userMenuBtn.hasAttribute("onclick")) {
    userMenuBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      userDropdown.classList.toggle("active");

      // Also update the display style to match inline script behavior
      const isActive = userDropdown.classList.contains("active");
      userDropdown.style.display = isActive ? "block" : "none";

      // Apply styling that matches the inline script
      if (isActive) {
        userMenuBtn.classList.add("active");
        userMenuBtn.style.borderColor = "rgba(255, 255, 255, 0.5)";
        userMenuBtn.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      } else {
        userMenuBtn.classList.remove("active");
        userMenuBtn.style.borderColor = "transparent";
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (event) {
      if (
        !userMenuBtn.contains(event.target) &&
        !userDropdown.contains(event.target)
      ) {
        userDropdown.classList.remove("active");
        userDropdown.style.display = "none";
        userMenuBtn.classList.remove("active");
        userMenuBtn.style.borderColor = "transparent";
      }
    });
  }
}

// Function to update cart count
function updateCartCount() {
  if (cartCountElement) {
    const totalItems = cart.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0
    );
    cartCountElement.textContent = totalItems;
  }
}

// Function to update cart display
async function updateCartDisplay() {
  // Clear current cart items
  if (cartItemsContainer) {
    cartItemsContainer.innerHTML = "";
  }

  // Get fresh cart data from localStorage
  cart = JSON.parse(localStorage.getItem("cart")) || [];
  console.log("Cart items:", cart); // Debug log

  // Check if cart is empty
  if (!cart || cart.length === 0) {
    if (emptyCartMessage) {
      emptyCartMessage.style.display = "block";
    }
    if (subtotalPriceElement) {
      subtotalPriceElement.textContent = "$0.00";
    }
    if (taxPriceElement) {
      taxPriceElement.textContent = "$0.00";
    }
    if (totalPriceElement) {
      totalPriceElement.textContent = "$3.99"; // Just delivery fee
    }
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.style.opacity = "0.5";
    }
    updateCartCount();
    return;
  }

  // Hide empty cart message if there are items
  if (emptyCartMessage) {
    emptyCartMessage.style.display = "none";
  }
  if (checkoutBtn) {
    checkoutBtn.disabled = false;
    checkoutBtn.style.opacity = "1";
  }

  // Calculate subtotal
  let subtotal = 0;

  // Add each item to the cart display
  cart.forEach((item, index) => {
    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";

    // Ensure item has all required properties and handle any unexpected formats
    const itemName = typeof item.name === "string" ? item.name : "Unknown Item";
    const itemPrice =
      typeof item.price === "number"
        ? item.price
        : typeof item.price === "string"
        ? parseFloat(item.price)
        : 0;
    const itemQuantity = typeof item.quantity === "number" ? item.quantity : 1;

    // Sanitize description if it's present to avoid showing in cart
    if (item.description && typeof item.description === "string") {
      // Don't display description in cart view
      item.description = "";
    }

    // Fix image path using products.js approach
    const timestamp = new Date().getTime();

    // Use the full path if available, otherwise construct it
    let itemImage = "";

    if (item.image_url && typeof item.image_url === "string") {
      itemImage = item.image_url;
    } else if (item.image && typeof item.image === "string") {
      itemImage = item.image;
    }

    // If it's just a filename without path, add the path
    if (
      itemImage &&
      !itemImage.startsWith("http") &&
      !itemImage.startsWith("../")
    ) {
      itemImage = `../static/images/${itemImage}`;
    }

    // Add cache busting
    if (itemImage && !itemImage.includes("?")) {
      itemImage = `${itemImage}?t=${timestamp}`;
    }

    // Determine product type for fallback image
    const productType = item.meal_type || "default";
    const fallbackImage =
      productType === "lunch"
        ? "lunch.webp"
        : productType === "dinner"
        ? "dinner.jpg"
        : productType === "breakfast"
        ? "breakfast.jpg"
        : "logo.jpeg";

    const imgErrorHandler = `onerror="this.onerror=null; this.src='../static/images/${fallbackImage}?t=${timestamp}';"`;

    cartItem.innerHTML = `
      <div class="cart-item-info">
        <img src="${itemImage}" alt="${itemName}" ${imgErrorHandler} />
        <div>
          <h4>${itemName}</h4>
          <p>$${itemPrice.toFixed(2)}</p>
        </div>
      </div>
      <div class="cart-item-actions">
        <button class="decrease-quantity" data-index="${index}">-</button>
        <span class="quantity">${itemQuantity}</span>
        <button class="increase-quantity" data-index="${index}">+</button>
        <button class="remove-item" data-index="${index}">Remove</button>
      </div>
    `;

    if (cartItemsContainer) {
      cartItemsContainer.appendChild(cartItem);
    }

    // Update subtotal
    subtotal += itemPrice * itemQuantity;
  });

  // Check subscription status from the server
  const subscriptionStatus = await checkSubscriptionStatus();
  let discountAmount = 0;

  if (subscriptionStatus.isSubscriber) {
    // Apply discount for subscribers
    discountAmount = subtotal * subscriptionStatus.discountRate;

    // Show subscription info
    const endDate = new Date(subscriptionStatus.subscription.end_date);
    const formattedEndDate = endDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Add discount info to the cart if it doesn't exist
    const discountRow = document.querySelector(".discount-row");
    if (!discountRow && subtotalPriceElement) {
      const discountElement = document.createElement("div");
      discountElement.className = "summary-row discount-row";
      discountElement.innerHTML = `
        <span>Subscriber Discount (15%)</span>
        <span class="discount-amount">-$${discountAmount.toFixed(2)}</span>
      `;

      // Add subscription expiry info
      const subscriptionInfoElement = document.createElement("div");
      subscriptionInfoElement.className = "subscription-info";
      subscriptionInfoElement.innerHTML = `
        <small style="display: block; color: #2c5d34; margin-top: 4px; font-style: italic;">
          Subscription active until ${formattedEndDate}
        </small>
      `;

      subtotalPriceElement.parentNode.after(discountElement);
      discountElement.appendChild(subscriptionInfoElement);
    } else if (discountRow) {
      // Update existing discount row
      const discountAmountElement =
        discountRow.querySelector(".discount-amount");
      if (discountAmountElement) {
        discountAmountElement.textContent = `-$${discountAmount.toFixed(2)}`;
      }

      // Update or add subscription info
      let subscriptionInfoElement =
        discountRow.querySelector(".subscription-info");
      if (!subscriptionInfoElement) {
        subscriptionInfoElement = document.createElement("div");
        subscriptionInfoElement.className = "subscription-info";
        discountRow.appendChild(subscriptionInfoElement);
      }

      subscriptionInfoElement.innerHTML = `
        <small style="display: block; color: #2c5d34; margin-top: 4px; font-style: italic;">
          Subscription active until ${formattedEndDate}
        </small>
      `;
    }

    // Apply the discount
    subtotal = subtotal - discountAmount;
  } else {
    // Remove discount row if it exists and user is not a subscriber
    const discountRow = document.querySelector(".discount-row");
    if (discountRow) {
      discountRow.remove();
    }
  }

  // Calculate tax and total
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + DELIVERY_FEE;

  // Update price elements
  if (subtotalPriceElement) {
    subtotalPriceElement.textContent = `$${subtotal.toFixed(2)}`;
  }
  if (taxPriceElement) {
    taxPriceElement.textContent = `$${tax.toFixed(2)}`;
  }
  if (totalPriceElement) {
    totalPriceElement.textContent = `$${total.toFixed(2)}`;
  }

  // Update cart count
  updateCartCount();

  // Add event listeners to buttons
  addEventListeners();
}

// Function to add event listeners to cart item buttons
function addEventListeners() {
  // Decrease quantity buttons
  document.querySelectorAll(".decrease-quantity").forEach((button) => {
    button.addEventListener("click", function () {
      const index = parseInt(this.getAttribute("data-index"));
      if (cart[index].quantity > 1) {
        cart[index].quantity--;
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartDisplay();
      }
    });
  });

  // Increase quantity buttons
  document.querySelectorAll(".increase-quantity").forEach((button) => {
    button.addEventListener("click", function () {
      const index = parseInt(this.getAttribute("data-index"));
      cart[index].quantity++;
      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartDisplay();
    });
  });

  // Remove item buttons
  document.querySelectorAll(".remove-item").forEach((button) => {
    button.addEventListener("click", function () {
      const index = parseInt(this.getAttribute("data-index"));
      cart.splice(index, 1);
      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartDisplay();
    });
  });

  // Apply promo code button
  if (applyPromoBtn) {
    applyPromoBtn.addEventListener("click", function () {
      // Placeholder for promo code functionality
      alert("Promo code functionality will be implemented in a future update.");
    });
  }

  // Checkout button
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
      processCheckout();
    });
  }
}

// Function to handle promo code
function handlePromoCode() {
  const code = promoCodeInput.value.trim().toUpperCase();
  if (code === "HEALTHY10") {
    // Apply 10% discount
    const subtotal = parseFloat(
      subtotalPriceElement.textContent.replace("$", "")
    );
    const discount = subtotal * 0.1;
    const newSubtotal = subtotal - discount;
    const tax = newSubtotal * TAX_RATE;
    const total = newSubtotal + tax + DELIVERY_FEE;

    subtotalPriceElement.textContent = `$${newSubtotal.toFixed(2)}`;
    taxPriceElement.textContent = `$${tax.toFixed(2)}`;
    totalPriceElement.textContent = `$${total.toFixed(2)}`;

    showNotification("Promo code applied successfully!");
  } else {
    showNotification("Invalid promo code!");
  }
}

// Function to process checkout
function processCheckout() {
  // Get the current cart and pricing information
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (!cart.length) {
    showNotification("Your cart is empty", "error");
    return;
  }

  // Calculate base subtotal (before any discounts)
  const baseSubtotal = cart.reduce(
    (total, item) => total + item.price * (item.quantity || 1),
    0
  );

  // Get subscription status
  checkSubscriptionStatus()
    .then((subscriptionStatus) => {
      // Initialize pricing variables
      let subtotal = baseSubtotal;
      let discountAmount = 0;

      // Apply discount if user is a subscriber
      if (subscriptionStatus.isSubscriber) {
        discountAmount = subtotal * subscriptionStatus.discountRate;
        subtotal = subtotal - discountAmount;
        console.log(
          `Applied ${
            subscriptionStatus.discountRate * 100
          }% discount: -$${discountAmount.toFixed(2)}`
        );
      }

      // Calculate tax and total based on the discounted subtotal
      const tax = subtotal * TAX_RATE;
      const total = subtotal + tax + DELIVERY_FEE;

      console.log("Checkout calculations:", {
        baseSubtotal: baseSubtotal,
        discountApplied: subscriptionStatus.isSubscriber,
        discountAmount: discountAmount,
        subtotalAfterDiscount: subtotal,
        tax: tax,
        deliveryFee: DELIVERY_FEE,
        total: total,
      });

      // Store checkout information for the checkout page
      const checkoutData = {
        items: cart,
        pricing: {
          baseSubtotal: baseSubtotal,
          subtotal: subtotal,
          discountApplied: subscriptionStatus.isSubscriber,
          discountAmount: discountAmount,
          discountRate: subscriptionStatus.discountRate,
          tax: tax,
          deliveryFee: DELIVERY_FEE,
          total: total,
        },
        subscription: subscriptionStatus.isSubscriber
          ? subscriptionStatus.subscription
          : null,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem("checkoutData", JSON.stringify(checkoutData));

      // For consistency, also update orderSummary
      const orderSummary = {
        items: cart.map((item) => ({ ...item })),
        baseSubtotal: baseSubtotal,
        subtotal: subtotal,
        discountApplied: subscriptionStatus.isSubscriber,
        discountAmount: discountAmount,
        tax: tax,
        deliveryFee: DELIVERY_FEE,
        total: total,
      };

      localStorage.setItem("orderSummary", JSON.stringify(orderSummary));

      // Show confirmation and redirect to checkout page
      showNotification(
        subscriptionStatus.isSubscriber
          ? "Proceeding to checkout with subscriber discount..."
          : "Proceeding to checkout..."
      );

      setTimeout(() => {
        window.location.href = "checkout.html";
      }, 1000);
    })
    .catch((error) => {
      console.error("Error during checkout:", error);
      showNotification("There was an error processing your checkout", "error");
    });
}

// Function to show notification
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${
        type === "success" ? "fa-check-circle" : "fa-exclamation-circle"
      }"></i>
      <span>${message}</span>
    </div>
  `;

  // Add styles for the notification
  notification.style.position = "fixed";
  notification.style.top = "20px";
  notification.style.right = "20px";
  notification.style.padding = "15px 20px";
  notification.style.borderRadius = "5px";
  notification.style.backgroundColor =
    type === "success" ? "#d4edda" : "#f8d7da";
  notification.style.color = type === "success" ? "#155724" : "#721c24";
  notification.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
  notification.style.zIndex = "9999";
  notification.style.transition = "all 0.3s ease-in-out";
  notification.style.opacity = "0";
  notification.style.transform = "translateY(-20px)";

  document.body.appendChild(notification);

  // Show notification with animation
  setTimeout(() => {
    notification.style.opacity = "1";
    notification.style.transform = "translateY(0)";
  }, 10);

  // Hide notification after a delay
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateY(-20px)";

    // Remove notification from DOM after animation completes
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Main initialization function
document.addEventListener("DOMContentLoaded", function () {
  initializeDOMElements();
  updateCartDisplay();
  initializeDropdown();

  // Add event listener to Apply Promo button
  if (applyPromoBtn) {
    applyPromoBtn.addEventListener("click", handlePromoCode);
  }

  // Add event listener to Checkout button
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
      if (cart.length > 0) {
        // Calculate values for order summary
        const subtotal = parseFloat(
          subtotalPriceElement.textContent.replace("$", "")
        );
        const tax = parseFloat(taxPriceElement.textContent.replace("$", ""));
        const total = parseFloat(
          totalPriceElement.textContent.replace("$", "")
        );

        // Make sure each item has the image_full_path property set
        const processedItems = cart.map((item) => {
          // Clone the item to avoid modifying the original
          const processedItem = { ...item };

          // Ensure image_full_path is available
          if (!processedItem.image_full_path && processedItem.image) {
            processedItem.image_full_path = `../static/images/${processedItem.image}`;
          }

          return processedItem;
        });

        // Store order summary for checkout page
        const orderSummary = {
          items: processedItems,
          subtotal: subtotal,
          tax: tax,
          deliveryFee: DELIVERY_FEE,
          total: total,
        };

        localStorage.setItem("orderSummary", JSON.stringify(orderSummary));
      }
      window.location.href = "checkout.html";
    });
  }

  // Logout functionality
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      // Clear user login state
      localStorage.removeItem("userLoggedIn");
      localStorage.removeItem("userData");
      localStorage.removeItem("accessToken");
      console.log("User logged out from cart page");
      // The href in the HTML already handles the redirect
    });
  }
});

// Add dropdown functionality for the My Account button
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    const userMenuBtn = document.getElementById("userMenuBtn");
    const userDropdown = document.getElementById("userDropdown");

    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        userDropdown.classList.toggle("active");
        console.log(
          "Dropdown toggled, active:",
          userDropdown.classList.contains("active")
        );
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
    } else {
      console.log("Menu elements not found:", { userMenuBtn, userDropdown });
    }
  });
})();

// Function to check subscription status from the database
async function checkSubscriptionStatus() {
  try {
    // First try to get the user data from localStorage
    const userData = JSON.parse(localStorage.getItem("userData")) || {};

    // Check if there's active subscription data in localStorage
    if (
      userData.subscription &&
      userData.subscription.active === true &&
      new Date(userData.subscription.end_date) > new Date()
    ) {
      console.log(
        "Active subscription found in localStorage:",
        userData.subscription
      );

      return {
        isSubscriber: true,
        discountRate: 0.15, // 15% discount
        subscription: userData.subscription,
      };
    }

    // No valid subscription found
    return {
      isSubscriber: false,
      discountRate: 0,
      subscription: null,
    };
  } catch (error) {
    console.warn("Error checking subscription status:", error);

    return {
      isSubscriber: false,
      discountRate: 0,
      subscription: null,
    };
  }
}

// Helper function to ensure dropdown behavior works properly with both inline and JS initialization
function ensureDropdownBehavior() {
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userDropdown = document.getElementById("userDropdown");

  if (userMenuBtn && userDropdown) {
    // Make sure the global click handler is in place to close dropdown when clicking outside
    // Only add if not already added to prevent duplicate handlers
    if (!window.dropdownHandlerAdded) {
      document.addEventListener("click", function (event) {
        if (
          userMenuBtn &&
          userDropdown &&
          !userMenuBtn.contains(event.target) &&
          !userDropdown.contains(event.target)
        ) {
          userDropdown.style.display = "none";
          userMenuBtn.classList.remove("active");
          userMenuBtn.style.borderColor = "transparent";
          userMenuBtn.style.backgroundColor = "";
        }
      });
      window.dropdownHandlerAdded = true;
    }
  }
}
