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

// Constants
const DELIVERY_FEE = 3.99;
const TAX_RATE = 0.1; // 10% tax

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
function updateCartDisplay() {
  // Clear current cart items
  if (cartItemsContainer) {
    cartItemsContainer.innerHTML = "";
  }

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

    // Ensure item has all required properties
    const itemName = item.name || "Unknown Item";
    const itemPrice = Number(item.price) || 0;
    const itemQuantity = item.quantity || 1;

    // Fix image path and add cache busting
    let itemImage = item.image || "../static/images/logo.jpeg";

    // Handle image path formatting
    if (itemImage.includes("?")) {
      // Image already has query params, just use as is
      itemImage = itemImage;
    } else {
      // Process the image path to ensure correct extension and add cache busting
      const timestamp = new Date().getTime();

      // If it's a meal image, ensure it has the right extension
      if (
        itemImage.includes("breakfast-") ||
        itemImage.includes("lunch-") ||
        itemImage.includes("dinner-")
      ) {
        // Extract the meal type and number
        const parts = itemImage.split("/");
        const filename = parts[parts.length - 1].split(".")[0]; // Get filename without extension

        if (filename) {
          // Always use .jpg for meal images
          itemImage = `../static/images/${filename}.jpg?t=${timestamp}`;
        } else {
          // Fallback with cache busting
          itemImage = `${itemImage}?t=${timestamp}`;
        }
      } else {
        // For other images, just add cache busting
        itemImage = `${itemImage}?t=${timestamp}`;
      }
    }

    // Add error handling for images
    const imgErrorHandler = `onerror="this.onerror=null; 
      if(this.src.includes('breakfast')) { 
        this.src='../static/images/breakfast.webp';
      } else if(this.src.includes('lunch')) {
        this.src='../static/images/lunch.webp';
      } else if(this.src.includes('dinner')) {
        this.src='../static/images/dinner.webp';
      } else {
        this.src='../static/images/logo.jpeg';
      }"`;

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

  // Check if user is a subscriber to apply discount
  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  const isSubscriber = userData.subscription && userData.subscription.active;
  let discountAmount = 0;

  if (isSubscriber) {
    // Apply 15% discount for subscribers
    discountAmount = subtotal * 0.15;
    subtotal = subtotal - discountAmount;

    // Add discount info to the cart if it doesn't exist
    const discountRow = document.querySelector(".discount-row");
    if (!discountRow && subtotalPriceElement) {
      const discountElement = document.createElement("div");
      discountElement.className = "summary-row discount-row";
      discountElement.innerHTML = `
        <span>Subscriber Discount (15%)</span>
        <span class="discount-amount">-$${discountAmount.toFixed(2)}</span>
      `;
      subtotalPriceElement.parentNode.after(discountElement);
    } else if (discountRow) {
      // Update existing discount row
      const discountAmountElement =
        discountRow.querySelector(".discount-amount");
      if (discountAmountElement) {
        discountAmountElement.textContent = `-$${discountAmount.toFixed(2)}`;
      }
    }
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
      decreaseQuantity(index);
    });
  });

  // Increase quantity buttons
  document.querySelectorAll(".increase-quantity").forEach((button) => {
    button.addEventListener("click", function () {
      const index = parseInt(this.getAttribute("data-index"));
      increaseQuantity(index);
    });
  });

  // Remove item buttons
  document.querySelectorAll(".remove-item").forEach((button) => {
    button.addEventListener("click", function () {
      const index = parseInt(this.getAttribute("data-index"));
      removeItem(index);
    });
  });
}

// Function to decrease item quantity
function decreaseQuantity(index) {
  if (cart[index].quantity > 1) {
    cart[index].quantity -= 1;
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartDisplay();
    showNotification("Quantity decreased");
  }
}

// Function to increase item quantity
function increaseQuantity(index) {
  if (cart[index].quantity < 10) {
    cart[index].quantity += 1;
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartDisplay();
    showNotification("Quantity increased");
  }
}

// Function to remove item from cart
function removeItem(index) {
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartDisplay();
  showNotification("Item removed from cart");
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

// Function to show notification
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
  document.body.appendChild(notification);

  // Show notification
  setTimeout(() => {
    notification.classList.add("show");
  }, 100);

  // Hide and remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize DOM elements
  initializeDOMElements();

  // Add event listener to apply promo button
  if (applyPromoBtn) {
    applyPromoBtn.addEventListener("click", handlePromoCode);
  }

  // Add event listener to checkout button
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
      if (cart.length > 0) {
        // Store order details in localStorage for checkout page
        const subtotal = parseFloat(
          subtotalPriceElement.textContent.replace("$", "")
        );
        const tax = parseFloat(taxPriceElement.textContent.replace("$", ""));
        const total = parseFloat(
          totalPriceElement.textContent.replace("$", "")
        );

        const orderSummary = {
          items: cart,
          subtotal: subtotal,
          tax: tax,
          deliveryFee: DELIVERY_FEE,
          total: total,
        };

        localStorage.setItem("orderSummary", JSON.stringify(orderSummary));
        window.location.href = "checkout.html";
      }
    });
  }

  // Initialize the page
  updateCartDisplay();

  // Add user menu dropdown functionality
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userDropdown = document.getElementById("userDropdown");

  if (userMenuBtn && userDropdown) {
    console.log("Setting up user dropdown menu in cart page");

    userMenuBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      userDropdown.classList.toggle("active");
      console.log(
        "User dropdown toggled:",
        userDropdown.classList.contains("active")
      );
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (e) {
      if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove("active");
      }
    });
  } else {
    console.error("User menu elements not found in cart page:", {
      userMenuBtn,
      userDropdown,
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
