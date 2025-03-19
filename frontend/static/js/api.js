// API URL - Using our API Gateway
const API_BASE_URL = "http://localhost:5001/api";

// API Functions for Shipping Addresses
async function fetchShippingAddresses() {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE_URL}/users/shipping-addresses`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const addresses = await response.json();
    console.log("Fetched shipping addresses:", addresses);
    return addresses;
  } catch (error) {
    console.error("Error fetching shipping addresses:", error);
    throw error;
  }
}

async function addShippingAddress(addressData) {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE_URL}/users/shipping-addresses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(addressData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const newAddress = await response.json();
    console.log("Shipping address added successfully:", newAddress);
    return newAddress;
  } catch (error) {
    console.error("Error adding shipping address:", error);
    throw error;
  }
}

async function updateShippingAddress(addressId, addressData) {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${API_BASE_URL}/users/shipping-addresses/${addressId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addressData),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const updatedAddress = await response.json();
    console.log("Shipping address updated successfully:", updatedAddress);
    return updatedAddress;
  } catch (error) {
    console.error("Error updating shipping address:", error);
    throw error;
  }
}

async function deleteShippingAddress(addressId) {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${API_BASE_URL}/users/shipping-addresses/${addressId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("Shipping address deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting shipping address:", error);
    throw error;
  }
}

async function setDefaultShippingAddress(addressId) {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${API_BASE_URL}/users/shipping-addresses/${addressId}/default`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const updatedAddress = await response.json();
    console.log(
      "Default shipping address updated successfully:",
      updatedAddress
    );
    return updatedAddress;
  } catch (error) {
    console.error("Error setting default shipping address:", error);
    throw error;
  }
}

// API Functions for Dietary Preferences
async function fetchDietaryPreferences() {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE_URL}/users/dietary-preferences`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const preferences = await response.json();
    console.log("Fetched dietary preferences:", preferences);
    return preferences;
  } catch (error) {
    console.error("Error fetching dietary preferences:", error);
    throw error;
  }
}

async function updateUserPreferences(preferencesData) {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE_URL}/users/preferences`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferencesData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const updatedPreferences = await response.json();
    console.log("Preferences updated successfully:", updatedPreferences);
    return updatedPreferences;
  } catch (error) {
    console.error("Error updating preferences:", error);
    throw error;
  }
}

// Export the functions
export {
  fetchShippingAddresses,
  addShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
  setDefaultShippingAddress,
  fetchDietaryPreferences,
  updateUserPreferences,
};
