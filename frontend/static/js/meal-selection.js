// JavaScript for Meal Selection Form

// Initialize cart from localStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];
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

// Get meal images based on meal ID
function getMealImage(mealId) {
  const mealType = mealId.split("-")[0];
  const mealNumber = mealId.split("-")[1];

  // Updated to use jpg for all image types
  // Add timestamp to bust cache
  const timestamp = new Date().getTime();
  return `../static/images/${mealType}-${mealNumber}.jpg?t=${timestamp}`;
}

// Function to add a new meal selection group
function addMealSelectionGroup(mealType) {
  const container = document.querySelector(`.${mealType}-options`);
  const template = document
    .querySelector(`.${mealType}-options .meal-select-group`)
    .cloneNode(true);

  // Reset the new group's values
  const select = template.querySelector("select");
  select.value = "";

  const quantityInput = template.querySelector("input");
  quantityInput.value = 1;

  // Add event listener to the remove button
  const removeButton = template.querySelector(".remove-meal-button");
  removeButton.addEventListener("click", function () {
    if (container.children.length > 1) {
      container.removeChild(template);
    } else {
      // If this is the last one, just reset it
      select.value = "";
      quantityInput.value = 1;
    }
  });

  // Add the new group to the container
  container.appendChild(template);

  // Set up event listeners for the new select
  select.addEventListener("change", updateMealDetails);
}

// Function to update meal details when selection changes
function updateMealDetails(event) {
  const select = event.target;
  const selectedOption = select.options[select.selectedIndex];

  if (selectedOption.value) {
    const price = selectedOption.getAttribute("data-price");
    const name = selectedOption.getAttribute("data-name");
    const mealType = select.getAttribute("data-meal-type");
    const mealId = selectedOption.value;

    // Get image path
    const imagePath = getMealImage(mealId);

    // Check if details element already exists
    let detailsElement = select.parentElement.querySelector(".meal-details");
    if (!detailsElement) {
      detailsElement = document.createElement("div");
      detailsElement.className = "meal-details";
      select.parentElement.appendChild(detailsElement);
    }

    // Show more meal information
    detailsElement.innerHTML = `
      <div style="display: flex; align-items: center; margin-top: 10px;">
        <img src="${imagePath}" alt="${name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 10px;">
        <div>
          <span><i class="fas fa-utensils"></i> ${name}</span>
          <span class="meal-price">$${price}</span>
          <span><i class="fas fa-tag"></i> ${
            mealType.charAt(0).toUpperCase() + mealType.slice(1)
          }</span>
        </div>
      </div>
    `;
  }
}

// Add items to cart
function addItemsToCart(event) {
  event.preventDefault();

  const selectedMeals = [];
  const mealTypes = ["breakfast", "lunch", "dinner"];

  // Collect all selected meals
  mealTypes.forEach((type) => {
    const groups = document.querySelectorAll(
      `.${type}-options .meal-select-group`
    );

    groups.forEach((group) => {
      const select = group.querySelector("select");
      const quantity = parseInt(group.querySelector("input").value);

      if (select.value) {
        const selectedOption = select.options[select.selectedIndex];
        const mealId = select.value;
        const mealName = selectedOption.getAttribute("data-name");
        const mealPrice = parseFloat(selectedOption.getAttribute("data-price"));

        // Get image path without cache busting parameter
        const mealType = mealId.split("-")[0];
        const mealNumber = mealId.split("-")[1];
        const imagePath = `../static/images/${mealType}-${mealNumber}.jpg`;

        selectedMeals.push({
          id: mealId,
          name: mealName,
          price: mealPrice,
          quantity: quantity,
          image: imagePath,
          type: type,
        });
      }
    });
  });

  // Add to cart if there are selected meals
  if (selectedMeals.length > 0) {
    // Merge with existing cart
    selectedMeals.forEach((meal) => {
      // Check if item already exists in cart
      const existingItemIndex = cart.findIndex((item) => item.id === meal.id);

      if (existingItemIndex !== -1) {
        // Update quantity if item exists
        cart[existingItemIndex].quantity += meal.quantity;
      } else {
        // Add new item to cart
        cart.push(meal);
      }
    });

    // Save updated cart to localStorage
    localStorage.setItem("cart", JSON.stringify(cart));

    // Update cart count
    updateCartCount();

    // Show success message
    showNotification(`${selectedMeals.length} item(s) added to cart`);

    // Optional: Redirect to cart page
    setTimeout(() => {
      window.location.href = "cart.html";
    }, 1500);
  } else {
    showNotification("Please select at least one meal", "error");
  }
}

// Show notification message
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

// Function to initialize the page
document.addEventListener("DOMContentLoaded", function () {
  // Set up event listeners for "Add More" buttons
  const addMoreButtons = document.querySelectorAll(".add-more-button");
  addMoreButtons.forEach((button) => {
    const mealType = button.getAttribute("data-meal-type");
    button.addEventListener("click", () => addMealSelectionGroup(mealType));
  });

  // Set up event listeners for selects
  const selects = document.querySelectorAll(".meal-select");
  selects.forEach((select) => {
    select.addEventListener("change", updateMealDetails);
  });

  // Set up event listeners for remove buttons
  const removeButtons = document.querySelectorAll(".remove-meal-button");
  removeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const group = this.parentElement;
      const container = group.parentElement;

      if (container.children.length > 1) {
        container.removeChild(group);
      } else {
        // If this is the last one, just reset it
        const select = group.querySelector("select");
        const quantityInput = group.querySelector("input");
        select.value = "";
        quantityInput.value = 1;

        // Remove meal details if exists
        const detailsElement = group.querySelector(".meal-details");
        if (detailsElement) {
          group.removeChild(detailsElement);
        }
      }
    });
  });

  // Add image error handling for all meal images
  setupImageErrorHandling();

  // Set up form submission
  const form = document.getElementById("mealSelectionForm");
  form.addEventListener("submit", addItemsToCart);

  // Add user menu dropdown functionality
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userDropdown = document.getElementById("userDropdown");

  if (userMenuBtn && userDropdown) {
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
  }
});

// Function to handle image errors and provide fallbacks
function setupImageErrorHandling() {
  document.addEventListener(
    "error",
    function (event) {
      const target = event.target;
      if (target.tagName === "IMG") {
        // Get meal type from image path
        const imagePath = target.src;
        let mealType = "default";

        if (imagePath.includes("breakfast")) {
          mealType = "breakfast";
        } else if (imagePath.includes("lunch")) {
          mealType = "lunch";
        } else if (imagePath.includes("dinner")) {
          mealType = "dinner";
        }

        // Set fallback image based on meal type
        const fallbackImage = `../static/images/${mealType}.webp`;
        console.log(
          `Image error for ${imagePath}, using fallback: ${fallbackImage}`
        );

        // Prevent infinite loop of error events
        target.onerror = null;
        target.src = fallbackImage;
      }
    },
    true
  );
}
