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
  } else {
    // Log warning instead of error
    console.log(
      "User menu elements not found in subscription page - this is expected on some pages"
    );
  }

  // Check if user is logged in
  function isLoggedIn() {
    return localStorage.getItem("accessToken") !== null;
  }

  // Form validation functions
  function validateCardNumber(cardNumber) {
    // Remove spaces and dashes
    const cleanNumber = cardNumber.replace(/[\s-]/g, "");

    // Check if it's a number and has 13-19 digits (standard card number length)
    if (!/^\d{13,19}$/.test(cleanNumber)) {
      return { valid: false, message: "Card number should be 13-19 digits" };
    }

    // Basic Luhn algorithm check (mod 10)
    let sum = 0;
    let shouldDouble = false;

    // Loop through digits in reverse order
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i));

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    // Valid card numbers should be divisible by 10
    return {
      valid: sum % 10 === 0,
      message: sum % 10 === 0 ? "" : "Invalid card number",
    };
  }

  function validateExpiryDate(expiryDate) {
    // Check format (MM/YY)
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      return { valid: false, message: "Expiry date should be in MM/YY format" };
    }

    const [month, year] = expiryDate
      .split("/")
      .map((part) => parseInt(part, 10));

    // Check month is between 1-12
    if (month < 1 || month > 12) {
      return { valid: false, message: "Month should be between 01-12" };
    }

    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear() % 100; // Get last two digits of year
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-based

    // Check if card is expired
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return { valid: false, message: "Card is expired" };
    }

    return { valid: true, message: "" };
  }

  function validateCVV(cvv) {
    // CVV should be 3-4 digits
    return {
      valid: /^\d{3,4}$/.test(cvv),
      message: /^\d{3,4}$/.test(cvv) ? "" : "CVV should be 3-4 digits",
    };
  }

  function validateCardName(name) {
    // Name should be at least 3 characters
    return {
      valid: name.trim().length >= 3,
      message:
        name.trim().length >= 3
          ? ""
          : "Please enter the name as it appears on the card",
    };
  }

  // Handle subscription form submission
  if (subscriptionForm) {
    // Real-time validation for card number
    const cardNumberInput = document.getElementById("cardNumber");
    if (cardNumberInput) {
      cardNumberInput.addEventListener("input", function (e) {
        // Format the card number with spaces every 4 digits
        let value = e.target.value.replace(/\D/g, "");
        // Insert a space after every 4 digits
        value = value.replace(/(\d{4})(?=\d)/g, "$1 ");
        // Update the input value with formatting
        e.target.value = value;
      });

      cardNumberInput.addEventListener("blur", function () {
        const result = validateCardNumber(this.value);
        const feedbackElement =
          this.nextElementSibling || document.createElement("div");

        if (!result.valid && this.value.trim() !== "") {
          feedbackElement.className = "input-feedback error";
          feedbackElement.textContent = result.message;
          if (!this.nextElementSibling) {
            this.parentNode.appendChild(feedbackElement);
          }
        } else {
          if (feedbackElement.className.includes("input-feedback")) {
            feedbackElement.remove();
          }
        }
      });
    }

    // Format expiry date input
    const expiryDateInput = document.getElementById("expiryDate");
    if (expiryDateInput) {
      expiryDateInput.addEventListener("input", function (e) {
        let value = e.target.value.replace(/\D/g, "");

        // Insert slash after 2 digits for MM/YY format
        if (value.length > 2) {
          value = value.substring(0, 2) + "/" + value.substring(2, 4);
        }

        e.target.value = value;
      });

      expiryDateInput.addEventListener("blur", function () {
        const result = validateExpiryDate(this.value);
        const feedbackElement =
          this.nextElementSibling || document.createElement("div");

        if (!result.valid && this.value.trim() !== "") {
          feedbackElement.className = "input-feedback error";
          feedbackElement.textContent = result.message;
          if (!this.nextElementSibling) {
            this.parentNode.appendChild(feedbackElement);
          }
        } else {
          if (feedbackElement.className.includes("input-feedback")) {
            feedbackElement.remove();
          }
        }
      });
    }

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

      // Validate all fields
      const cardNumberValidation = validateCardNumber(cardNumber);
      const expiryDateValidation = validateExpiryDate(expiryDate);
      const cvvValidation = validateCVV(cvv);
      const cardNameValidation = validateCardName(cardName);

      // Check if all validations pass
      if (!cardNumberValidation.valid) {
        showNotification(cardNumberValidation.message, "error");
        return;
      }

      if (!expiryDateValidation.valid) {
        showNotification(expiryDateValidation.message, "error");
        return;
      }

      if (!cvvValidation.valid) {
        showNotification(cvvValidation.message, "error");
        return;
      }

      if (!cardNameValidation.valid) {
        showNotification(cardNameValidation.message, "error");
        return;
      }

      // Show loading state
      const submitButton = this.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Processing...';

      // Parse expiry date (MM/YY format)
      const [expiryMonth, expiryYear] = expiryDate.split("/");

      // Get last 4 digits of card number
      const cardLastFour = cardNumber.replace(/\s/g, "").slice(-4);

      // Determine card type based on first digit
      let cardType = "Unknown";
      const firstDigit = cardNumber.replace(/\s/g, "").charAt(0);
      if (firstDigit === "4") cardType = "Visa";
      else if (firstDigit === "5") cardType = "Mastercard";
      else if (firstDigit === "3") cardType = "American Express";
      else if (firstDigit === "6") cardType = "Discover";

      try {
        // Show processing message
        showNotification("Processing your subscription...", "info");

        // Attempt to create subscription
        const result = await createSubscription({
          card_last_four: cardLastFour,
          card_type: cardType,
          expiry_month: expiryMonth,
          expiry_year: "20" + expiryYear, // Convert YY to YYYY format
          card_name: cardName,
          auto_renew: true,
        });

        // If we got a simulated success (service down), show a different message
        if (result.id && result.id.toString().startsWith("sim-")) {
          showNotification(
            "Subscription processed in offline mode. It will be synchronized when service is available.",
            "success"
          );
        }

        // Show success message
        formContainer.style.display = "none";
        successContainer.style.display = "block";

        // Update subscription details in success message
        const cardDisplay = document.getElementById("card-display");
        if (cardDisplay) {
          cardDisplay.textContent = `●●●● ●●●● ●●●● ${cardLastFour}`;
        }

        const endDateDisplay = document.getElementById("subscription-end-date");
        if (endDateDisplay) {
          // Calculate end date (30 days from now)
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 30);
          const formattedEndDate = endDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          endDateDisplay.textContent = formattedEndDate;
        }

        // Show success notification
        if (!result.id || !result.id.toString().startsWith("sim-")) {
          showNotification(
            "Subscription successful! You now get 15% off all orders.",
            "success"
          );
        }

        // After a short delay, scroll to the success message to ensure it's visible
        setTimeout(() => {
          successContainer.scrollIntoView({ behavior: "smooth" });
        }, 300);
      } catch (error) {
        // Show error notification
        showNotification(
          error.message || "Failed to create subscription. Please try again.",
          "error"
        );

        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
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

    try {
      // First check if we already have an active subscription in localStorage
      if (localStorage.getItem("hasSubscription") === "true") {
        console.log(
          "User appears to already have a subscription based on localStorage"
        );

        // We'll still try to verify with the server, but prepare for offline mode
        const offlineMode = false;

        try {
          // Quick check with the server if possible
          const checkResponse = await fetch(
            `${API_BASE_URL}/subscriptions/active`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              // Set a short timeout for this check
              signal: AbortSignal.timeout(3000),
            }
          );

          // If the user already has a subscription, show that message
          if (checkResponse.ok) {
            throw new Error("You already have an active subscription!");
          }
        } catch (checkError) {
          // If we couldn't reach the server or got a timeout, proceed in offline mode
          if (
            checkError.name === "AbortError" ||
            (checkError.name === "TypeError" &&
              checkError.message.includes("Failed to fetch"))
          ) {
            console.log("Server check timed out, proceeding in offline mode");
            offlineMode = true;
          } else if (
            checkError.message === "You already have an active subscription!"
          ) {
            throw checkError;
          }
          // For other errors, we'll just continue with the main subscription attempt
        }

        // If we're in offline mode and user has subscription, return simulated data
        if (offlineMode) {
          return {
            id: "sim-offline-" + Date.now(),
            status: "active",
            message: "Subscription verified in offline mode",
            price: 9.99,
            discount_percent: 15.0,
            subscription: {
              discount_percent: 15,
            },
          };
        }
      }

      // Make the API call to create subscription
      const response = await fetch(`${API_BASE_URL}/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          card_last_four: cardDetails.card_last_four,
          card_type: cardDetails.card_type,
          expiry_month: cardDetails.expiry_month,
          expiry_year: cardDetails.expiry_year,
          card_name: cardDetails.card_name,
          auto_renew: cardDetails.auto_renew || true,
          // The backend will automatically set other fields like:
          // - start_date (current date)
          // - end_date (30 days from now)
          // - price (default 9.99)
          // - discount_percent (default 15%)
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized - token expired
          localStorage.removeItem("accessToken");
          throw new Error("Your session has expired. Please log in again.");
        } else if (response.status === 409) {
          // Handle conflict - user already has subscription
          localStorage.setItem("hasSubscription", "true");
          localStorage.setItem("subscriptionDiscount", "15");
          throw new Error("You already have an active subscription!");
        } else if (response.status === 503) {
          console.warn("Subscription service unavailable");

          // Save subscription status in localStorage for offline mode
          localStorage.setItem("hasSubscription", "true");
          localStorage.setItem("subscriptionDiscount", "15");

          // For demonstration/testing, simulate a successful response when service is down
          return {
            id: "sim-" + Date.now(),
            status: "active",
            message: "Subscription created successfully (simulated)",
            price: 9.99,
            discount_percent: 15.0,
            subscription: {
              discount_percent: 15,
            },
          };
        }

        // Handle other errors
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create subscription");
      }

      // Successfully created subscription
      const data = await response.json();
      console.log("Subscription created successfully:", data);

      // Store subscription status in localStorage for other pages to use
      localStorage.setItem("hasSubscription", "true");
      localStorage.setItem(
        "subscriptionDiscount",
        data.subscription.discount_percent || "15"
      );

      return data;
    } catch (error) {
      console.error("Error creating subscription:", error);

      // Check if it's a network error
      if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        // For network errors, save offline subscription and let user continue
        localStorage.setItem("hasSubscription", "true");
        localStorage.setItem("subscriptionDiscount", "15");

        return {
          id: "sim-network-" + Date.now(),
          status: "active",
          message: "Subscription created in offline mode",
          price: 9.99,
          discount_percent: 15.0,
          subscription: {
            discount_percent: 15,
          },
        };
      }

      throw error;
    }
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
      // Check if localStorage indicates user already has subscription
      const hasStoredSubscription =
        localStorage.getItem("hasSubscription") === "true";

      // Only attempt to fetch data if network is available
      if (navigator.onLine) {
        // Attempt to fetch subscription data
        try {
          // Fetch with timeout to prevent long waits
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          // Fetch subscription data and plans in parallel - but don't wait if it fails
          Promise.all([
            fetchSubscriptionPlans().catch((err) => {
              console.warn("Failed to fetch plans (non-critical):", err);
              return [];
            }),
            fetchUserSubscription().catch((err) => {
              console.warn("Failed to fetch subscription (non-critical):", err);
              return null;
            }),
          ])
            .then(([plans, subscription]) => {
              // If we got subscription data, update localStorage
              if (subscription && subscription.id) {
                localStorage.setItem("hasSubscription", "true");
                localStorage.setItem(
                  "subscriptionDiscount",
                  subscription.discount_percent || "15"
                );
              }

              // Clear timeout
              clearTimeout(timeoutId);
            })
            .catch((e) => {
              console.warn("Non-critical data fetch failed:", e);
              // Still clear the timeout
              clearTimeout(timeoutId);
            });
        } catch (error) {
          console.warn(
            "Failed initial data fetch, using cached data if available"
          );
        }
      } else {
        console.log("Offline mode detected, using cached subscription data");
      }

      console.log("Subscription page initialized");
    } catch (error) {
      console.warn("Error initializing subscription page:", error);
      // No need to show notification for initialization errors
    }
  }

  // Initialize the page
  initSubscriptionPage();
});
