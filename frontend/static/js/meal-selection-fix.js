// JavaScript for populating the Meal Selection Form with real data

document.addEventListener("DOMContentLoaded", async function () {
  console.log("Meal selection fix loaded");

  // Initialize cart
  initializeCart();

  // Fetch all meal data
  await fetchAllMealData();

  // Set up form submission handling
  const mealSelectionForm = document.getElementById("mealSelectionForm");
  if (mealSelectionForm) {
    mealSelectionForm.addEventListener("submit", addItemsToCart);
  }

  // Initialize the page event listeners
  initializePage();
});

// Initialize cart functionality
function initializeCart() {
  // Get cart from localStorage
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Clean up the cart to remove any problematic items
  cart = cart.map((item) => {
    // Ensure item has all required properties in the correct format
    return {
      id: item.id,
      name: typeof item.name === "string" ? item.name : "Unknown Item",
      price:
        typeof item.price === "number"
          ? item.price
          : typeof item.price === "string"
          ? parseFloat(item.price)
          : 0,
      meal_type: item.meal_type || "default",
      quantity: typeof item.quantity === "number" ? item.quantity : 1,
      image: item.image && typeof item.image === "string" ? item.image : null,
      image_url:
        item.image_url && typeof item.image_url === "string"
          ? item.image_url
          : null,
    };
  });

  // Save the clean cart back to localStorage
  localStorage.setItem("cart", JSON.stringify(cart));

  // Update cart count
  updateCartCount();
}

// Function to update cart count
function updateCartCount() {
  const cartCountElement = document.getElementById("cartCount");
  if (cartCountElement) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalItems = cart.reduce(
      (total, item) => total + (item.quantity || 1),
      0
    );
    cartCountElement.textContent = totalItems;
  }
}

// Function to fetch all meal data
async function fetchAllMealData() {
  try {
    // Fetch data for each meal type
    const mealTypes = ["breakfast", "lunch", "dinner"];

    // Use Promise.all to fetch all meal types in parallel
    const responses = await Promise.all(
      mealTypes.map((type) =>
        fetch(`http://localhost:5003/api/products/meal/${type}`)
          .then((response) => {
            if (!response.ok) {
              console.warn(
                `API returned status ${response.status} for ${type} meals`
              );
              return { json: () => Promise.resolve([]) };
            }
            return response;
          })
          .then((response) => response.json())
          .catch((error) => {
            console.error(`Error fetching ${type} meals:`, error);
            return [];
          })
      )
    );

    // Process each meal type's response and populate the dropdowns
    responses.forEach((meals, index) => {
      const mealType = mealTypes[index];
      console.log(`Fetched ${meals.length} ${mealType} meals`);

      // Populate dropdown for this meal type
      populateDropdown(mealType, meals);
    });
  } catch (error) {
    console.error("Error fetching meals:", error);
    // Use fallback data if API fails
    const fallbackData = getFallbackData();
    Object.keys(fallbackData).forEach((mealType) => {
      populateDropdown(mealType, fallbackData[mealType]);
    });
  }
}

// Function to populate a dropdown with meal options
function populateDropdown(mealType, meals) {
  // Get all select elements for this meal type
  const selects = document.querySelectorAll(
    `select[data-meal-type="${mealType}"]`
  );

  selects.forEach((select) => {
    // Clear all options except the first one (placeholder)
    while (select.options.length > 1) {
      select.remove(1);
    }

    // Add meal options
    meals.forEach((meal) => {
      const option = document.createElement("option");
      option.value = meal.id;
      option.setAttribute("data-price", meal.price);
      option.setAttribute("data-name", meal.name);
      option.text = `${meal.name} - $${parseFloat(meal.price).toFixed(2)}`;

      // Add image path attributes
      if (meal.image) {
        option.setAttribute("data-image", meal.image);
      }
      if (meal.image_url) {
        option.setAttribute("data-image-url", meal.image_url);
      }

      select.appendChild(option);
    });
  });
}

// Function to initialize page event listeners
function initializePage() {
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
        select.value = "";
        const quantityInput = group.querySelector("input");
        quantityInput.value = 1;

        // Clear meal details if they exist
        const detailsElement = group.querySelector(".meal-details");
        if (detailsElement) {
          detailsElement.innerHTML = "";
        }
      }
    });
  });
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

  // Clear any meal details
  const detailsElement = template.querySelector(".meal-details");
  if (detailsElement) {
    detailsElement.innerHTML = "";
  }

  // Add event listener to the remove button
  const removeButton = template.querySelector(".remove-meal-button");
  removeButton.addEventListener("click", function () {
    if (container.children.length > 1) {
      container.removeChild(template);
    } else {
      // If this is the last one, just reset it
      select.value = "";
      quantityInput.value = 1;

      // Clear meal details if they exist
      const detailsElement = template.querySelector(".meal-details");
      if (detailsElement) {
        detailsElement.innerHTML = "";
      }
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

    // Get image path - try data attributes first
    let imagePath =
      selectedOption.getAttribute("data-image-url") ||
      selectedOption.getAttribute("data-image");

    // If no specific image is set, use the default pattern
    if (!imagePath) {
      const timestamp = new Date().getTime();
      imagePath = `../static/images/${mealType}.jpg?t=${timestamp}`;
    } else if (!imagePath.startsWith("http") && !imagePath.startsWith("../")) {
      // Add path prefix if needed
      imagePath = `../static/images/${imagePath}`;
    }

    // Add timestamp to prevent caching
    if (!imagePath.includes("?")) {
      const timestamp = new Date().getTime();
      imagePath = `${imagePath}?t=${timestamp}`;
    }

    // Fallback image based on meal type
    const fallbackImage =
      mealType === "lunch"
        ? "lunch.webp"
        : mealType === "dinner"
        ? "dinner.jpg"
        : "breakfast.jpg";

    const imgErrorHandler = `onerror="this.onerror=null; this.src='../static/images/${fallbackImage}';"`;

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
        <img src="${imagePath}" alt="${name}" ${imgErrorHandler} style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 10px;">
        <div>
          <span><i class="fas fa-utensils"></i> ${name}</span>
          <span class="meal-price">$${price}</span>
          <span><i class="fas fa-tag"></i> ${
            mealType.charAt(0).toUpperCase() + mealType.slice(1)
          }</span>
        </div>
      </div>
    `;
  } else {
    // If no option is selected, clear the details
    const detailsElement = select.parentElement.querySelector(".meal-details");
    if (detailsElement) {
      detailsElement.innerHTML = "";
    }
  }
}

// Add items to cart
function addItemsToCart(event) {
  event.preventDefault();

  const selectedMeals = [];
  const mealTypes = ["breakfast", "lunch", "dinner"];
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

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

        // Get image path from data attributes if available
        let imagePath =
          selectedOption.getAttribute("data-image-url") ||
          selectedOption.getAttribute("data-image") ||
          `${type}.jpg`;

        // Make sure the image path is properly formatted
        if (!imagePath.startsWith("http") && !imagePath.startsWith("../")) {
          imagePath = `${type}/${imagePath}`;
        }

        selectedMeals.push({
          id: mealId,
          name: mealName,
          price: mealPrice,
          quantity: quantity,
          image: imagePath,
          meal_type: type,
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

// Function to get fallback meal data
function getFallbackData() {
  console.log("Using fallback meal data");

  return {
    breakfast: [
      {
        id: "breakfast-1",
        name: "Avocado Toast with Eggs",
        description: "Whole grain toast topped with avocado and poached eggs",
        price: 8.99,
        image: "breakfast.jpg",
        meal_type: "breakfast",
      },
      {
        id: "breakfast-2",
        name: "Greek Yogurt Parfait",
        description: "Greek yogurt with fresh berries, honey and granola",
        price: 6.99,
        image: "breakfast.jpg",
        meal_type: "breakfast",
      },
      {
        id: "breakfast-3",
        name: "Protein Breakfast Bowl",
        description: "Eggs, quinoa, avocado, black beans, and salsa",
        price: 10.99,
        image: "breakfast.jpg",
        meal_type: "breakfast",
      },
    ],
    lunch: [
      {
        id: "lunch-1",
        name: "Grilled Chicken Salad",
        description:
          "Fresh greens with grilled chicken, avocado and light dressing",
        price: 10.99,
        image: "lunch.webp",
        meal_type: "lunch",
      },
      {
        id: "lunch-2",
        name: "Quinoa Veggie Bowl",
        description: "Protein-rich quinoa with roasted seasonal vegetables",
        price: 9.99,
        image: "lunch.webp",
        meal_type: "lunch",
      },
      {
        id: "lunch-3",
        name: "Salmon Poke Bowl",
        description: "Fresh salmon, brown rice, vegetables, and ginger sauce",
        price: 12.99,
        image: "lunch.webp",
        meal_type: "lunch",
      },
    ],
    dinner: [
      {
        id: "dinner-1",
        name: "Baked Salmon",
        description: "Wild-caught salmon with roasted vegetables and quinoa",
        price: 14.99,
        image: "dinner.jpg",
        meal_type: "dinner",
      },
      {
        id: "dinner-2",
        name: "Vegetable Stir Fry",
        description: "Fresh vegetables stir-fried with tofu in a light sauce",
        price: 11.99,
        image: "dinner.jpg",
        meal_type: "dinner",
      },
      {
        id: "dinner-3",
        name: "Grilled Steak with Vegetables",
        description: "Grass-fed beef with seasonal vegetables and sweet potato",
        price: 16.99,
        image: "dinner.jpg",
        meal_type: "dinner",
      },
    ],
  };
}
