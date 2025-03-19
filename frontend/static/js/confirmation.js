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
  console.log("All orders in localStorage:", orders);
  console.log("Looking for order ID:", orderId);

  // Try multiple sources to find the order details
  let currentOrder = null;

  // First try to find by ID in orders
  if (orders.length > 0 && orderId) {
    currentOrder = orders.find((order) => order.id === orderId);
  }

  console.log("Found current order:", currentOrder);

  // If no order found by ID, try lastOrder
  if (!currentOrder) {
    console.log("Order not found by ID, checking lastOrder");
    const lastOrder = JSON.parse(localStorage.getItem("lastOrder"));
    console.log("Last order from localStorage:", lastOrder);

    if (lastOrder) {
      currentOrder = lastOrder;
    }
  }

  // If still no order, check orderDetails
  if (!currentOrder) {
    console.log("Order not found in lastOrder, checking orderDetails");
    const orderDetails = JSON.parse(localStorage.getItem("orderDetails"));
    console.log("Order details from localStorage:", orderDetails);

    if (orderDetails && orderDetails.items) {
      // Create a minimal order object with just the items
      currentOrder = {
        id: orderId || "ORD-LATEST",
        date: new Date().toISOString(),
        items: orderDetails.items,
        subtotal: 0,
        tax: 0,
        deliveryFee: 3.99,
        total: 0,
        shipping: {
          address: "Not specified",
          city: "",
          state: "",
          zip: "",
        },
      };
    }
  }

  // If we still couldn't find an order, redirect
  if (!currentOrder) {
    console.log("No order found in any storage, redirecting");
    window.location.href = "order-history.html";
    return;
  }

  // Ensure all order items have image_full_path
  if (currentOrder.items && Array.isArray(currentOrder.items)) {
    currentOrder.items = currentOrder.items.map((item) => {
      // Clone the item to avoid reference issues
      const newItem = { ...item };

      // Make sure image_full_path is present
      if (!newItem.image_full_path && newItem.image) {
        newItem.image_full_path = `../static/images/${newItem.image}`;
      }

      return newItem;
    });
  }

  // Format date
  const orderDate = new Date(currentOrder.date);
  const formattedDate = orderDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Update order details
  if (orderNumberElement)
    orderNumberElement.textContent = currentOrder.id || "ORD-LATEST";
  if (orderDateElement) orderDateElement.textContent = formattedDate;

  // Format address if shipping info exists
  if (deliveryAddressElement && currentOrder.shipping) {
    const shipping = currentOrder.shipping;
    const addressParts = [];
    if (shipping.address) addressParts.push(shipping.address);
    if (shipping.city) addressParts.push(shipping.city);
    if (shipping.state) addressParts.push(shipping.state);
    if (shipping.zip) addressParts.push(shipping.zip);

    deliveryAddressElement.textContent =
      addressParts.length > 0 ? addressParts.join(", ") : "Not specified";
  }

  // Set estimated delivery time based on delivery option
  if (estimatedDeliveryElement) {
    estimatedDeliveryElement.textContent =
      currentOrder.deliveryOption === "express"
        ? "15-20 minutes"
        : "30-45 minutes";
  }

  // Set payment method
  if (paymentMethodElement) {
    paymentMethodElement.textContent = "Credit Card (ending in ****)";
  }

  // Update order summary
  updateOrderSummary(currentOrder);
}

// User menu dropdown functionality
const userMenuBtn = document.querySelector(".user-menu-btn");
const userDropdown = document.querySelector(".dropdown-menu");

if (userMenuBtn && userDropdown) {
  userMenuBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
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
document.addEventListener("DOMContentLoaded", function () {
  loadOrderDetails();
  updateCartCount();

  // Add a fallback check after a short delay to ensure images are displayed
  setTimeout(() => {
    const summaryItems = document.querySelector(".summary-items");
    if (summaryItems && summaryItems.children.length === 0) {
      console.log("No items rendered, trying backup methods");

      // Try the lastOrder as backup
      const lastOrder = JSON.parse(localStorage.getItem("lastOrder"));
      if (lastOrder && lastOrder.items) {
        console.log("Using lastOrder as backup:", lastOrder);
        updateOrderSummary(lastOrder);
        return;
      }

      // Try the orderDetails as backup
      const orderDetails = JSON.parse(localStorage.getItem("orderDetails"));
      if (orderDetails && orderDetails.items) {
        console.log("Using orderDetails as backup:", orderDetails);
        updateOrderSummary({
          items: orderDetails.items,
          subtotal: 0,
          tax: 0,
          deliveryFee: 0,
          total: 0,
        });
      }
    }
  }, 500);
});

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

// Function to display order items
function displayOrderItems() {
  const orderDetails = JSON.parse(localStorage.getItem("orderDetails")) || {};
  const orderItems = orderDetails.items || [];
  const summaryItems = document.querySelector(".summary-items");

  console.log("displayOrderItems called, items:", orderItems);
  console.log("summaryItems element found:", !!summaryItems);

  if (!summaryItems) return;

  // Clear summary items container
  summaryItems.innerHTML = "";

  // Display each order item
  orderItems.forEach((item) => {
    console.log("Processing item:", item);

    // Handle image paths the exact same way as in cart.js
    const timestamp = new Date().getTime();

    // Directly use the image_full_path if available
    let itemImage =
      item.image_full_path || `../static/images/${item.image || ""}`;

    console.log("Item image path:", itemImage);

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

    const itemElement = document.createElement("div");
    itemElement.className = "summary-item";
    itemElement.innerHTML = `
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

    summaryItems.appendChild(itemElement);
  });
}

// Update order summary
function updateOrderSummary(order) {
  // Get the summary items container
  const summaryItems = document.querySelector(".summary-items");

  if (!summaryItems) return;

  // Clear the container
  summaryItems.innerHTML = "";

  console.log("Rendering items directly in updateOrderSummary:", order.items);

  // First try to render directly from the order items
  if (order.items && Array.isArray(order.items)) {
    renderOrderItems(order.items, summaryItems);
  } else {
    // Try to use orderDetails as a backup
    const orderDetails = JSON.parse(localStorage.getItem("orderDetails"));
    if (orderDetails && orderDetails.items) {
      renderOrderItems(orderDetails.items, summaryItems);
    }
  }

  // Update totals
  const subtotalElement = document.getElementById("subtotal");
  const taxElement = document.getElementById("tax");
  const deliveryFeeElement = document.getElementById("deliveryFee");
  const totalElement = document.getElementById("total");

  if (subtotalElement)
    subtotalElement.textContent = `$${(order.subtotal || 0).toFixed(2)}`;
  if (taxElement) taxElement.textContent = `$${(order.tax || 0).toFixed(2)}`;
  if (deliveryFeeElement)
    deliveryFeeElement.textContent = `$${(order.deliveryFee || 3.99).toFixed(
      2
    )}`;
  if (totalElement)
    totalElement.textContent = `$${(order.total || 0).toFixed(2)}`;

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

// Helper function to render order items directly to the DOM
function renderOrderItems(items, container) {
  // Create items in the DOM directly
  items.forEach((item) => {
    console.log("Rendering item:", item);

    // Create the item container
    const itemElement = document.createElement("div");
    itemElement.className = "summary-item";

    // Create the info container
    const infoDiv = document.createElement("div");
    infoDiv.className = "item-info";

    // Create and configure the image
    const img = document.createElement("img");
    img.alt = item.name || "Food item";

    // Set the image source with priority: image_full_path, then construct from image property
    if (item.image_full_path) {
      img.src = item.image_full_path;
    } else if (item.image) {
      img.src = `../static/images/${item.image}`;
    } else {
      // Set a default image based on meal type
      const mealType =
        item.meal_type ||
        (item.name && item.name.toLowerCase().includes("breakfast")
          ? "breakfast"
          : item.name && item.name.toLowerCase().includes("lunch")
          ? "lunch"
          : item.name && item.name.toLowerCase().includes("dinner")
          ? "dinner"
          : "default");

      img.src = `../static/images/${mealType}.jpg`;
    }

    // Add error handling
    img.onerror = function () {
      this.onerror = null;
      // Determine fallback image based on meal type
      const mealType = item.meal_type || "default";
      if (mealType === "breakfast") {
        this.src = "../static/images/breakfast.jpg";
      } else if (mealType === "lunch") {
        this.src = "../static/images/lunch.webp";
      } else if (mealType === "dinner") {
        this.src = "../static/images/dinner.jpg";
      } else {
        this.src = "../static/images/logo.jpeg";
      }
    };

    // Create the details container
    const detailsDiv = document.createElement("div");
    detailsDiv.className = "item-details";

    // Add the name
    const nameHeading = document.createElement("h4");
    nameHeading.textContent = item.name || "Food Item";

    // Add the quantity
    const quantityPara = document.createElement("p");
    quantityPara.textContent = `Quantity: ${item.quantity || 1}`;

    // Create the price container
    const priceDiv = document.createElement("div");
    priceDiv.className = "item-price";
    priceDiv.textContent = `$${(
      (item.price || 0) * (item.quantity || 1)
    ).toFixed(2)}`;

    // Assemble the elements
    detailsDiv.appendChild(nameHeading);
    detailsDiv.appendChild(quantityPara);
    infoDiv.appendChild(img);
    infoDiv.appendChild(detailsDiv);
    itemElement.appendChild(infoDiv);
    itemElement.appendChild(priceDiv);

    // Add the complete item to the container
    container.appendChild(itemElement);
  });
}
