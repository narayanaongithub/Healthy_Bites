// JavaScript for Subscription Page

document.addEventListener("DOMContentLoaded", function () {
  // API URL
  const API_BASE_URL = "http://localhost:5000/api";

  // DOM Elements
  const subscriptionForm = document.getElementById("subscriptionForm");
  const formContainer = document.getElementById("subscription-form-container");
  const successContainer = document.getElementById("subscription-success");

  // Check if user menu elements exist to prevent console errors
  const userMenuBtn = document.querySelector(".user-menu-btn");
  const userDropdown = document.querySelector(".dropdown-menu");

  // Only initialize user menu if elements exist
  if (userMenuBtn && userDropdown) {
    // User menu initialization code
    userMenuBtn.addEventListener("click", function () {
      userDropdown.classList.toggle("active");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (e) {
      if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove("active");
      }
    });
  }

  // Check if user is logged in
  function isLoggedIn() {
    return localStorage.getItem("accessToken") !== null;
  }

  // Handle subscription form submission
  if (subscriptionForm) {
    subscriptionForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Check if user is logged in
      if (!isLoggedIn()) {
        showNotification("Please log in to subscribe", "error");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1500);
        return;
      }

      // Get form values
      const cardNumber = document.getElementById("cardNumber").value;
      const expiryDate = document.getElementById("expiryDate").value;
      const cvv = document.getElementById("cvv").value;
      const cardName = document.getElementById("cardName").value;

      // Basic validation
      if (!cardNumber || !expiryDate || !cvv || !cardName) {
        showNotification("Please fill in all fields", "error");
        return;
      }

      // Parse expiry date (MM/YY format)
      const [expiryMonth, expiryYear] = expiryDate.split("/");

      // Get last 4 digits of card number
      const cardLastFour = cardNumber.slice(-4);

      // Determine card type based on first digit
      let cardType = "Unknown";
      const firstDigit = cardNumber.charAt(0);
      if (firstDigit === "4") cardType = "Visa";
      else if (firstDigit === "5") cardType = "Mastercard";
      else if (firstDigit === "3") cardType = "American Express";
      else if (firstDigit === "6") cardType = "Discover";

      try {
        // Attempt to create subscription
        await createSubscription({
          card_last_four: cardLastFour,
          card_type: cardType,
          expiry_month: expiryMonth,
          expiry_year: expiryYear,
          card_name: cardName,
          auto_renew: true,
        });

        // Show success message
        formContainer.style.display = "none";
        successContainer.style.display = "block";

        // Show notification
        showNotification("Subscription successful!", "success");
      } catch (error) {
        // Show error notification
        showNotification(
          error.message || "Failed to create subscription. Please try again.",
          "error"
        );
      }
    });
  }

  // Function to create a subscription (sends data to backend)
  async function createSubscription(cardDetails) {
    // Get user token
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("You must be logged in to subscribe");
    }

    const response = await fetch(`${API_BASE_URL}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cardDetails),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create subscription");
    }

    return await response.json();
  }

  // Function to display notification
  function showNotification(message, type = "success") {
    // Check if notification container exists
    let container = document.querySelector(".notification-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "notification-container";
      document.body.appendChild(container);
    }

    // Create notification
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    container.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => {
        notification.remove();

        // Remove container if empty
        if (container.children.length === 0) {
          container.remove();
        }
      }, 500);
    }, 5000);
  }

  // Function to fetch user subscription with error handling
  async function fetchUserSubscription() {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.log("No token found, user not logged in");
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/subscriptions/active`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 503) {
          console.log("Subscription service unavailable");
          return { error: "Service unavailable" };
        }

        const errorData = await response.json();
        console.warn("Error fetching subscription:", errorData);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching user subscription:", error);
      // Return a dummy subscription for UI testing when API is down
      return null;
    }
  }

  // Function to fetch subscription plans with error handling
  async function fetchSubscriptionPlans() {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription-plans`);

      if (!response.ok) {
        if (response.status === 503) {
          console.log("Subscription plans service unavailable");
          return [{ error: "Service unavailable" }];
        }

        const errorData = await response.json();
        console.warn("Error fetching subscription plans:", errorData);
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      // Return dummy plans for UI testing when API is down
      return [];
    }
  }

  // Initialize subscription page with error handling
  async function initSubscriptionPage() {
    try {
      // Fetch subscription data and plans
      const [subscriptionPlans, userSubscription] = await Promise.all([
        fetchSubscriptionPlans().catch((err) => {
          console.error("Failed to fetch plans:", err);
          return [];
        }),
        fetchUserSubscription().catch((err) => {
          console.error("Failed to fetch subscription:", err);
          return null;
        }),
      ]);

      // Page initialization logic can go here
      console.log("Subscription page initialized");
    } catch (error) {
      console.error("Error initializing subscription page:", error);
      showNotification(
        "Error loading subscription data. Please try again later.",
        "error"
      );
    }
  }

  // Initialize the page
  initSubscriptionPage();
});
