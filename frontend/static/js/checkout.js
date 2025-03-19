// JavaScript for Checkout Page

// Check for data from our updated processCheckout function
let checkoutData = JSON.parse(localStorage.getItem("checkoutData"));

// Check if orderSummary exists in localStorage
let orderSummary = JSON.parse(localStorage.getItem("orderSummary"));

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
    backgroundColor:
      type === "success" ? "#4CAF50" : type === "error" ? "#F44336" : "#2196F3",
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

// If we have checkoutData from the new process, use it
if (checkoutData && checkoutData.pricing) {
  console.log("Using checkoutData:", checkoutData);

  // Update or create orderSummary from checkoutData
  orderSummary = {
    items: checkoutData.items,
    baseSubtotal: checkoutData.pricing.baseSubtotal,
    subtotal: checkoutData.pricing.subtotal,
    tax: checkoutData.pricing.tax,
    deliveryFee: checkoutData.pricing.deliveryFee,
    total: checkoutData.pricing.total,
    discountApplied: checkoutData.pricing.discountApplied,
    discountAmount: checkoutData.pricing.discountAmount,
    discountRate: checkoutData.pricing.discountRate,
    subscription: checkoutData.subscription,
  };

  // Save to localStorage
  localStorage.setItem("orderSummary", JSON.stringify(orderSummary));
}
// If no order summary exists, create one from the cart
else if (!orderSummary) {
  // Get cart items and create order summary
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  // Process the cart items to ensure they have proper image paths
  const processedCart = cart.map((item) => {
    // Clone the item to avoid reference issues
    const newItem = { ...item };

    // Ensure image_full_path exists
    if (!newItem.image_full_path && newItem.image) {
      newItem.image_full_path = `../static/images/${newItem.image}`;
    }

    return newItem;
  });

  // Calculate subtotal from cart
  const subtotal = processedCart.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );
  // Calculate tax (assuming 8% tax rate)
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  // Standard delivery fee
  const deliveryFee = 3.99;
  // Calculate total
  const total = subtotal + tax + deliveryFee;

  // Create the order summary
  orderSummary = {
    items: processedCart,
    baseSubtotal: subtotal,
    subtotal: subtotal,
    tax: tax,
    deliveryFee: deliveryFee,
    total: total,
    discountApplied: false,
    discountAmount: 0,
    discountRate: 0,
  };

  // Save to localStorage
  localStorage.setItem("orderSummary", JSON.stringify(orderSummary));
}

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
  // Make sure all required elements exist
  if (
    !summaryItemsContainer ||
    !subtotalElement ||
    !taxElement ||
    !deliveryFeeElement ||
    !totalElement
  ) {
    console.log("Some required elements for order summary are missing");
    return;
  }

  // Clear current items
  summaryItemsContainer.innerHTML = "";

  // Add each item to the summary
  orderSummary.items.forEach((item) => {
    // Handle image paths the exact same way as in cart.js
    const timestamp = new Date().getTime();

    // Directly use the image_full_path if available
    let itemImage;
    if (item.image_full_path) {
      // Use the complete path directly
      itemImage = item.image_full_path;
    } else {
      // Get the meal type
      const productType =
        item.meal_type ||
        (typeof item.image === "string" && item.image.includes("breakfast")
          ? "breakfast"
          : typeof item.image === "string" && item.image.includes("lunch")
          ? "lunch"
          : typeof item.image === "string" && item.image.includes("dinner")
          ? "dinner"
          : "default");

      // Use the image if provided, otherwise use a default
      itemImage = item.image || "";

      // If it's just a filename without path, add the path
      if (itemImage && !itemImage.startsWith("../")) {
        itemImage = `../static/images/${itemImage}`;
      }
    }

    // Add cache busting
    if (itemImage && !itemImage.includes("?")) {
      itemImage = `${itemImage}?t=${timestamp}`;
    }

    // Determine product type for fallback image
    const productType =
      item.meal_type ||
      (typeof item.image === "string" && item.image.includes("breakfast")
        ? "breakfast"
        : typeof item.image === "string" && item.image.includes("lunch")
        ? "lunch"
        : typeof item.image === "string" && item.image.includes("dinner")
        ? "dinner"
        : "default");

    // Use the appropriate fallback image
    const fallbackImage =
      productType === "lunch"
        ? "lunch.webp"
        : productType === "dinner"
        ? "dinner.jpg"
        : productType === "breakfast"
        ? "breakfast.jpg"
        : "logo.jpeg";

    const imgErrorHandler = `onerror="this.onerror=null; this.src='../static/images/${fallbackImage}?t=${timestamp}';"`;

    const summaryItem = document.createElement("div");
    summaryItem.className = "summary-item";
    summaryItem.innerHTML = `
      <div class="item-info">
        <img src="${itemImage}" alt="${item.name}" ${imgErrorHandler} />
        <div class="item-details">
          <h4>${item.name}</h4>
          <p>Quantity: ${item.quantity || 1}</p>
        </div>
      </div>
      <div class="item-price">$${(item.price * (item.quantity || 1)).toFixed(
        2
      )}</div>
    `;
    summaryItemsContainer.appendChild(summaryItem);
  });

  // Check if we need to add a discount row
  const summaryTotals = document.querySelector(".summary-totals");
  if (orderSummary.discountApplied && orderSummary.discountAmount > 0) {
    // Check if discount row already exists
    let discountRow = document.querySelector(".discount-row");
    if (!discountRow) {
      // Create discount row
      discountRow = document.createElement("div");
      discountRow.className = "summary-row discount-row";
      discountRow.innerHTML = `
        <span>Subscriber Discount (${orderSummary.discountRate * 100}%)</span>
        <span class="discount-amount">-$${orderSummary.discountAmount.toFixed(
          2
        )}</span>
      `;

      // Add subscription expiry info if available
      if (orderSummary.subscription && orderSummary.subscription.end_date) {
        const endDate = new Date(orderSummary.subscription.end_date);
        const formattedEndDate = endDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const subscriptionInfoElement = document.createElement("div");
        subscriptionInfoElement.className = "subscription-info";
        subscriptionInfoElement.innerHTML = `
          <small style="display: block; color: #2c5d34; margin-top: 4px; font-style: italic;">
            Subscription active until ${formattedEndDate}
          </small>
        `;
        discountRow.appendChild(subscriptionInfoElement);
      }

      // Insert the discount row before the tax row
      const taxRow = document.querySelector(".summary-row:nth-child(3)");
      if (taxRow) {
        summaryTotals.insertBefore(discountRow, taxRow);
      } else {
        summaryTotals.appendChild(discountRow);
      }
    } else {
      // Update existing discount row
      const discountAmountElement =
        discountRow.querySelector(".discount-amount");
      if (discountAmountElement) {
        discountAmountElement.textContent = `-$${orderSummary.discountAmount.toFixed(
          2
        )}`;
      }
    }
  } else {
    // Remove discount row if it exists and no discount should be applied
    const discountRow = document.querySelector(".discount-row");
    if (discountRow) {
      discountRow.remove();
    }
  }

  // Update price elements
  if (orderSummary.discountApplied) {
    // If there's a base subtotal (before discount), show that too
    if (subtotalElement && orderSummary.baseSubtotal) {
      // Change the label to indicate it's before discount
      const subtotalLabel = subtotalElement.previousElementSibling;
      if (subtotalLabel) {
        subtotalLabel.textContent = "Subtotal (before discount)";
      }
      subtotalElement.textContent = `$${orderSummary.baseSubtotal.toFixed(2)}`;
    } else {
      subtotalElement.textContent = `$${orderSummary.subtotal.toFixed(2)}`;
    }
  } else {
    subtotalElement.textContent = `$${orderSummary.subtotal.toFixed(2)}`;
  }

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
if (standardDelivery) {
  standardDelivery.addEventListener("change", updateDeliveryFee);
}
if (expressDelivery) {
  expressDelivery.addEventListener("change", updateDeliveryFee);
}

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
if (placeOrderBtn) {
  placeOrderBtn.addEventListener("click", async function () {
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
        deliveryOption:
          expressDelivery && expressDelivery.checked ? "express" : "standard",
      };

      // Get order summary data
      const orderItems = orderSummary.items;
      const subtotal = orderSummary.subtotal;
      const tax = orderSummary.tax;
      const deliveryFee = orderSummary.deliveryFee;
      const total = orderSummary.total;
      const discountApplied = orderSummary.discountApplied || false;
      const discountAmount = orderSummary.discountAmount || 0;
      const discountRate = orderSummary.discountRate || 0;

      try {
        // Show processing message
        showNotification("Processing your order...", "info");

        // Get user data and token
        const userData = JSON.parse(localStorage.getItem("userData")) || {};
        const token = localStorage.getItem("accessToken");

        if (!token) {
          showNotification("You must be logged in to place an order", "error");
          setTimeout(() => {
            window.location.href = "login.html";
          }, 2000);
          return;
        }

        // Prepare order data for API
        const orderData = {
          items: orderItems,
          shipping_address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`,
          discount_applied: discountApplied,
          discount_amount: discountAmount,
          discount_rate: discountRate,
          tax_rate: tax / subtotal, // Calculate actual tax rate
          delivery_fee: deliveryFee,
          status: "pending",
        };

        console.log("Sending order to API:", orderData);

        // Send order to backend API
        const response = await fetch("http://localhost:5004/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.message || "Failed to place order");
        }

        console.log("Order placed successfully:", responseData);

        // Generate order ID and create order object for order history
        const orderId = responseData.order.id;
        const orderDate = new Date().toISOString();

        // Create order object for order history
        const order = {
          id: orderId,
          date: orderDate,
          status: "Processing",
          items: orderItems,
          subtotal: subtotal,
          tax: tax,
          deliveryFee: deliveryFee,
          total: total,
          discountApplied: discountApplied,
          discountAmount: discountAmount,
          shippingAddress: orderData.shipping_address,
          paymentMethod: "Credit Card ****" + formData.cardNumber.slice(-4),
        };

        // Get existing orders and add new order
        const orders = JSON.parse(localStorage.getItem("orders")) || [];
        orders.unshift(order); // Add to beginning of array
        localStorage.setItem("orders", JSON.stringify(orders));

        // Clear cart
        localStorage.removeItem("cart");
        localStorage.removeItem("orderSummary");
        localStorage.removeItem("checkoutData");

        // Show success message
        showNotification("Order placed successfully!", "success");

        // Redirect to order confirmation page
        setTimeout(() => {
          window.location.href = `order-confirmation.html?orderId=${orderId}`;
        }, 1500);
      } catch (error) {
        console.error("Error placing order:", error);
        showNotification(`Error: ${error.message}`, "error");
      }
    }
  });
}

// Function to generate a random order ID
function generateOrderId() {
  return "ORD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Function to save order to localStorage
function saveOrder(order) {
  // Get existing orders
  const orders = JSON.parse(localStorage.getItem("orders")) || [];

  // Make sure images are preserved properly for each item
  if (order.items && Array.isArray(order.items)) {
    order.items = order.items.map((item) => {
      // Clone the item to avoid reference issues
      const newItem = { ...item };

      // Make sure image_full_path is present
      if (!newItem.image_full_path && newItem.image) {
        newItem.image_full_path = `../static/images/${newItem.image}`;
      }

      return newItem;
    });
  }

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
if (
  summaryItemsContainer &&
  subtotalElement &&
  taxElement &&
  deliveryFeeElement &&
  totalElement
) {
  updateOrderSummary();
}

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
  const API_BASE_URL = "http://localhost:5004/api";

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

      // Handle image paths the exact same way as in cart.js
      const timestamp = new Date().getTime();

      // Directly use the image_full_path if available
      let itemImage =
        item.image_full_path || `../static/images/${item.image || ""}`;

      // Add cache busting
      if (itemImage && !itemImage.includes("?")) {
        itemImage = `${itemImage}?t=${timestamp}`;
      }

      // Get the meal type for fallback image
      const productType = item.meal_type || "default";

      // Use the appropriate fallback image
      const fallbackImage =
        productType === "lunch"
          ? "lunch.webp"
          : productType === "dinner"
          ? "dinner.jpg"
          : productType === "breakfast"
          ? "breakfast.jpg"
          : "logo.jpeg";

      const imgErrorHandler = `onerror="this.onerror=null; this.src='../static/images/${fallbackImage}?t=${timestamp}';"`;

      const cartItemElement = document.createElement("div");
      cartItemElement.className = "checkout-item";
      cartItemElement.innerHTML = `
        <div class="item-image">
          <img src="${itemImage}" alt="${item.name}" ${imgErrorHandler} />
        </div>
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

  // Handle form submission - Add null check before attaching event listener
  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", async function (e) {
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

        // Also store the same information in orderDetails for the confirmation page
        localStorage.setItem(
          "orderDetails",
          JSON.stringify({
            items: cart,
          })
        );

        // Clear cart
        localStorage.setItem("cart", JSON.stringify([]));

        // Redirect to confirmation page
        window.location.href = `order-confirmation.html?orderId=${data.order.id}`;
      } catch (error) {
        console.error("Error creating order:", error);
        showNotification("Failed to create order. Please try again.", "error");
      }
    });
  }

  // Update form with user data if available
  function populateFormWithUserData() {
    const userData = JSON.parse(localStorage.getItem("userData")) || {};

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");
    const addressInput = document.getElementById("delivery-address");

    if (nameInput && userData.full_name) {
      nameInput.value = userData.full_name;
    }

    if (emailInput && userData.email) {
      emailInput.value = userData.email;
    }

    if (phoneInput && userData.phone) {
      phoneInput.value = userData.phone;
    }

    if (addressInput && userData.address) {
      addressInput.value = userData.address;
    }
  }

  // Only call this if we're on a page with the checkout form
  if (document.getElementById("checkout-form")) {
    populateFormWithUserData();
  }
});
