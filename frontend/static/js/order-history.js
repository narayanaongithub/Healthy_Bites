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
function loadOrders() {
  // Get orders from localStorage
  const orders = JSON.parse(localStorage.getItem("orders")) || [];

  // Clear current orders list
  ordersList.innerHTML = "";

  if (orders.length === 0) {
    // Show empty state
    emptyOrders.style.display = "block";
    pagination.style.display = "none";
    return;
  }

  // Hide empty state
  emptyOrders.style.display = "none";
  pagination.style.display = "flex";

  // Add each order to the list
  orders.forEach((order) => {
    const orderCard = createOrderCard(order);
    ordersList.appendChild(orderCard);
  });

  // Add event listeners to order action buttons
  addOrderActionListeners();
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
  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const order = orders.find((o) => o.id === orderId);

  if (order) {
    // Get current cart
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Add items from order to cart
    order.items.forEach((item) => {
      const existingItem = cart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        cart.push({ ...item });
      }
    });

    // Update cart in localStorage
    localStorage.setItem("cart", JSON.stringify(cart));

    // Show success message
    showNotification("Items added to cart successfully!");
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

// Initialize the page when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // API URL - Using our API Gateway
  const API_BASE_URL = "http://localhost:5000/api";

  // Check if user is logged in
  function isLoggedIn() {
    return (
      localStorage.getItem("accessToken") && localStorage.getItem("userData")
    );
  }

  // Function to fetch order history from API
  async function fetchOrderHistory() {
    if (!isLoggedIn()) {
      return [];
    }

    const token = localStorage.getItem("accessToken");

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch order history");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching order history:", error);
      return [];
    }
  }

  // Function to display order history
  function displayOrderHistory(orders) {
    const ordersContainer = document.querySelector(".order-history-list");
    if (!ordersContainer) return;

    if (!orders || orders.length === 0) {
      ordersContainer.innerHTML = `
        <div class="empty-orders">
          <p>You haven't placed any orders yet.</p>
          <a href="products.html" class="primary-btn">Browse Products</a>
        </div>
      `;
      return;
    }

    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    ordersContainer.innerHTML = "";

    orders.forEach((order) => {
      const orderDate = new Date(order.created_at);

      const orderElement = document.createElement("div");
      orderElement.className = "order-card";

      // Generate HTML for order items
      const itemsList = order.items
        .map(
          (item) => `
        <div class="order-item">
          <span class="item-name">${item.product_name}</span>
          <span class="item-quantity">x${item.quantity}</span>
          <span class="item-price">$${(item.price * item.quantity).toFixed(
            2
          )}</span>
        </div>
      `
        )
        .join("");

      orderElement.innerHTML = `
        <div class="order-header">
          <div class="order-info">
            <h3>Order #${order.id}</h3>
            <p class="order-date">${orderDate.toLocaleDateString()} ${orderDate.toLocaleTimeString()}</p>
          </div>
          <div class="order-status ${order.status}">
            ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </div>
        </div>
        <div class="order-details">
          <div class="order-items">
            ${itemsList}
          </div>
          <div class="order-summary">
            <p class="delivery-address"><strong>Delivery Address:</strong> ${
              order.shipping_address || "Not provided"
            }</p>
            <p class="order-total"><strong>Total:</strong> $${order.total_amount.toFixed(
              2
            )}</p>
          </div>
        </div>
        <div class="order-actions">
          <button class="reorder-btn" data-order-id="${
            order.id
          }">Reorder</button>
          ${
            order.status === "pending"
              ? `<button class="cancel-order-btn" data-order-id="${order.id}">Cancel Order</button>`
              : ""
          }
        </div>
      `;

      ordersContainer.appendChild(orderElement);
    });

    // Add event listeners to buttons
    document.querySelectorAll(".reorder-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const orderId = this.getAttribute("data-order-id");
        reorderItems(orders.find((order) => order.id == orderId));
      });
    });

    document.querySelectorAll(".cancel-order-btn").forEach((button) => {
      button.addEventListener("click", async function () {
        const orderId = this.getAttribute("data-order-id");

        if (confirm("Are you sure you want to cancel this order?")) {
          try {
            await cancelOrder(orderId);
            showNotification("Order cancelled successfully");
            // Refresh the page to show updated order status
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } catch (error) {
            showNotification("Failed to cancel order", "error");
          }
        }
      });
    });
  }

  // Function to cancel an order
  async function cancelOrder(orderId) {
    if (!isLoggedIn()) {
      throw new Error("User not logged in");
    }

    const token = localStorage.getItem("accessToken");

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to cancel order");
    }

    return await response.json();
  }

  // Function to reorder items from previous order
  function reorderItems(order) {
    if (!order || !order.items || order.items.length === 0) {
      showNotification("Cannot reorder. Order items not found.", "error");
      return;
    }

    // Convert order items to cart format
    const cartItems = order.items.map((item) => ({
      id: item.product_id,
      name: item.product_name,
      price: item.price,
      quantity: item.quantity,
    }));

    // Save to cart
    localStorage.setItem("cart", JSON.stringify(cartItems));

    // Show notification
    showNotification("Items added to cart");

    // Redirect to cart page
    setTimeout(() => {
      window.location.href = "cart.html";
    }, 1500);
  }

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

  // Initialize the order history page
  async function initOrderHistoryPage() {
    // Check if user is logged in
    if (!isLoggedIn()) {
      document.querySelector(".order-history-container").innerHTML = `
        <div class="login-message">
          <h2>Please Login to View Order History</h2>
          <p>You need to be logged in to view your order history.</p>
          <a href="auth.html" class="primary-btn">Login / Register</a>
        </div>
      `;
      return;
    }

    // Fetch and display order history
    const orders = await fetchOrderHistory();
    displayOrderHistory(orders);
  }

  // Initialize the page
  initOrderHistoryPage();

  // Add event listeners to filters
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      // Implement search functionality
      loadOrders();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", function () {
      // Implement status filter functionality
      loadOrders();
    });
  }

  if (sortFilter) {
    sortFilter.addEventListener("change", function () {
      // Implement sort functionality
      loadOrders();
    });
  }
});
