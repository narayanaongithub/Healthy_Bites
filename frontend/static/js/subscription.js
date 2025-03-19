// JavaScript for Subscription Page

document.addEventListener("DOMContentLoaded", function () {
  // API URL - Using our API Gateway
  const API_BASE_URL = "http://localhost:5000/api";

  // User dropdown menu functionality - Fixing dropdown menu
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userDropdown = document.getElementById("userDropdown");

  console.log("Subscription page loaded, checking elements:", {
    userMenuBtn: userMenuBtn ? "Found" : "Not found",
    userDropdown: userDropdown ? "Found" : "Not found",
  });

  if (userMenuBtn && userDropdown) {
    console.log(
      "Setting up user dropdown menu in subscription page",
      userMenuBtn,
      userDropdown
    );

    userMenuBtn.addEventListener("click", function (e) {
      e.preventDefault(); // Add preventDefault to ensure the button click is fully captured
      e.stopPropagation();
      userDropdown.classList.toggle("active");
      console.log(
        "User dropdown toggled in subscription page",
        userDropdown.classList.contains("active")
      );
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (e) {
      if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove("active");
      }
    });
  } else {
    console.error("User menu elements not found in subscription page:", {
      userMenuBtn,
      userDropdown,
    });
  }

  // Logout functionality
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      // Clear user login state
      localStorage.removeItem("userLoggedIn");
      localStorage.removeItem("userData");
      localStorage.removeItem("accessToken");
      console.log("User logged out from subscription page");
      // The href in the HTML already handles the redirect
    });
  }

  // Check if user is logged in
  function isLoggedIn() {
    return (
      localStorage.getItem("accessToken") && localStorage.getItem("userData")
    );
  }

  // Function to fetch subscription plans from API
  async function fetchSubscriptionPlans() {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription-plans`);

      if (!response.ok) {
        throw new Error("Failed to fetch subscription plans");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching subscription plans:", error);

      // Return default plans if API fails
      return [
        {
          id: 1,
          name: "Basic Monthly",
          description: "5 meals per week, standard options",
          price: 99.99,
          duration_days: 30,
          meals_per_week: 5,
        },
        {
          id: 2,
          name: "Premium Monthly",
          description: "7 meals per week, premium options",
          price: 149.99,
          duration_days: 30,
          meals_per_week: 7,
        },
        {
          id: 3,
          name: "Family Monthly",
          description: "5 meals per week for a family of 4",
          price: 299.99,
          duration_days: 30,
          meals_per_week: 5,
        },
      ];
    }
  }

  // Function to fetch user's active subscription if any
  async function fetchUserSubscription() {
    if (!isLoggedIn()) return null;

    const token = localStorage.getItem("accessToken");

    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/active`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        // No active subscription found
        return null;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch user subscription");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching user subscription:", error);
      return null;
    }
  }

  // Function to display subscription plans
  function displaySubscriptionPlans(plans, userSubscription) {
    const plansContainer = document.querySelector(".subscription-plans");
    if (!plansContainer) return;

    plansContainer.innerHTML = "";

    plans.forEach((plan) => {
      const planElement = document.createElement("div");
      planElement.className = "subscription-plan";

      // Check if this is the user's current plan
      const isCurrentPlan =
        userSubscription &&
        userSubscription.plan &&
        userSubscription.plan.id === plan.id;

      if (isCurrentPlan) {
        planElement.classList.add("current-plan");
      }

      planElement.innerHTML = `
        <h3>${plan.name}</h3>
        <p class="plan-description">${plan.description}</p>
        <div class="plan-details">
          <p><strong>Price:</strong> $${plan.price.toFixed(2)} per month</p>
          <p><strong>Meals:</strong> ${plan.meals_per_week} per week</p>
          <p><strong>Duration:</strong> ${plan.duration_days} days</p>
        </div>
        <button class="select-plan-btn" data-plan-id="${plan.id}" ${
        isCurrentPlan ? "disabled" : ""
      }>
          ${isCurrentPlan ? "Current Plan" : "Select Plan"}
        </button>
      `;

      plansContainer.appendChild(planElement);
    });

    // Add event listeners to the Select Plan buttons
    document.querySelectorAll(".select-plan-btn").forEach((button) => {
      if (button.disabled) return;

      button.addEventListener("click", function () {
        if (!isLoggedIn()) {
          showNotification("Please login to subscribe to a plan", "error");
          setTimeout(() => {
            window.location.href = "auth.html";
          }, 2000);
          return;
        }

        const planId = parseInt(this.getAttribute("data-plan-id"));
        const selectedPlan = plans.find((p) => p.id === planId);

        if (selectedPlan) {
          displaySubscriptionConfirmation(selectedPlan);
        }
      });
    });
  }

  // Function to display subscription confirmation popup
  function displaySubscriptionConfirmation(plan) {
    // Create overlay and popup container
    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const popup = document.createElement("div");
    popup.className = "subscription-popup";

    popup.innerHTML = `
      <h3>Confirm Subscription</h3>
      <p>You are about to subscribe to the <strong>${
        plan.name
      }</strong> plan.</p>
      <div class="plan-summary">
        <p><strong>Price:</strong> $${plan.price.toFixed(2)} per month</p>
        <p><strong>Meals:</strong> ${plan.meals_per_week} per week</p>
      </div>
      <div class="payment-info">
        <div class="form-group">
          <label for="card-number">Card Number</label>
          <input type="text" id="card-number" placeholder="1234 5678 9012 3456" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="expiry-date">Expiry Date</label>
            <input type="text" id="expiry-date" placeholder="MM/YY" required>
          </div>
          <div class="form-group">
            <label for="cvv">CVV</label>
            <input type="text" id="cvv" placeholder="123" required>
          </div>
        </div>
      </div>
      <div class="popup-actions">
        <button id="confirm-subscription" class="primary-btn">Confirm Subscription</button>
        <button id="cancel-subscription" class="secondary-btn">Cancel</button>
      </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Add event listeners to buttons
    document
      .getElementById("cancel-subscription")
      .addEventListener("click", function () {
        document.body.removeChild(overlay);
      });

    document
      .getElementById("confirm-subscription")
      .addEventListener("click", async function () {
        // Get payment info (in a real app, this would be handled securely)
        const cardNumber = document.getElementById("card-number").value;
        const expiryDate = document.getElementById("expiry-date").value;
        const cvv = document.getElementById("cvv").value;

        // Basic validation
        if (!cardNumber || !expiryDate || !cvv) {
          alert("Please fill in all payment details");
          return;
        }

        try {
          // Submit subscription
          await createSubscription(plan.id);

          // Close popup
          document.body.removeChild(overlay);

          // Show success notification
          showNotification(
            "Subscription successful! You can now enjoy your meal plan."
          );

          // Reload page to show updated subscription
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } catch (error) {
          console.error("Error creating subscription:", error);
          showNotification(
            "Failed to create subscription. Please try again.",
            "error"
          );
        }
      });
  }

  // Function to create a subscription
  async function createSubscription(planId) {
    if (!isLoggedIn()) {
      throw new Error("User not logged in");
    }

    const token = localStorage.getItem("accessToken");

    const response = await fetch(`${API_BASE_URL}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        plan_id: planId,
        auto_renew: true,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create subscription");
    }

    return await response.json();
  }

  // Function to display user's current subscription
  function displayUserSubscription(subscription) {
    const activeSubscriptionContainer = document.getElementById(
      "active-subscription"
    );
    if (!activeSubscriptionContainer) return;

    if (!subscription) {
      activeSubscriptionContainer.innerHTML = `
        <div class="no-subscription">
          <p>You don't have an active subscription. Choose from our plans below:</p>
        </div>
      `;
      return;
    }

    const plan = subscription.plan;
    const startDate = new Date(subscription.start_date);
    const endDate = new Date(subscription.end_date);

    activeSubscriptionContainer.innerHTML = `
      <div class="subscription-card">
        <h3>Your Active Subscription</h3>
        <div class="subscription-details">
          <p><strong>Plan:</strong> ${plan.name}</p>
          <p><strong>Price:</strong> $${plan.price.toFixed(2)} per month</p>
          <p><strong>Meals per Week:</strong> ${plan.meals_per_week}</p>
          <p><strong>Start Date:</strong> ${startDate.toLocaleDateString()}</p>
          <p><strong>End Date:</strong> ${endDate.toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${subscription.status}</p>
          <p><strong>Auto-renew:</strong> ${
            subscription.auto_renew ? "Yes" : "No"
          }</p>
        </div>
        <div class="subscription-actions">
          <button id="cancel-subscription-btn" class="cancel-btn">Cancel Subscription</button>
          <button id="toggle-auto-renew-btn" class="secondary-btn">
            ${
              subscription.auto_renew
                ? "Turn Off Auto-renew"
                : "Turn On Auto-renew"
            }
          </button>
        </div>
      </div>
    `;

    // Add event listeners for subscription actions
    document
      .getElementById("cancel-subscription-btn")
      .addEventListener("click", async function () {
        if (confirm("Are you sure you want to cancel your subscription?")) {
          try {
            await cancelSubscription(subscription.id);
            showNotification("Subscription cancelled successfully");
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } catch (error) {
            console.error("Error cancelling subscription:", error);
            showNotification("Failed to cancel subscription", "error");
          }
        }
      });

    document
      .getElementById("toggle-auto-renew-btn")
      .addEventListener("click", async function () {
        try {
          await updateSubscription(subscription.id, {
            auto_renew: !subscription.auto_renew,
          });
          showNotification(
            `Auto-renewal ${
              subscription.auto_renew ? "disabled" : "enabled"
            } successfully`
          );
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } catch (error) {
          console.error("Error updating subscription:", error);
          showNotification("Failed to update subscription", "error");
        }
      });
  }

  // Function to cancel a subscription
  async function cancelSubscription(subscriptionId) {
    if (!isLoggedIn()) {
      throw new Error("User not logged in");
    }

    const token = localStorage.getItem("accessToken");

    const response = await fetch(
      `${API_BASE_URL}/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to cancel subscription");
    }

    return await response.json();
  }

  // Function to update a subscription
  async function updateSubscription(subscriptionId, data) {
    if (!isLoggedIn()) {
      throw new Error("User not logged in");
    }

    const token = localStorage.getItem("accessToken");

    const response = await fetch(
      `${API_BASE_URL}/subscriptions/${subscriptionId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update subscription");
    }

    return await response.json();
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

  // Initialize the subscription page
  async function initSubscriptionPage() {
    // Redirect to login if not logged in
    if (!isLoggedIn()) {
      document.querySelector(".subscription-container").innerHTML = `
        <div class="login-message">
          <h2>Please Login to Manage Subscriptions</h2>
          <p>You need to be logged in to view and manage your meal subscription plans.</p>
          <a href="auth.html" class="primary-btn">Login / Register</a>
        </div>
      `;
      return;
    }

    // Fetch subscription plans and user's active subscription
    const [plans, userSubscription] = await Promise.all([
      fetchSubscriptionPlans(),
      fetchUserSubscription(),
    ]);

    // Display user's active subscription if any
    displayUserSubscription(userSubscription);

    // Display subscription plans
    displaySubscriptionPlans(plans, userSubscription);
  }

  // Initialize the page
  initSubscriptionPage();
});
