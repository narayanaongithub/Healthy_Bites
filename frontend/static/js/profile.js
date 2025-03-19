// Global variables
let profileNavLinks;
let profileSections;
let API_BASE_URL = "http://localhost:5000/api";
let profileDataLoaded = false; // Track if we've successfully loaded profile data

// Initialize everything when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Make sure cart exists - if the menu.js cart initialization somehow fails
  if (!localStorage.getItem("cart")) {
    localStorage.setItem("cart", JSON.stringify([]));
  }

  // API URL - Using our API Gateway
  API_BASE_URL = "http://localhost:5000/api";

  // Make sure forms exist and are ready
  console.log("DOM loaded, checking profile forms");

  const personalInfoForm = document.getElementById("personal-info-form");
  if (personalInfoForm) {
    console.log("Personal info form found and ready");
  } else {
    console.error("Personal info form not found in DOM!");
  }

  const preferencesForm = document.getElementById("preferences-form");
  if (preferencesForm) {
    console.log("Dietary preferences form found and ready");
  } else {
    console.error("Dietary preferences form not found in DOM!");
  }

  const addressList = document.querySelector(".address-list");
  if (addressList) {
    console.log("Address list container found and ready");
  } else {
    console.error("Address list container not found in DOM!");
  }

  // Mock function for shipping section update since we may not have the actual implementation
  function updateShippingSection() {
    console.log("Updating shipping section");
    const addressList = document.querySelector(".address-list");
    if (addressList) {
      // Provide at least one sample address if there are none
      if (addressList.children.length === 0) {
        addressList.innerHTML = `
          <div class="address-card default">
            <div class="address-card-header">
              <h3>Home</h3>
              <span class="default-badge">Default</span>
            </div>
            <p>123 Main Street</p>
            <p>Apt 4B</p>
            <p>New York, NY 10001</p>
            <p>United States</p>
            <div class="address-actions">
              <button class="edit-btn"><i class="fas fa-edit"></i> Edit</button>
              <button class="delete-btn"><i class="fas fa-trash"></i> Delete</button>
            </div>
          </div>
        `;
      }
    }
  }

  // Create mock user data for testing
  function createMockUserData() {
    return {
      id: 1,
      username: "john.doe",
      email: "john.doe@example.com",
      full_name: "John Doe",
      phone: "(123) 456-7890",
      date_of_birth: "1990-01-01",
      address: "123 Main St, Apt 4B",
      city: "New York",
      state: "NY",
      postal_code: "10001",
      country: "United States",
    };
  }

  // Initialize the profile section navigation
  function initProfileNavigation() {
    console.log("Initializing profile navigation");
    profileNavLinks = document.querySelectorAll(".profile-nav a");
    profileSections = document.querySelectorAll(".profile-section");

    console.log(
      `Found ${profileNavLinks.length} navigation links and ${profileSections.length} sections`
    );

    if (profileNavLinks.length > 0 && profileSections.length > 0) {
      // First, hide all sections except the first one
      profileSections.forEach((section, index) => {
        if (index === 0) {
          section.classList.add("active");
          section.style.display = "block";
          section.style.opacity = "1";
          section.style.visibility = "visible";
        } else {
          section.classList.remove("active");
          section.style.display = "none";
          section.style.opacity = "0";
          section.style.visibility = "hidden";
        }
      });

      // Make first nav link active
      profileNavLinks.forEach((link, index) => {
        if (index === 0) {
          link.parentElement.classList.add("active");
        } else {
          link.parentElement.classList.remove("active");
        }
      });

      // Add click event listeners to navigation links
      profileNavLinks.forEach((link) => {
        link.addEventListener("click", function (e) {
          e.preventDefault();

          const targetId = this.getAttribute("href").substring(1);
          console.log(`Nav link clicked for section: ${targetId}`);

          // Remove active class from all links and hide all sections
          profileNavLinks.forEach((navLink) => {
            navLink.parentElement.classList.remove("active");
          });

          profileSections.forEach((section) => {
            section.classList.remove("active");
            section.style.display = "none";
            section.style.opacity = "0";
            section.style.visibility = "hidden";
          });

          // Add active class to clicked link and show corresponding section
          this.parentElement.classList.add("active");

          const targetSection = document.getElementById(targetId);
          if (targetSection) {
            targetSection.classList.add("active");
            targetSection.style.display = "block";
            targetSection.style.opacity = "1";
            targetSection.style.visibility = "visible";
            console.log(`Activated section: ${targetId}`);

            // If this is the shipping section, update it
            if (targetId === "shipping") {
              updateShippingSection();
            }
          } else {
            console.error(`Target section not found: ${targetId}`);
          }
        });
      });
    }
  }

  // Get user data from API
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.log("No token found, redirecting to login");
        window.location.href = "landing.html";
        return null;
      }

      // First, check localStorage for registration data
      const storedData = localStorage.getItem("userData");
      console.log(
        "Checking localStorage for userData:",
        storedData ? JSON.parse(storedData) : "None"
      );

      console.log("Fetching user profile data from API");
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(`Error fetching profile: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const userData = await response.json();
      console.log("Fetched user data from API:", userData);

      // Check if the profile is empty (has user_id but no other meaningful data)
      const isEmptyProfile =
        userData &&
        (!userData.full_name || userData.full_name === "") &&
        (!userData.phone || userData.phone === "") &&
        (!userData.address || userData.address === "");

      if (isEmptyProfile) {
        console.log(
          "Empty profile detected from API, using localStorage data if available"
        );
        const existingData = localStorage.getItem("userData");
        if (existingData) {
          const parsedData = JSON.parse(existingData);
          console.log("Using registration data from localStorage:", parsedData);

          // Create a merged object with data from both sources
          const mergedData = {
            ...userData,
            ...parsedData,
            // Ensure user_id from API is preserved
            user_id: userData.user_id || parsedData.id,
          };

          console.log("Merged data from API and localStorage:", mergedData);
          profileDataLoaded = true;
          localStorage.setItem("userData", JSON.stringify(mergedData));
          return mergedData;
        }
      } else {
        // Profile has data, store it and mark as loaded
        console.log("Profile data from API is complete, using it");
        profileDataLoaded = true;
        localStorage.setItem("userData", JSON.stringify(userData));
        return userData;
      }

      // Return the API data even if it's empty
      return userData;
    } catch (error) {
      console.error("Error fetching user data:", error);
      // If we have existing user data in localStorage, use it as fallback
      const existingData = localStorage.getItem("userData");
      if (existingData) {
        console.log("Using existing user data from localStorage as fallback");
        const parsedData = JSON.parse(existingData);
        profileDataLoaded = true;
        return parsedData;
      }
      // If no existing data, create mock data for testing
      console.log("Creating mock user data for testing");
      return createMockUserData();
    }
  };

  // Populate profile data from API or localStorage
  const populateProfileData = async () => {
    const userData = await fetchUserData();

    if (userData) {
      console.log("Populating profile form with user data:", userData);

      const safeSetValue = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
          element.value = value || "";
        } else {
          console.warn(`Element with ID ${id} not found in the DOM`);
        }
      };

      // Split full_name into first and last name if needed
      if (userData.full_name) {
        const nameParts = userData.full_name.split(" ");
        if (nameParts.length > 1) {
          safeSetValue("first-name", nameParts[0]);
          safeSetValue("last-name", nameParts.slice(1).join(" "));
        } else {
          safeSetValue("first-name", userData.full_name);
        }
      }

      // Set remaining form fields
      safeSetValue("email", userData.email);
      safeSetValue("phone", userData.phone);
      safeSetValue("dob", userData.date_of_birth);
      safeSetValue("address", userData.address);
      safeSetValue("city", userData.city);
      safeSetValue("state", userData.state);
      safeSetValue("postal_code", userData.postal_code);
      safeSetValue("country", userData.country);

      return userData;
    } else {
      console.error("Failed to fetch user data");
      return null;
    }
  };

  // Setup personal information form submission
  const setupPersonalInfoForm = () => {
    const personalInfoForm = document.getElementById("personal-info-form");
    if (personalInfoForm) {
      personalInfoForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Combine first and last name
        const firstName = document.getElementById("first-name").value.trim();
        const lastName = document.getElementById("last-name").value.trim();
        const fullName = `${firstName} ${lastName}`.trim();

        // Create profile data object
        const profileData = {
          full_name: fullName,
          email: document.getElementById("email").value.trim(),
          phone: document.getElementById("phone").value.trim(),
          date_of_birth: document.getElementById("dob").value,
          address: document.getElementById("address").value.trim(),
          city: document.getElementById("city").value.trim(),
          state: document.getElementById("state").value.trim(),
          postal_code: document.getElementById("postal_code").value.trim(),
          country: document.getElementById("country").value.trim(),
        };

        console.log("Submitting profile data:", profileData);

        try {
          const token = localStorage.getItem("accessToken");
          if (!token) {
            console.error("No token found, cannot save profile");
            showNotification("Authentication required", "error");
            return;
          }

          console.log(
            `Sending profile data to API: ${API_BASE_URL}/users/profile/simple`
          );
          console.log("Profile data:", profileData);
          console.log("Token:", token.substring(0, 10) + "...");

          // Use our new simplified endpoint
          const response = await fetch(`${API_BASE_URL}/users/profile/simple`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(profileData),
          });

          console.log("API Response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response text:", errorText);
            throw new Error(
              `HTTP error! status: ${response.status}, message: ${errorText}`
            );
          }

          const result = await response.json();
          console.log("Profile updated successfully:", result);

          // Update localStorage with new data
          localStorage.setItem("userData", JSON.stringify(result.user));

          showNotification("Profile information updated successfully");
        } catch (error) {
          console.error("Error saving profile data:", error);
          alert(`Failed to save profile: ${error.message}`);
          showNotification("Failed to update profile information", "error");
        }
      });
    } else {
      console.error("Personal info form not found");
    }
  };

  // Function to fetch and populate dietary preferences
  const fetchAndPopulateDietaryPreferences = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No token found, cannot fetch dietary preferences");
        return;
      }

      console.log(
        `Fetching dietary preferences from API: ${API_BASE_URL}/users/dietary-preferences`
      );

      const response = await fetch(
        `${API_BASE_URL}/users/dietary-preferences`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error(`Error fetching preferences: ${response.status}`);
        return;
      }

      const preferences = await response.json();
      console.log("Fetched dietary preferences:", preferences);

      // Reset form values
      document.getElementById("diet-restrictions").value = "";
      document.getElementById("meal-preferences").value = "";
      document.getElementById("allergies").value = "";

      // Populate form fields based on preference types
      preferences.forEach((pref) => {
        if (pref.preference_type === "dietary_restrictions") {
          document.getElementById("diet-restrictions").value =
            pref.preference_value;
        } else if (pref.preference_type === "meal_preferences") {
          document.getElementById("meal-preferences").value =
            pref.preference_value;
        } else if (pref.preference_type === "allergies") {
          document.getElementById("allergies").value = pref.preference_value;
        }
      });

      console.log("Populated dietary preferences form");
    } catch (error) {
      console.error("Error fetching dietary preferences:", error);
    }
  };

  // Set up dietary preferences form submission
  const setupDietaryPreferencesForm = () => {
    // Fetch and populate the form with existing data
    fetchAndPopulateDietaryPreferences();

    const preferencesForm = document.getElementById("preferences-form");
    if (preferencesForm) {
      preferencesForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Get values from text inputs
        const dietRestrictions = document
          .getElementById("diet-restrictions")
          .value.trim();
        const mealPreferences = document
          .getElementById("meal-preferences")
          .value.trim();
        const allergies = document.getElementById("allergies").value.trim();

        // Create simplified preferences object
        const simpleDietaryPreferences = {
          diet_restrictions: dietRestrictions,
          meal_preferences: mealPreferences,
          allergies: allergies,
        };

        console.log(
          "Submitting simple dietary preferences:",
          simpleDietaryPreferences
        );

        try {
          const token = localStorage.getItem("accessToken");
          if (!token) {
            showNotification("Authentication required", "error");
            return;
          }

          console.log(
            `Sending simple preferences to API: ${API_BASE_URL}/users/dietary-preferences/simple`
          );
          console.log("Request data:", simpleDietaryPreferences);
          console.log("Token:", token.substring(0, 10) + "...");

          // Make the request to the API
          const response = await fetch(
            `${API_BASE_URL}/users/dietary-preferences/simple`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(simpleDietaryPreferences),
            }
          );

          console.log("API Response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response text:", errorText);
            throw new Error(
              `HTTP error! status: ${response.status}, message: ${errorText}`
            );
          }

          const result = await response.json();
          console.log("Dietary preferences saved successfully:", result);
          showNotification("Dietary preferences saved successfully");
        } catch (error) {
          console.error("Error saving dietary preferences:", error);
          alert(`Failed to save preferences: ${error.message}`);
          showNotification("Failed to save dietary preferences", "error");
        }
      });
    } else {
      console.error("Dietary preferences form not found");
    }
  };

  // Set up password form
  const setupPasswordForm = () => {
    const passwordForm = document.getElementById("password-form");
    if (passwordForm) {
      passwordForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const currentPassword =
          document.getElementById("current-password").value;
        const newPassword = document.getElementById("new-password").value;
        const confirmPassword =
          document.getElementById("confirm-password").value;

        // Validate password
        if (newPassword !== confirmPassword) {
          showNotification("New passwords do not match", "error");
          return;
        }

        // Validate password strength
        if (newPassword.length < 8) {
          showNotification(
            "Password must be at least 8 characters long",
            "error"
          );
          return;
        }

        try {
          const token = localStorage.getItem("accessToken");
          if (!token) {
            showNotification("Authentication required", "error");
            return;
          }

          const response = await fetch(`${API_BASE_URL}/users/password`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              current_password: currentPassword,
              new_password: newPassword,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to update password");
          }

          const result = await response.json();
          console.log("Password updated:", result);

          // Clear form
          passwordForm.reset();

          showNotification("Password updated successfully");
        } catch (error) {
          console.error("Error updating password:", error);
          showNotification(
            error.message || "Failed to update password",
            "error"
          );
        }
      });
    }
  };

  // Function to show notifications
  function showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  }

  // Main initialization function
  const initPage = async () => {
    console.log("Initializing profile page with all sections");

    // Initialize profile navigation
    initProfileNavigation();

    // Load user data first
    await populateProfileData();

    // Set up the personal info form submission
    setupPersonalInfoForm();

    try {
      // Set up shipping addresses
      await updateShippingSection();
      console.log("Shipping section setup complete");
    } catch (error) {
      console.error("Error setting up shipping section:", error);
    }

    try {
      // Handle dietary preferences
      setupDietaryPreferencesForm();
      console.log("Dietary preferences setup complete");
    } catch (error) {
      console.error("Error setting up dietary preferences:", error);
    }

    // Set up password form
    setupPasswordForm();

    // Add Submit buttons click handlers
    const allSubmitButtons = document.querySelectorAll('button[type="submit"]');
    allSubmitButtons.forEach((button) => {
      console.log("Found submit button:", button);
    });

    // Handle direct URL hash navigation
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      const targetId = hash.substring(1);
      const targetLink = document.querySelector(
        `.profile-nav a[href="#${targetId}"]`
      );
      if (targetLink) {
        console.log(`Direct navigation to section: ${targetId}`);
        targetLink.click();
      }
    }
  };

  // Directly add a click handler to the preferences form submit button
  const preferencesSubmitBtn = document.querySelector(
    "#preferences-form .save-btn"
  );
  if (preferencesSubmitBtn) {
    console.log("Found preferences submit button, adding direct click handler");
    preferencesSubmitBtn.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Preferences submit button clicked");

      // Get the form
      const preferencesForm = document.getElementById("preferences-form");
      if (!preferencesForm) {
        console.error("Could not find preferences form");
        return;
      }

      // Get values from text inputs
      const dietRestrictions =
        document.getElementById("diet-restrictions")?.value.trim() || "";
      const mealPreferences =
        document.getElementById("meal-preferences")?.value.trim() || "";
      const allergies =
        document.getElementById("allergies")?.value.trim() || "";

      // Create simplified preferences object
      const simpleDietaryPreferences = {
        diet_restrictions: dietRestrictions,
        meal_preferences: mealPreferences,
        allergies: allergies,
      };

      console.log(
        "DIRECT HANDLER: Submitting simple dietary preferences:",
        simpleDietaryPreferences
      );

      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          alert("Authentication required");
          return;
        }

        // Submit the form programmatically
        preferencesForm.dispatchEvent(new Event("submit"));
      } catch (error) {
        console.error(
          "DIRECT HANDLER: Error handling preferences button click:",
          error
        );
      }
    });
  } else {
    console.error("Could not find preferences submit button");
  }

  // Logout functionality
  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      // Clear user login state
      localStorage.removeItem("userLoggedIn");
      localStorage.removeItem("userData");
      localStorage.removeItem("accessToken");
      console.log("User logged out from profile page");
      // The href in the HTML already handles the redirect
    });
  }

  // Initialize everything
  initPage().catch((err) => {
    console.error("Error during page initialization:", err);
  });

  // Add styles for notifications
  const style = document.createElement("style");
  style.textContent = `
    .notification {
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      opacity: 0.9;
      z-index: 1000;
      animation: slide-in 0.3s ease-out;
    }
    
    .notification.success {
      background-color: #4caf50;
    }
    
    .notification.error {
      background-color: #f44336;
    }
    
    .notification.fade-out {
      opacity: 0;
      transition: opacity 0.5s ease-out;
    }
    
    @keyframes slide-in {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 0.9;
      }
    }`;
  document.head.appendChild(style);
});
