// Cart Count Utility Script
// This script is dedicated to handling cart count display across all pages

// Initialize immediately when loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("Cart count utility loaded");

  // Update cart count immediately
  updateCartCountDisplay();

  // Set up localStorage event listener to catch changes from other pages
  window.addEventListener("storage", function (e) {
    if (e.key === "cart") {
      console.log("Cart data changed in another tab/window");
      updateCartCountDisplay();
    }
  });

  // Update every 2 seconds to ensure consistency
  setInterval(updateCartCountDisplay, 2000);
});

// Function to update cart count display
function updateCartCountDisplay() {
  try {
    // Find all cart count elements
    const cartCountElements = document.querySelectorAll(".cart-count");
    if (cartCountElements.length === 0) {
      console.log("No cart count elements found on page");
      return;
    }

    // Get cart from localStorage
    let cart;
    try {
      cart = JSON.parse(localStorage.getItem("cart")) || [];
    } catch (error) {
      console.error("Error parsing cart from localStorage:", error);
      cart = [];
    }

    // Calculate total items
    const totalItems = cart.reduce(
      (sum, item) => sum + (parseInt(item.quantity) || 1),
      0
    );

    // Update all cart count elements
    cartCountElements.forEach((element) => {
      if (element.textContent !== totalItems.toString()) {
        element.textContent = totalItems;
        console.log(`Updated cart count element to ${totalItems}`);
      }
    });
  } catch (error) {
    console.error("Error updating cart count display:", error);
  }
}
