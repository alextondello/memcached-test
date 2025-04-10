// Imports
const Memcached = require("./memcached.js");
// Variables
const READS_AND_WRITES = 1_000;
const TEXT_SIZE = 1_000;
const bigText = "a".repeat(TEXT_SIZE);
const array = Array.from({ length: READS_AND_WRITES }, (_, i) => i);

// Functions
const waitMs = async (ms) => await new Promise((resolve) => setTimeout(resolve, ms));

const calcAverage = (duration) => {
  return duration / array.length;
};

const calcDuration = (hrtimeStart) => {
  const [seconds, nanoseconds] = process.hrtime(hrtimeStart);
  const executionDurationMs = seconds * 1000 + nanoseconds / 1e6;
  return executionDurationMs;
};

// Main execution
(async () => {
  await waitMs(500);

  const startScript = process.hrtime();
  let startProcess;

  console.log(`\nPool size: ${Memcached.POOL_SIZE}`);
  console.log(`Reads/Writes: ${READS_AND_WRITES}`);
  console.log(`Text size: ${TEXT_SIZE}\n`);

  /**
   * Sequence Write
   */
  startProcess = process.hrtime();
  for (const i of array) await Memcached.setValue(`${i}`, "value", bigText);
  const seqWriteDuration = calcDuration(startProcess);

  /**
   * Parallel Write
   */
  startProcess = process.hrtime();
  await Promise.all(array.map((i) => Memcached.setValue(`${i}`, "value", bigText)));
  const parWriteDuration = calcDuration(startProcess);

  /**
   * Sequence Read
   */
  startProcess = process.hrtime();
  for (const i of array) await Memcached.getValue(`${i}`, "value");
  const seqReadDuration = calcDuration(startProcess);

  /**
   * Parallel Read
   */
  startProcess = process.hrtime();
  await Promise.all(array.map((i) => Memcached.getValue(`${i}`, "value")));
  const parReadDuration = calcDuration(startProcess);

  /**
   * Show results
   */
  console.log(`Sequence SET: ${seqWriteDuration.toFixed(2)}ms (${calcAverage(seqWriteDuration).toFixed(2)}ms avg.)`);
  console.log(`Parallel SET: ${parWriteDuration.toFixed(2)}ms (${calcAverage(parWriteDuration).toFixed(2)}ms avg.)`);
  console.log(`Sequence GET: ${seqReadDuration.toFixed(2)}ms (${calcAverage(seqReadDuration).toFixed(2)}ms avg.)`);
  console.log(`Parallel GET: ${parReadDuration.toFixed(2)}ms (${calcAverage(parReadDuration).toFixed(2)}ms avg.)`);

  /**
   * Bye, bye...
   */
  console.log(`Total: ${calcDuration(startScript).toFixed(2)}ms\n`);
  process.exit();
})();
