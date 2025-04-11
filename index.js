// Imports
const Memcached = require("./memcached.js");
// Variables
const READS_AND_WRITES = 1_000;
const CHUNK_SIZE = 100;
const TEXT_SIZE = 1_000;
const bigText = "a".repeat(TEXT_SIZE);
const array = Array.from({ length: READS_AND_WRITES }, (_, i) => i);

// =====================================================================================================================
// Functions
// =====================================================================================================================
const waitMs = async (ms) => await new Promise((resolve) => setTimeout(resolve, ms));

const calcAverage = (duration) => {
  return duration / array.length;
};

const calcDuration = (hrtimeStart) => {
  const [seconds, nanoseconds] = process.hrtime(hrtimeStart);
  const executionDurationMs = seconds * 1000 + nanoseconds / 1e6;
  return executionDurationMs;
};

const chunkArray = (input, chunkSize = 200) => {
  if (!input) {
    return input;
  }

  let length = input.length;
  let chunkCount = Math.ceil(length / chunkSize);
  const result = [];
  for (let index = 0; index < chunkCount; index++) {
    result.push(input.slice(index * chunkSize, (index + 1) * chunkSize));
  }
  return result;
};

// =====================================================================================================================
// Main execution
// =====================================================================================================================
(async () => {
  await waitMs(500);

  const chunks = chunkArray(array, CHUNK_SIZE);
  const startScript = process.hrtime();
  let startProcess;

  console.log(`\nOperations: ${READS_AND_WRITES}`);
  console.log(`Pool size: ${Memcached.POOL_SIZE}`);
  console.log(`Chunk size: ${CHUNK_SIZE}`);
  console.log(`Data size: ${TEXT_SIZE}\n`);

  /**
   * Sequence Write
   */
  // startProcess = process.hrtime();
  // for (const i of array) await Memcached.setValue(`${i}`, "value", bigText);
  // const seqWriteDuration = calcDuration(startProcess);

  /**
   * Parallel Write
   */
  startProcess = process.hrtime();
  for (const chunk of chunks) {
    await Promise.all(chunk.map((i) => Memcached.setValue(`${i}`, "value", bigText)));
  }
  const parWriteDuration = calcDuration(startProcess);

  /**
   * Sequence Read
   */
  // startProcess = process.hrtime();
  // for (const i of array) await Memcached.getValue(`${i}`, "value");
  // const seqReadDuration = calcDuration(startProcess);

  /**
   * Parallel Read
   */
  startProcess = process.hrtime();
  for (const chunk of chunks) {
    await Promise.all(chunk.map((i) => Memcached.getValue(`${i}`, "value")));
  }
  const parReadDuration = calcDuration(startProcess);

  /**
   * Show results
   */
  // console.log(`Sequence SET: ${seqWriteDuration.toFixed(2)}ms (${calcAverage(seqWriteDuration).toFixed(2)}ms avg.)`);
  // console.log(`Parallel SET: ${parWriteDuration.toFixed(2)}ms (${calcAverage(parWriteDuration).toFixed(2)}ms avg.)`);
  // console.log(`Sequence GET: ${seqReadDuration.toFixed(2)}ms (${calcAverage(seqReadDuration).toFixed(2)}ms avg.)`);
  // console.log(`Parallel GET: ${parReadDuration.toFixed(2)}ms (${calcAverage(parReadDuration).toFixed(2)}ms avg.)`);

  /**
   * Bye, bye...
   */
  console.log(`Total: ${(calcDuration(startScript) / 1000).toFixed(1)}s\n`);
  process.exit();
})();
