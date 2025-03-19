// Common user menu functionality for all pages
document.addEventListener("DOMContentLoaded", function () {
  // Initialize user dropdown menu
  const userMenuBtn = document.querySelector(".user-menu-btn");
  const userDropdown = document.querySelector(".dropdown-menu");

  if (userMenuBtn && userDropdown) {
    // Toggle dropdown when clicking the button
    userMenuBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      userDropdown.classList.toggle("active");

      // Toggle aria-expanded attribute for accessibility
      const isExpanded = userDropdown.classList.contains("active");
      userMenuBtn.setAttribute("aria-expanded", isExpanded);
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (e) {
      if (
        userDropdown.classList.contains("active") &&
        !userMenuBtn.contains(e.target) &&
        !userDropdown.contains(e.target)
      ) {
        userDropdown.classList.remove("active");
        userMenuBtn.setAttribute("aria-expanded", "false");
      }
    });

    // Close dropdown when pressing escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && userDropdown.classList.contains("active")) {
        userDropdown.classList.remove("active");
        userMenuBtn.setAttribute("aria-expanded", "false");
      }
    });

    // Prevent dropdown from closing when clicking inside it
    userDropdown.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  // Setup logout functionality if logout button exists
  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      // Clear user session data
      localStorage.removeItem("userLoggedIn");
      localStorage.removeItem("userData");
      localStorage.removeItem("accessToken");
      // The redirect is handled by the href attribute in the HTML
    });
  }
});
