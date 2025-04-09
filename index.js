// Imports
const Memcached = require("./memcached.js");
// Variables
const array = Array.from({ length: 1_000 }, (_, i) => i);
const read = [];
const write = [];

// Functions
function calculateAverage(array) {
  if (!array || array.length === 0) return 0;
  const sum = array.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
  return sum / array.length;
}

function calculateDuration(hrtimeStart) {
  const [seconds, nanoseconds] = process.hrtime(hrtimeStart);
  const executionDurationMs = seconds * 1000 + nanoseconds / 1e6;
  return executionDurationMs;
}

// Main execution
(async () => {
  /**
   * Read test
   */
  for (const i of array) {
    const start = process.hrtime();
    await Memcached.setValue(`${i}`, "value", Math.random() * 10);
    read.push(calculateDuration(start));
  }

  /**
   * Write test
   */
  for (const i of array) {
    const start = process.hrtime();
    await Memcached.getValue(`${i}`, "value");
    write.push(calculateDuration(start));
  }

  /**
   * Calculate averages
   */
  const readAverage = calculateAverage(read);
  const writeAverage = calculateAverage(write);
  console.log(` Average read: ${readAverage.toFixed(4)}ms`);
  console.log(`Average write: ${writeAverage.toFixed(4)}ms`);

  /**
   * Bye, bye...
   */
  process.exit();
})();
