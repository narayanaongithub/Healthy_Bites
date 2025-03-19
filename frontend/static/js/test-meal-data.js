// Test file to ensure meal data is loaded properly
console.log("test-meal-data.js: Starting test");

// Create a test function
function testMealData() {
  console.log("testMealData: Testing if meal data is available");

  // Check if window.mealData exists
  if (typeof window.mealData !== "undefined") {
    console.log("testMealData: window.mealData is defined");
    console.log(
      "testMealData: Available meal types:",
      Object.keys(window.mealData)
    );
    console.log(
      "testMealData: Breakfast items:",
      window.mealData.breakfast?.length || 0
    );
    console.log(
      "testMealData: Lunch items:",
      window.mealData.lunch?.length || 0
    );
    console.log(
      "testMealData: Dinner items:",
      window.mealData.dinner?.length || 0
    );

    // Check if mealData exists
    if (typeof mealData !== "undefined") {
      console.log("testMealData: mealData variable is also defined");
      console.log(
        "testMealData: mealData === window.mealData:",
        mealData === window.mealData
      );
    } else {
      console.error(
        "testMealData: mealData variable is NOT defined, only window.mealData is available"
      );
    }

    return true;
  } else {
    console.error("testMealData: window.mealData is NOT defined");

    // Check if mealData exists
    if (typeof mealData !== "undefined") {
      console.log("testMealData: But mealData variable is defined");
      console.log("testMealData: Available meal types:", Object.keys(mealData));
      console.log(
        "testMealData: Breakfast items:",
        mealData.breakfast?.length || 0
      );
      console.log("testMealData: Lunch items:", mealData.lunch?.length || 0);
      console.log("testMealData: Dinner items:", mealData.dinner?.length || 0);
      return true;
    } else {
      console.error(
        "testMealData: Neither mealData nor window.mealData is defined - meal data not loaded!"
      );
      return false;
    }
  }
}

// Run the test after a short delay to ensure meal-data.js has loaded
setTimeout(() => {
  console.log("test-meal-data.js: Running test after delay");
  const testResult = testMealData();
  console.log(
    "test-meal-data.js: Test result:",
    testResult ? "SUCCESS" : "FAILURE"
  );
}, 500);

// Export the test function
window.testMealData = testMealData;
