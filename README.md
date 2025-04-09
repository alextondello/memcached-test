# memcached-test

This script evaluates the performance of connection pools in the memcache-plus npm package.

# Instructions

1. Start memcached on Docker:

- If you haven’t set up the container yet, run:
  `docker run -d --name memcached-local -p 11211:11211 memcached:latest`
- If the container is already set up, start it with:
  `docker container start memcached-local`

2. Install npm packages:

- Run: `npm install`

3. Run the test script:

- Execute the script to display the average timings for read and write operations on your memcached instance:
  `node index.js`

4. Adjust the pool size:

- Edit the `POOL_SIZE` setting in _memcached.js_.

5. Re-run the script:

- Check the performance again to see if adjusting the pool size improves the timing results.
- Want to see debug logs for the new implementation? Just run:
  `DEBUG=memcache-plus:connection-pool node index.js`
