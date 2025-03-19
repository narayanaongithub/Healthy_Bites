document.addEventListener("DOMContentLoaded", function () {
  // API URL - Using our API Gateway
  const API_BASE_URL = "http://localhost:5001/api";

  // Tab switching functionality
  const loginTab = document.getElementById("login-tab");
  const registerTab = document.getElementById("register-tab");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const switchToRegister = document.getElementById("switch-to-register");
  const switchToLogin = document.getElementById("switch-to-login");

  // Error message display
  const loginErrorMsg = document.createElement("div");
  loginErrorMsg.className = "error-message";
  document.getElementById("loginForm").appendChild(loginErrorMsg);

  const registerErrorMsg = document.createElement("div");
  registerErrorMsg.className = "error-message";
  document.getElementById("registerForm").appendChild(registerErrorMsg);

  loginTab.addEventListener("click", function () {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    loginForm.classList.add("active");
    registerForm.classList.remove("active");
    loginErrorMsg.textContent = "";
    registerErrorMsg.textContent = "";
  });

  registerTab.addEventListener("click", function () {
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
    registerForm.classList.add("active");
    loginForm.classList.remove("active");
    loginErrorMsg.textContent = "";
    registerErrorMsg.textContent = "";
  });

  switchToRegister.addEventListener("click", function (e) {
    e.preventDefault();
    registerTab.click();
  });

  switchToLogin.addEventListener("click", function (e) {
    e.preventDefault();
    loginTab.click();
  });

  // Helper function to handle API errors
  function handleApiError(error, errorElement) {
    console.error("API Error:", error);
    errorElement.textContent =
      error.message || "An error occurred. Please try again.";
  }

  // Handle user authentication storage
  function storeAuthData(data) {
    localStorage.setItem("userData", JSON.stringify(data.user));
    localStorage.setItem("accessToken", data.token);
    localStorage.setItem("userLoggedIn", "true");
    console.log("Auth data stored successfully");
  }

  // Form submission - Login
  document
    .getElementById("loginForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      loginErrorMsg.textContent = "";

      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      // Simple validation
      if (!email || !password) {
        loginErrorMsg.textContent = "Please enter both email and password";
        return;
      }

      try {
        // Show loading state
        loginErrorMsg.textContent = "Logging in...";

        // Log the request to help with debugging
        console.log("Sending login request to:", `${API_BASE_URL}/auth/login`);
        console.log("Login credentials:", {
          username: email,
          password: "****",
        });

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: email, // Using email as username
            password: password,
          }),
        });

        console.log("Login response status:", response.status);
        const responseText = await response.text();
        console.log("Raw login response:", responseText);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error("Failed to parse JSON response:", e);
          loginErrorMsg.textContent =
            "Server returned an invalid response. Please try again.";
          return;
        }

        if (!response.ok) {
          loginErrorMsg.textContent =
            data.message || "Login failed. Please check your credentials.";
          console.error("Login failed:", data);
          return;
        }

        console.log("Login successful, storing auth data");

        // Store authentication data
        storeAuthData(data);

        // Redirect to index page
        window.location.href = "index.html";
      } catch (error) {
        console.error("Login error:", error);
        handleApiError(error, loginErrorMsg);
      }
    });

  // Form submission - Register
  document
    .getElementById("registerForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      registerErrorMsg.textContent = "";

      const fullName = document.getElementById("register-name").value;
      const email = document.getElementById("register-email").value;
      const phone = document.getElementById("register-phone").value;
      const password = document.getElementById("register-password").value;
      const confirmPassword = document.getElementById(
        "register-confirm-password"
      ).value;
      const dob = document.getElementById("register-dob").value;

      // Basic client-side validation
      if (password !== confirmPassword) {
        registerErrorMsg.textContent = "Passwords do not match";
        return;
      }

      if (!fullName || !email || !password) {
        registerErrorMsg.textContent = "Please fill in all required fields";
        return;
      }

      // Show loading indicator
      registerErrorMsg.textContent = "Processing registration...";

      try {
        // Build request payload - use email as both email and username
        const requestPayload = {
          email: email,
          username: email, // Using email as username
          password: password,
          full_name: fullName,
          phone: phone,
        };

        // Log the request to help with debugging
        console.log(
          "Sending registration request to:",
          `${API_BASE_URL}/auth/register`
        );
        console.log(
          "Registration payload:",
          JSON.stringify({ ...requestPayload, password: "****" }, null, 2)
        );

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        });

        console.log("Registration response status:", response.status);
        const responseText = await response.text();
        console.log("Raw registration response:", responseText);

        let data;
        try {
          data = JSON.parse(responseText);
          console.log("Parsed response data:", data);
        } catch (e) {
          console.error("Failed to parse JSON response:", e);
          registerErrorMsg.textContent =
            "Server returned an invalid response. Please try again.";
          return;
        }

        if (!response.ok) {
          registerErrorMsg.textContent =
            data.message || "Registration failed. Please try again.";
          console.error("Registration failed:", data);
          return;
        }

        // Store authentication data
        console.log("Registration successful, storing auth data");
        storeAuthData(data);

        // Update user profile with additional info if user data and token exist
        if (data.user && data.user.id && data.token) {
          try {
            console.log("Updating user profile for user ID:", data.user.id);
            const userProfilePayload = {
              full_name: fullName,
              email: email,
              phone: phone,
              date_of_birth: dob,
            };

            console.log(
              "User profile update payload:",
              JSON.stringify(userProfilePayload, null, 2)
            );

            // Store this data in localStorage - even before API call
            // This ensures data is available to the profile page
            const storedUserData = {
              ...data.user,
              full_name: fullName,
              email: email,
              phone: phone,
              date_of_birth: dob,
            };
            localStorage.setItem("userData", JSON.stringify(storedUserData));
            console.log("Stored profile data in localStorage:", storedUserData);

            const userProfileResponse = await fetch(
              `${API_BASE_URL}/users/profile/simple`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${data.token}`,
                },
                body: JSON.stringify(userProfilePayload),
              }
            );

            console.log(
              "User profile update status:",
              userProfileResponse.status
            );

            if (userProfileResponse.ok) {
              try {
                const profileData = await userProfileResponse.json();
                console.log(
                  "Profile update successful, API returned:",
                  profileData
                );

                // Update localStorage with response data
                if (profileData && profileData.user) {
                  localStorage.setItem(
                    "userData",
                    JSON.stringify(profileData.user)
                  );
                  console.log("Updated localStorage with profile API response");
                }
              } catch (jsonError) {
                console.error("Error parsing profile response:", jsonError);
              }
            } else {
              const profileErrorText = await userProfileResponse.text();
              console.error("Failed to update user profile:", profileErrorText);
              // Continue with redirection even if profile update fails
            }
          } catch (profileError) {
            console.error("Profile update error:", profileError);
            // Continue with redirection even if profile update fails
          }
        }

        // Redirect to index page
        console.log("Registration process complete, redirecting to index.html");
        window.location.href = "index.html";
      } catch (error) {
        console.error("Registration error:", error);
        registerErrorMsg.textContent =
          "Network error. Please check your connection and try again.";
      }
    });

  // Add styles for error messages
  const style = document.createElement("style");
  style.textContent = `
    .error-message {
      color: #d32f2f;
      font-size: 14px;
      margin-top: 10px;
      text-align: center;
    }
  `;
  document.head.appendChild(style);
});
