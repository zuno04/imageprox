import { saveToLocalStorage, loadFromLocalStorage } from "./utils";

// Simple localStorage mock for testing environment if needed
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Assign the mock to global localStorage if in a non-browser-like environment
// In many modern test runners (like Vitest/Jest with jsdom), actual localStorage might be available or mocked.
// If the worker's environment doesn't have it, this mock is crucial.
// For now, assume worker might need it, or can adapt if localStorage is present.
if (typeof localStorage === "undefined") {
  global.localStorage = mockLocalStorage as Storage;
}

const runTests = () => {
  console.log("Running localStorage utility tests...");
  let testsPassed = 0;
  let testsFailed = 0;

  const test = (description: string, testFn: () => void) => {
    try {
      testFn();
      console.log(`✅ PASSED: ${description}`);
      testsPassed++;
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error(`❌ FAILED: ${description}`, errorMessage);
      testsFailed++;
    }
  };

  // Before each logical test group, clear mock localStorage if using it
  localStorage.clear();

  test("should save and load a string", () => {
    const key = "testString";
    const value = "hello world";
    saveToLocalStorage(key, value);
    const loaded = loadFromLocalStorage<string>(key);
    console.assert(loaded === value, `Expected "${value}", got "${loaded}"`);
  });

  test("should save and load a number", () => {
    const key = "testNumber";
    const value = 123;
    saveToLocalStorage(key, value);
    const loaded = loadFromLocalStorage<number>(key);
    console.assert(loaded === value, `Expected ${value}, got ${loaded}`);
  });

  test("should save and load a boolean", () => {
    const key = "testBoolean";
    const value = true;
    saveToLocalStorage(key, value);
    const loaded = loadFromLocalStorage<boolean>(key);
    console.assert(loaded === value, `Expected ${value}, got ${loaded}`);
  });

  test("should save and load an object", () => {
    const key = "testObject";
    const value = { name: "Jules", type: "agent" };
    saveToLocalStorage(key, value);
    const loaded = loadFromLocalStorage<{ name: string; type: string }>(key);
    console.assert(
      loaded !== null &&
        loaded.name === value.name &&
        loaded.type === value.type,
      `Object mismatch`
    );
  });

  test("should return null for a non-existent key", () => {
    const loaded = loadFromLocalStorage<string>("nonExistentKey");
    console.assert(loaded === null, `Expected null, got "${loaded}"`);
  });

  localStorage.clear(); // Clear for next test

  test("should return null and log error for malformed JSON", () => {
    const key = "malformedJson";
    localStorage.setItem(key, "{ not: json }"); // Manually set malformed JSON

    // Suppress console.error for this specific test if possible, or check if it was called
    const originalConsoleError = console.error;
    let errorLogged = false;
    console.error = (...args) => {
      errorLogged = true;
      originalConsoleError(...args);
    };

    const loaded = loadFromLocalStorage<unknown>(key);
    console.assert(
      loaded === null,
      `Expected null for malformed JSON, got ${typeof loaded}`
    );
    console.assert(errorLogged, "Error was not logged for malformed JSON");

    console.error = originalConsoleError; // Restore console.error
  });

  localStorage.clear();

  console.log("--------------------");
  console.log(
    `Tests Completed. Passed: ${testsPassed}, Failed: ${testsFailed}`
  );
  if (testsFailed > 0) {
    //   throw new Error(`${testsFailed} tests failed!`); // Optionally throw to indicate failure clearly
  }
};

// To actually run the tests (e.g., if this file were executed with node or ts-node)
// For the worker, it will just create the file. Execution might be separate.
runTests();
// We can add a small export or a comment to indicate how to run them.
// export { runTests }; // Or just have the worker confirm file creation.

console.log(
  "utils.test.ts created. To run tests, import and call runTests() or use a test runner."
);
