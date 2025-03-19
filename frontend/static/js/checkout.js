// JavaScript for Checkout Page

// Get order summary from localStorage
const orderSummary = JSON.parse(localStorage.getItem("orderSummary")) || {
  items: [],
  subtotal: 0,
  tax: 0,
  deliveryFee: 3.99,
  total: 0,
};

// DOM elements
const summaryItemsContainer = document.querySelector(".summary-items");
const subtotalElement = document.querySelector(".subtotal-price");
const taxElement = document.querySelector(".tax-price");
const deliveryFeeElement = document.querySelector(".delivery-fee");
const totalElement = document.querySelector(".total-price");
const placeOrderBtn = document.querySelector(".place-order-btn");

// Delivery options
const standardDelivery = document.getElementById("standard");
const expressDelivery = document.getElementById("express");

// Constants
const STANDARD_DELIVERY_FEE = 3.99;
const EXPRESS_DELIVERY_FEE = 6.99;

// Function to update order summary display
function updateOrderSummary() {
  // Clear current items
  summaryItemsContainer.innerHTML = "";

  // Add each item to the summary
  orderSummary.items.forEach((item) => {
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

    const summaryItem = document.createElement("div");
    summaryItem.className = "summary-item";
    summaryItem.innerHTML = `
      <div class="item-info">
        <img src="${itemImage}" alt="${item.name}" ${imgErrorHandler} />
        <div class="item-details">
          <h4>${item.name}</h4>
          <p>Quantity: ${item.quantity}</p>
        </div>
      </div>
      <div class="item-price">$${(item.price * item.quantity).toFixed(2)}</div>
    `;
    summaryItemsContainer.appendChild(summaryItem);
  });

  // Update price elements
  subtotalElement.textContent = `$${orderSummary.subtotal.toFixed(2)}`;
  taxElement.textContent = `$${orderSummary.tax.toFixed(2)}`;
  deliveryFeeElement.textContent = `$${orderSummary.deliveryFee.toFixed(2)}`;
  totalElement.textContent = `$${orderSummary.total.toFixed(2)}`;
}

// Function to update delivery fee and total
function updateDeliveryFee() {
  const previousFee = orderSummary.deliveryFee;

  if (expressDelivery.checked) {
    orderSummary.deliveryFee = EXPRESS_DELIVERY_FEE;
  } else {
    orderSummary.deliveryFee = STANDARD_DELIVERY_FEE;
  }

  // Update total if fee changed
  if (previousFee !== orderSummary.deliveryFee) {
    orderSummary.total =
      orderSummary.total - previousFee + orderSummary.deliveryFee;
    updateOrderSummary();
  }
}

// Add event listeners to delivery options
standardDelivery.addEventListener("change", updateDeliveryFee);
expressDelivery.addEventListener("change", updateDeliveryFee);

// Form validation
function validateForm() {
  const requiredFields = document.querySelectorAll("[required]");
  let isValid = true;

  requiredFields.forEach((field) => {
    if (!field.value.trim()) {
      field.style.borderColor = "#ff5252";
      isValid = false;
    } else {
      field.style.borderColor = "#ddd";
    }
  });

  // Validate card number format (simple check)
  const cardNumber = document.getElementById("cardNumber");
  if (
    cardNumber.value.trim() &&
    !/^\d{4}(\s\d{4}){3}$|^\d{16}$/.test(cardNumber.value.trim())
  ) {
    cardNumber.style.borderColor = "#ff5252";
    isValid = false;
  }

  // Validate expiration date format (MM/YY)
  const expDate = document.getElementById("expDate");
  if (expDate.value.trim() && !/^\d{2}\/\d{2}$/.test(expDate.value.trim())) {
    expDate.style.borderColor = "#ff5252";
    isValid = false;
  }

  // Validate CVV (3 or 4 digits)
  const cvv = document.getElementById("cvv");
  if (cvv.value.trim() && !/^\d{3,4}$/.test(cvv.value.trim())) {
    cvv.style.borderColor = "#ff5252";
    isValid = false;
  }

  return isValid;
}

// Place order button event listener
placeOrderBtn.addEventListener("click", function () {
  if (validateForm()) {
    // Get form data
    const formData = {
      fullName: document.getElementById("fullName").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      address: document.getElementById("address").value,
      city: document.getElementById("city").value,
      state: document.getElementById("state").value,
      zip: document.getElementById("zip").value,
      cardName: document.getElementById("cardName").value,
      cardNumber: document.getElementById("cardNumber").value,
      expDate: document.getElementById("expDate").value,
      cvv: document.getElementById("cvv").value,
      deliveryOption: expressDelivery.checked ? "express" : "standard",
    };

    // Create order object
    const order = {
      id: generateOrderId(),
      date: new Date().toISOString(),
      items: orderSummary.items,
      subtotal: orderSummary.subtotal,
      tax: orderSummary.tax,
      deliveryFee: orderSummary.deliveryFee,
      total: orderSummary.total,
      shipping: {
        name: formData.fullName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
      },
      status: "Processing",
    };

    // Check if user is a subscriber to include discount info
    const userData = JSON.parse(localStorage.getItem("userData")) || {};
    const isSubscriber = userData.subscription && userData.subscription.active;

    if (isSubscriber) {
      // Calculate the discount amount (15% of original subtotal)
      const originalSubtotal = orderSummary.subtotal / 0.85;
      const discountAmount = originalSubtotal * 0.15;

      // Add discount info to the order
      order.originalSubtotal = originalSubtotal;
      order.discountAmount = discountAmount;
      order.discountPercentage = 15;
      order.isSubscriberDiscount = true;
    }

    // Save order to localStorage
    saveOrder(order);

    // Clear cart
    localStorage.removeItem("cart");

    // Redirect to confirmation page
    window.location.href = `order-confirmation.html?orderId=${order.id}`;
  } else {
    alert("Please fill in all required fields correctly.");
  }
});

// Function to generate a random order ID
function generateOrderId() {
  return "ORD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Function to save order to localStorage
function saveOrder(order) {
  // Get existing orders
  const orders = JSON.parse(localStorage.getItem("orders")) || [];

  // Add new order
  orders.push(order);

  // Save back to localStorage
  localStorage.setItem("orders", JSON.stringify(orders));
}

// Logout functionality
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

// Initialize the page
updateOrderSummary();

// Update cart count in header
function updateCartCount() {
  const cartCount = document.getElementById("cartCount");
  if (cartCount) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalItems = cart.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0
    );
    cartCount.textContent = totalItems;
  }
}

// Call updateCartCount on page load
updateCartCount();

document.addEventListener("DOMContentLoaded", function () {
  // API URL - Using our API Gateway
  const API_BASE_URL = "http://localhost:5000/api";

  // Get cart from localStorage
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Get cartCountElement to update cart count
  const cartCountElement = document.getElementById("cartCount");

  // Update cart count badge
  function updateCartCount() {
    if (cartCountElement) {
      const totalItems = cart.reduce(
        (sum, item) => sum + (item.quantity || 1),
        0
      );
      cartCountElement.textContent = totalItems;
    }
  }

  // Call this on page load
  updateCartCount();

  // Display cart items in the checkout summary
  function displayCartItems() {
    const cartItemsContainer = document.getElementById("cart-items");
    const totalElement = document.getElementById("cart-total");

    if (!cartItemsContainer || !totalElement) return;

    // Clear cart items container
    cartItemsContainer.innerHTML = "";

    // Calculate total price
    let totalPrice = 0;

    // Display each cart item
    cart.forEach((item) => {
      const itemTotal = (item.price * (item.quantity || 1)).toFixed(2);
      totalPrice += parseFloat(itemTotal);

      const cartItemElement = document.createElement("div");
      cartItemElement.className = "checkout-item";
      cartItemElement.innerHTML = `
        <div class="item-details">
          <span class="item-name">${item.name}</span>
          <span class="item-quantity">x${item.quantity || 1}</span>
        </div>
        <span class="item-price">$${itemTotal}</span>
      `;

      cartItemsContainer.appendChild(cartItemElement);
    });

    // Display total price
    totalElement.textContent = `$${totalPrice.toFixed(2)}`;

    // Add input field for delivery address
    const addressInput = document.getElementById("delivery-address");
    if (addressInput) {
      const userData = JSON.parse(localStorage.getItem("userData")) || {};
      addressInput.value = userData.address || "";
    }
  }

  // Call this on page load
  displayCartItems();

  // Handle form submission
  document
    .getElementById("checkout-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      // Check if user is logged in
      const token = localStorage.getItem("accessToken");
      if (!token) {
        showNotification("Please login to complete your order", "error");
        setTimeout(() => {
          window.location.href = "auth.html";
        }, 2000);
        return;
      }

      // Get form data
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const phone = document.getElementById("phone").value;
      const address = document.getElementById("delivery-address").value;
      const paymentMethod = document.getElementById("payment-method").value;

      // Check if cart is empty
      if (cart.length === 0) {
        showNotification("Your cart is empty", "error");
        return;
      }

      // Calculate total price
      const totalPrice = cart.reduce(
        (sum, item) => sum + item.price * (item.quantity || 1),
        0
      );

      // Prepare order data
      const orderData = {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity || 1,
          price: item.price,
        })),
        shipping_address: address,
        payment_method: paymentMethod,
        total_amount: totalPrice,
      };

      try {
        // Send order data to API
        const response = await fetch(`${API_BASE_URL}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) {
          throw new Error("Failed to create order");
        }

        const data = await response.json();

        // Store order data for confirmation page
        localStorage.setItem(
          "lastOrder",
          JSON.stringify({
            orderId: data.order.id,
            items: cart,
            total: totalPrice,
            address: address,
            paymentMethod: paymentMethod,
            date: new Date().toISOString(),
          })
        );

        // Clear cart
        localStorage.setItem("cart", JSON.stringify([]));

        // Redirect to confirmation page
        window.location.href = "order-confirmation.html";
      } catch (error) {
        console.error("Error creating order:", error);
        showNotification("Failed to create order. Please try again.", "error");
      }
    });

  // Update form with user data if available
  function populateFormWithUserData() {
    const userData = JSON.parse(localStorage.getItem("userData")) || {};

    if (userData.full_name) {
      document.getElementById("name").value = userData.full_name;
    }

    if (userData.email) {
      document.getElementById("email").value = userData.email;
    }

    if (userData.phone) {
      document.getElementById("phone").value = userData.phone;
    }

    if (userData.address) {
      document.getElementById("delivery-address").value = userData.address;
    }
  }

  // Call this on page load
  populateFormWithUserData();

  // Function to show notifications
  function showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Style the notification
    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "15px 20px",
      borderRadius: "4px",
      color: "white",
      backgroundColor: type === "success" ? "#4CAF50" : "#F44336",
      boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
      zIndex: "1000",
      transition: "opacity 0.5s, transform 0.5s",
      opacity: "0",
      transform: "translateY(-20px)",
    });

    // Show notification with animation
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateY(0)";
    }, 10);

    // Hide notification after 3 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateY(-20px)";
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }
});
