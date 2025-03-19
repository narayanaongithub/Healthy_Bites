// JavaScript for Order History Page

// DOM elements
const ordersList = document.querySelector(".orders-list");
const searchInput = document.querySelector(".search-box input");
const statusFilter = document.querySelector(
  ".filter-options select:first-child"
);
const sortFilter = document.querySelector(".filter-options select:last-child");
const emptyOrders = document.querySelector(".empty-orders");
const pagination = document.querySelector(".pagination");

// User menu functionality
const userMenuBtn = document.getElementById("userMenuBtn");
const userDropdown = document.getElementById("userDropdown");

if (userMenuBtn && userDropdown) {
  userMenuBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    userDropdown.classList.toggle("active");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
      userDropdown.classList.remove("active");
    }
  });
}

// Logout functionality
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", function (e) {
    // Clear user login state
    localStorage.removeItem("userLoggedIn");
    localStorage.removeItem("userData");
    console.log("User logged out");
    // The href in the HTML already handles the redirect
  });
}

// Function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Function to format currency
function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

// Function to create order card
function createOrderCard(order) {
  const orderCard = document.createElement("div");
  orderCard.className = "order-card";
  orderCard.innerHTML = `
    <div class="order-header">
      <div class="order-info">
        <h3>Order #${order.id}</h3>
        <p>${formatDate(order.date)}</p>
      </div>
      <div class="order-status ${order.status.toLowerCase()}">
        ${order.status}
      </div>
    </div>
    <div class="order-items">
      ${order.items
        .map(
          (item) => `
        <div class="order-item">
          <img src="${item.image}" alt="${item.name}" />
          <div class="item-details">
            <h4>${item.name}</h4>
            <p>Quantity: ${item.quantity}</p>
          </div>
          <div class="item-price">${formatCurrency(
            item.price * item.quantity
          )}</div>
        </div>
      `
        )
        .join("")}
    </div>
    <div class="order-footer">
      <div class="order-total">
        ${
          order.isSubscriberDiscount
            ? `
          <div class="order-discount">
            <span>Subtotal:</span>
            <span>${formatCurrency(order.originalSubtotal)}</span>
          </div>
          <div class="order-discount">
            <span>Subscriber Discount (15%):</span>
            <span>-${formatCurrency(order.discountAmount)}</span>
          </div>
        `
            : ""
        }
        <div class="order-subtotal">
          <span>Subtotal:</span>
          <span>${formatCurrency(order.subtotal)}</span>
        </div>
        <div class="order-tax">
          <span>Tax:</span>
          <span>${formatCurrency(order.tax)}</span>
        </div>
        <div class="order-delivery">
          <span>Delivery:</span>
          <span>${formatCurrency(order.deliveryFee)}</span>
        </div>
        <div class="order-final-total">
          <span>Total:</span>
          <span>${formatCurrency(order.total)}</span>
        </div>
      </div>
      <div class="order-actions">
        <button class="reorder-btn" data-order-id="${order.id}">
          <i class="fas fa-redo"></i> Reorder
        </button>
        <button class="track-btn" data-order-id="${order.id}">
          <i class="fas fa-truck"></i> Track
        </button>
        <button class="details-btn" data-order-id="${order.id}">
          <i class="fas fa-info-circle"></i> Details
        </button>
      </div>
    </div>
  `;
  return orderCard;
}

// Function to load and display orders
async function loadOrders() {
  try {
    // Get user data and token
    const userData = JSON.parse(localStorage.getItem("userData")) || {};
    const token = userData.token;

    if (!token) {
      console.error("User not logged in");
      showEmptyOrders();
      return;
    }

    // Show loading state
    ordersList.innerHTML =
      '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Loading orders...</p></div>';

    // Fetch orders from API
    const response = await fetch("http://localhost:5000/api/orders", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch orders");
    }

    const ordersData = await response.json();
    console.log("Orders from API:", ordersData);

    // Clear current orders list
    ordersList.innerHTML = "";

    if (!ordersData || ordersData.length === 0) {
      showEmptyOrders();
      return;
    }

    // Hide empty state
    emptyOrders.style.display = "none";
    pagination.style.display = "flex";

    // Process and display orders
    ordersData.forEach((order) => {
      // Format the order for display
      const formattedOrder = formatApiOrder(order);
      const orderCard = createOrderCard(formattedOrder);
      ordersList.appendChild(orderCard);
    });

    // Add event listeners to order action buttons
    addOrderActionListeners();

    // Save orders to localStorage for offline access
    localStorage.setItem(
      "orders",
      JSON.stringify(ordersData.map(formatApiOrder))
    );
  } catch (error) {
    console.error("Error loading orders:", error);
    ordersList.innerHTML = `<div class="error"><i class="fas fa-exclamation-circle"></i><p>Error loading orders: ${error.message}</p></div>`;

    // Fallback to localStorage if API fails
    const offlineOrders = JSON.parse(localStorage.getItem("orders")) || [];
    if (offlineOrders.length > 0) {
      setTimeout(() => {
        ordersList.innerHTML =
          '<div class="notice"><i class="fas fa-info-circle"></i><p>Showing cached orders from your last session</p></div>';
        offlineOrders.forEach((order) => {
          const orderCard = createOrderCard(order);
          ordersList.appendChild(orderCard);
        });
        addOrderActionListeners();
      }, 2000);
    }
  }
}

// Function to show empty orders state
function showEmptyOrders() {
  emptyOrders.style.display = "block";
  pagination.style.display = "none";
}

// Function to format API order data for display
function formatApiOrder(apiOrder) {
  // Convert items from API format to display format
  const items = apiOrder.items.map((item) => {
    return {
      id: item.product_id,
      name: item.product_name,
      price: item.price,
      quantity: item.quantity,
      image: `../static/images/${item.product_name
        .toLowerCase()
        .replace(/\s+/g, "-")}.jpg`, // Generate image path from name
      subtotal: item.subtotal || item.price * item.quantity,
    };
  });

  // Get discount info from API response
  const discountApplied = apiOrder.discount_applied || false;
  const discountAmount = apiOrder.discount_amount || 0;
  const originalAmount = apiOrder.original_amount || apiOrder.total_amount;

  // Convert API order to display format
  return {
    id: apiOrder.id,
    date: apiOrder.created_at,
    status: capitalizeFirstLetter(apiOrder.status || "pending"),
    items: items,
    subtotal: discountApplied
      ? originalAmount - discountAmount
      : originalAmount,
    originalSubtotal: discountApplied ? originalAmount : undefined,
    tax: apiOrder.tax_amount || apiOrder.total_amount * 0.08,
    deliveryFee: apiOrder.delivery_fee || 3.99,
    total: apiOrder.total_amount,
    isSubscriberDiscount: discountApplied,
    discountAmount: discountAmount,
    shippingAddress: apiOrder.shipping_address || "No address provided",
  };
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to add event listeners to order action buttons
function addOrderActionListeners() {
  const reorderButtons = document.querySelectorAll(".reorder-btn");
  const trackButtons = document.querySelectorAll(".track-btn");
  const detailsButtons = document.querySelectorAll(".details-btn");

  reorderButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const orderId = this.dataset.orderId;
      reorderItems(orderId);
    });
  });

  trackButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const orderId = this.dataset.orderId;
      trackOrder(orderId);
    });
  });

  detailsButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const orderId = this.dataset.orderId;
      viewOrderDetails(orderId);
    });
  });
}

// Function to reorder items
function reorderItems(orderId) {
  // Get orders from localStorage
  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const order = orders.find((o) => String(o.id) === String(orderId));

  if (order) {
    // Get current cart
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Add items from order to cart
    order.items.forEach((item) => {
      const existingItem = cart.find(
        (cartItem) => String(cartItem.id) === String(item.id)
      );

      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        // Create a new cart item with the necessary properties
        cart.push({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        });
      }
    });

    // Update cart in localStorage
    localStorage.setItem("cart", JSON.stringify(cart));

    // Show success message
    showNotification("Items added to cart successfully!");

    // Update cart count in header
    const cartCountElement = document.getElementById("cartCount");
    if (cartCountElement) {
      const totalItems = cart.reduce(
        (sum, item) => sum + (item.quantity || 1),
        0
      );
      cartCountElement.textContent = totalItems;
    }

    // Provide feedback to user asking if they want to go to cart
    setTimeout(() => {
      if (confirm("Items added to cart. Do you want to go to your cart now?")) {
        window.location.href = "cart.html";
      }
    }, 500);
  } else {
    showNotification("Could not find order items", "error");
  }
}

// Function to track order
function trackOrder(orderId) {
  // This would typically integrate with a real delivery tracking system
  showNotification("Order tracking will be implemented soon!");
}

// Function to view order details
function viewOrderDetails(orderId) {
  // Redirect to order confirmation page with the order ID
  window.location.href = `order-confirmation.html?orderId=${orderId}`;
}

// Function to show notification
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;

  document.body.appendChild(notification);

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Function to filter orders based on search and filters
function filterOrders() {
  const statusFilter = document.getElementById("statusFilter");

  // Get all orders from the cached API data
  const allOrders = JSON.parse(localStorage.getItem("orders")) || [];

  // If no orders, show empty state
  if (allOrders.length === 0) {
    showEmptyOrders();
    return;
  }

  // Apply status filter if selected
  let filteredOrders = allOrders;
  if (statusFilter && statusFilter.value !== "all") {
    const status = statusFilter.value.toLowerCase();
    filteredOrders = allOrders.filter(
      (order) => order.status.toLowerCase() === status
    );
  }

  // Clear current orders list
  ordersList.innerHTML = "";

  // If no results after filtering, show message
  if (filteredOrders.length === 0) {
    ordersList.innerHTML = `
      <div class="no-results">
        <i class="fas fa-filter"></i>
        <h3>No orders match your filter</h3>
        <p>Try adjusting your filter criteria</p>
        <button class="reset-filter-btn" onclick="resetFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  // Display filtered orders
  filteredOrders.forEach((order) => {
    const orderCard = createOrderCard(order);
    ordersList.appendChild(orderCard);
  });

  // Add event listeners to order action buttons
  addOrderActionListeners();
}

// Function to reset filters
function resetFilters() {
  const statusFilter = document.getElementById("statusFilter");
  if (statusFilter) {
    statusFilter.value = "all";
  }
  filterOrders();
}

// Initialize the page when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  loadOrders();

  // Event listeners for search and filters
  if (searchInput) {
    searchInput.addEventListener("input", filterOrders);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", filterOrders);
  }

  if (sortFilter) {
    sortFilter.addEventListener("change", filterOrders);
  }
});
