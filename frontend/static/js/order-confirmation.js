// Order Confirmation Page Script

// DOM elements
const orderNumberElement = document.getElementById("orderNumber");
const orderDateElement = document.getElementById("orderDate");
const orderStatusElement = document.getElementById("orderStatus");
const shippingAddressElement = document.getElementById("shippingAddress");
const summaryItemsContainer = document.getElementById("summaryItems");
const subtotalPriceElement = document.getElementById("subtotalPrice");
const discountRowElement = document.querySelector(".discount-row");
const discountAmountElement = document.getElementById("discountAmount");
const deliveryFeeElement = document.getElementById("deliveryFee");
const taxPriceElement = document.getElementById("taxPrice");
const totalPriceElement = document.getElementById("totalPrice");

// Get orderId from URL parameters
function getOrderIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("orderId");
}

// Format date string
function formatDate(dateString) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Format currency
function formatCurrency(amount) {
  return `$${parseFloat(amount).toFixed(2)}`;
}

// Fetch order details from API or localStorage
async function fetchOrderDetails(orderId) {
  // First check if we have order details from localStorage
  const orderFromLocalStorage = JSON.parse(
    localStorage.getItem("currentOrderDetails")
  );
  if (
    orderFromLocalStorage &&
    String(orderFromLocalStorage.id) === String(orderId)
  ) {
    return orderFromLocalStorage;
  }

  // If not in localStorage, try API
  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  const token = userData.token;

  if (!token) {
    throw new Error("Authentication required");
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch order details");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching order details:", error);

    // Last resort: check orders array in localStorage
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    const order = orders.find((o) => String(o.id) === String(orderId));

    if (order) {
      return order;
    }

    throw error;
  }
}

// Display order details
function displayOrderDetails(order) {
  // Format the order for display if it's from API
  let displayOrder = order;
  if (order.items && order.items[0] && order.items[0].product_id) {
    // This is API format, convert it
    displayOrder = {
      id: order.id,
      date: order.created_at,
      status: order.status || "pending",
      shippingAddress: order.shipping_address || "Not provided",
      subtotal: order.original_amount || order.total_amount,
      discountApplied: order.discount_applied || false,
      discountAmount: order.discount_amount || 0,
      tax: order.tax_amount || order.total_amount * 0.08,
      deliveryFee: order.delivery_fee || 3.99,
      total: order.total_amount,
      items: order.items.map((item) => ({
        id: item.product_id,
        name: item.product_name,
        price: item.price,
        quantity: item.quantity,
        image: `../static/images/${item.product_name
          .toLowerCase()
          .replace(/\s+/g, "-")}.jpg`,
        subtotal: item.subtotal || item.price * item.quantity,
      })),
    };
  }

  // Set order details
  if (orderNumberElement)
    orderNumberElement.textContent = `#${displayOrder.id}`;
  if (orderDateElement)
    orderDateElement.textContent = formatDate(displayOrder.date);
  if (orderStatusElement) {
    orderStatusElement.textContent =
      displayOrder.status.charAt(0).toUpperCase() +
      displayOrder.status.slice(1);
    orderStatusElement.className = `status ${displayOrder.status.toLowerCase()}`;
  }
  if (shippingAddressElement)
    shippingAddressElement.textContent = displayOrder.shippingAddress;

  // Display items
  if (summaryItemsContainer) {
    summaryItemsContainer.innerHTML = "";

    displayOrder.items.forEach((item) => {
      const itemElement = document.createElement("div");
      itemElement.className = "summary-item";

      // Create fallback image path
      const timestamp = new Date().getTime();
      const imgSrc =
        item.image || `../static/images/default-meal.jpg?t=${timestamp}`;
      const imgErrorHandler = `onerror="this.onerror=null; this.src='../static/images/logo.jpeg?t=${timestamp}';"`;

      itemElement.innerHTML = `
        <div class="item-info">
          <img src="${imgSrc}" alt="${item.name}" ${imgErrorHandler} />
          <div class="item-details">
            <h4>${item.name}</h4>
            <p>Quantity: ${item.quantity}</p>
          </div>
        </div>
        <div class="item-price">${formatCurrency(
          item.price * item.quantity
        )}</div>
      `;

      summaryItemsContainer.appendChild(itemElement);
    });
  }

  // Set price information
  if (subtotalPriceElement)
    subtotalPriceElement.textContent = formatCurrency(displayOrder.subtotal);

  // Handle discount
  if (displayOrder.discountApplied && displayOrder.discountAmount > 0) {
    if (discountRowElement) discountRowElement.style.display = "flex";
    if (discountAmountElement)
      discountAmountElement.textContent = `-${formatCurrency(
        displayOrder.discountAmount
      )}`;
  } else {
    if (discountRowElement) discountRowElement.style.display = "none";
  }

  if (deliveryFeeElement)
    deliveryFeeElement.textContent = formatCurrency(displayOrder.deliveryFee);
  if (taxPriceElement)
    taxPriceElement.textContent = formatCurrency(displayOrder.tax);
  if (totalPriceElement)
    totalPriceElement.textContent = formatCurrency(displayOrder.total);
}

// Show error message
function showError(message) {
  const confirmationContent = document.querySelector(".confirmation-content");
  if (confirmationContent) {
    confirmationContent.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <h2>Error Loading Order</h2>
        <p>${message}</p>
        <a href="order-history.html" class="btn">Go to Order History</a>
      </div>
    `;
  }
}

// Initialize the page
document.addEventListener("DOMContentLoaded", async () => {
  const orderId = getOrderIdFromUrl();

  if (!orderId) {
    showError("No order ID provided");
    return;
  }

  try {
    const orderDetails = await fetchOrderDetails(orderId);
    displayOrderDetails(orderDetails);

    // Clean up temporary storage
    localStorage.removeItem("currentOrderDetails");

    // Update cart count
    const cartCountElement = document.getElementById("cartCount");
    if (cartCountElement) {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const totalItems = cart.reduce(
        (sum, item) => sum + (item.quantity || 1),
        0
      );
      cartCountElement.textContent = totalItems;
    }
  } catch (error) {
    console.error("Error:", error);
    showError(error.message);
  }
});
