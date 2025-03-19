// Check if user is logged in
function isUserLoggedIn() {
  // In a real application, this would check for a valid session token, cookie, or localStorage item
  // For demonstration purposes, we'll use localStorage
  return localStorage.getItem("userLoggedIn") === "true";
}

// Handle Order Now button click
document.getElementById("orderNowBtn").addEventListener("click", function (e) {
  e.preventDefault();
  if (isUserLoggedIn()) {
    // If logged in, redirect to index.html (home page)
    window.location.href = "index.html";
  } else {
    // If not logged in, redirect to auth.html (login/register page)
    window.location.href = "auth.html";
  }
});

// Handle Get Started button click
document
  .getElementById("getStartedBtn")
  .addEventListener("click", function (e) {
    e.preventDefault();
    if (isUserLoggedIn()) {
      // If logged in, redirect to index.html (home page)
      window.location.href = "index.html";
    } else {
      // If not logged in, redirect to auth.html (login/register page)
      window.location.href = "auth.html";
    }
  });

document.addEventListener("DOMContentLoaded", function () {
  // Check if user is logged in
  const isLoggedIn = localStorage.getItem("userLoggedIn") === "true";

  // Update login button
  const loginBtn = document.querySelector(".login-btn");
  if (loginBtn) {
    if (isLoggedIn) {
      loginBtn.href = "profile.html";
      loginBtn.textContent = "My Profile";
    } else {
      loginBtn.href = "auth.html";
      loginBtn.textContent = "Login";
    }
  }

  // Update register button if user is logged in
  const registerBtn = document.querySelector(".register-btn");
  if (registerBtn) {
    if (isLoggedIn) {
      registerBtn.style.display = "none"; // Hide register button when logged in
    } else {
      registerBtn.href = "auth.html";
      registerBtn.textContent = "Register";
      // Ensure both buttons have the same styling
      if (loginBtn) {
        loginBtn.style.backgroundColor =
          registerBtn.style.backgroundColor || "#f5efd5";
        loginBtn.style.color = registerBtn.style.color || "#0c3c30";
      }
    }
  }

  // Update get started button
  const getStartedBtn = document.querySelector(".get-started-btn");
  if (getStartedBtn) {
    getStartedBtn.href = isLoggedIn ? "products.html" : "auth.html";
    getStartedBtn.textContent = isLoggedIn ? "Browse Meals" : "Get Started";
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Offset for navbar
          behavior: "smooth",
        });
      }
    });
  });
});
