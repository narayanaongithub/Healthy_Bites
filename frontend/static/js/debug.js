// Debug script to test API endpoints

// This function will be run when the script is loaded
(function () {
  console.log("Debug script loaded!");

  // Test the API endpoints directly
  async function testApiEndpoints() {
    // Use direct URL to API Gateway
    const apiBaseUrl = "http://localhost:5000";
    console.log("Testing API endpoints using direct URL:", apiBaseUrl);

    // Test all the endpoints that are failing
    await testEndpoint(
      "Breakfast meals",
      `${apiBaseUrl}/api/products/meal/breakfast`
    );
    await testEndpoint("Lunch meals", `${apiBaseUrl}/api/products/meal/lunch`);
    await testEndpoint(
      "Dinner meals",
      `${apiBaseUrl}/api/products/meal/dinner`
    );
    await testEndpoint("Mock breakfast", `${apiBaseUrl}/api/mock/breakfast`);
  }

  // Function to test a specific endpoint
  async function testEndpoint(name, url) {
    console.log(`Testing ${name} (${url})...`);

    try {
      // Make the request
      const response = await fetch(url);
      console.log(`${name} response status:`, response.status);

      // Check headers
      console.log(
        `${name} Content-Type:`,
        response.headers.get("content-type")
      );

      // Try to get the raw text
      const rawText = await response.text();
      console.log(
        `${name} raw response (first 100 chars):`,
        rawText.substring(0, 100)
      );

      try {
        // Try to parse as JSON
        const json = JSON.parse(rawText);
        console.log(
          `${name} successfully parsed as JSON:`,
          Array.isArray(json) ? `Array with ${json.length} items` : json
        );
      } catch (parseError) {
        console.error(`${name} JSON parse error:`, parseError);
      }
    } catch (fetchError) {
      console.error(`${name} fetch error:`, fetchError);
    }
  }

  // Run the tests
  testApiEndpoints();
})();
