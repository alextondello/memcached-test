// Imports
const Memcached = require("./memcached.js");
// Variables
const array = Array.from({ length: 1_000 }, (_, i) => i);
const text = "a".repeat(10);

// Functions
const waitMs = async (ms) => await new Promise((resolve) => setTimeout(resolve, ms));

const calculateAverage = (duration) => {
  return duration / array.length;
};

const calculateDuration = (hrtimeStart) => {
  const [seconds, nanoseconds] = process.hrtime(hrtimeStart);
  const executionDurationMs = seconds * 1000 + nanoseconds / 1e6;
  return executionDurationMs;
};

// Main execution
(async () => {
  await waitMs(500);

  /**
   * Write test
   */
  const startWrite = process.hrtime();
  for (const i of array) {
    await Memcached.setValue(`${i}`, "value", text);
  }
  const writeDuration = calculateDuration(startWrite);

  /**
   * Read test
   */
  const startRead = process.hrtime();
  for (const i of array) {
    await Memcached.getValue(`${i}`, "value");
  }
  const readDuration = calculateDuration(startRead);

  /**
   * Show results
   */
  console.log(`SET: ${writeDuration.toFixed(2)}ms (${calculateAverage(writeDuration).toFixed(2)}ms average)`);
  console.log(`GET: ${readDuration.toFixed(2)}ms (${calculateAverage(readDuration).toFixed(2)}ms average)`);

  /**
   * Bye, bye...
   */
  process.exit();
})();
