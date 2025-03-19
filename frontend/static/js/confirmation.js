// JavaScript for Order Confirmation Page

// Get order ID from URL
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get("orderId");

// DOM elements
const orderNumberElement = document.getElementById("orderNumber");
const orderDateElement = document.getElementById("orderDate");
const deliveryAddressElement = document.getElementById("deliveryAddress");
const estimatedDeliveryElement = document.getElementById("estimatedDelivery");
const paymentMethodElement = document.getElementById("paymentMethod");
const summaryItemsContainer = document.querySelector(".summary-items");
const subtotalElement = document.getElementById("subtotal");
const deliveryFeeElement = document.getElementById("deliveryFee");
const taxElement = document.getElementById("tax");
const totalElement = document.getElementById("total");

// Function to load order details
function loadOrderDetails() {
  // Get orders from localStorage
  const orders = JSON.parse(localStorage.getItem("orders")) || [];

  // Find the current order
  const currentOrder = orders.find((order) => order.id === orderId);

  if (!currentOrder) {
    // Order not found, redirect to order history
    window.location.href = "order-history.html";
    return;
  }

  // Format date
  const orderDate = new Date(currentOrder.date);
  const formattedDate = orderDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Update order details
  orderNumberElement.textContent = currentOrder.id;
  orderDateElement.textContent = formattedDate;

  // Format address
  const shipping = currentOrder.shipping;
  deliveryAddressElement.textContent = `${shipping.address}, ${shipping.city}, ${shipping.state} ${shipping.zip}`;

  // Set estimated delivery time based on delivery option
  estimatedDeliveryElement.textContent =
    currentOrder.deliveryOption === "express"
      ? "15-20 minutes"
      : "30-45 minutes";

  // Set payment method (this is a placeholder as we don't store full card details)
  paymentMethodElement.textContent = "Credit Card (ending in ****)";

  // Update order summary
  updateOrderSummary(currentOrder);
}

// User menu dropdown functionality
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

// Initialize the page
loadOrderDetails();

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

// Update order summary
function updateOrderSummary(order) {
  // Add items to summary
  const summaryItems = document.querySelector(".summary-items");
  if (summaryItems) {
    summaryItems.innerHTML = "";
    order.items.forEach((item) => {
      const itemElement = document.createElement("div");
      itemElement.className = "summary-item";
      itemElement.innerHTML = `
        <div class="item-info">
          <img src="${item.image}" alt="${item.name}" />
          <div class="item-details">
            <h4>${item.name}</h4>
            <p>Quantity: ${item.quantity}</p>
          </div>
        </div>
        <div class="item-price">$${(item.price * item.quantity).toFixed(
          2
        )}</div>
      `;
      summaryItems.appendChild(itemElement);
    });
  }

  // Update totals
  const subtotalElement = document.getElementById("subtotal");
  const taxElement = document.getElementById("tax");
  const deliveryFeeElement = document.getElementById("deliveryFee");
  const totalElement = document.getElementById("total");

  if (subtotalElement)
    subtotalElement.textContent = `$${order.subtotal.toFixed(2)}`;
  if (taxElement) taxElement.textContent = `$${order.tax.toFixed(2)}`;
  if (deliveryFeeElement)
    deliveryFeeElement.textContent = `$${order.deliveryFee.toFixed(2)}`;
  if (totalElement) totalElement.textContent = `$${order.total.toFixed(2)}`;

  // Add discount information if applicable
  if (order.isSubscriberDiscount) {
    const summaryTotals = document.querySelector(".summary-totals");
    if (summaryTotals) {
      // Create discount row
      const discountRow = document.createElement("div");
      discountRow.className = "summary-row discount-row";
      discountRow.innerHTML = `
        <span>Subscriber Discount (15%)</span>
        <span class="discount-amount">-$${order.discountAmount.toFixed(
          2
        )}</span>
      `;

      // Insert after subtotal
      const subtotalRow = subtotalElement.closest(".summary-row");
      if (subtotalRow) {
        subtotalRow.after(discountRow);
      }

      // Update subtotal label to indicate it's the original amount
      if (subtotalElement && subtotalElement.previousElementSibling) {
        subtotalElement.previousElementSibling.textContent =
          "Original Subtotal";
      }

      // Add discounted subtotal row
      const discountedSubtotalRow = document.createElement("div");
      discountedSubtotalRow.className = "summary-row";
      discountedSubtotalRow.innerHTML = `
        <span>Discounted Subtotal</span>
        <span>$${order.subtotal.toFixed(2)}</span>
      `;

      // Insert after discount row
      discountRow.after(discountedSubtotalRow);
    }
  }
}
