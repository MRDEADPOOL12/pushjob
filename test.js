const { pushdata } = require('./index.js');

async function runLocalTest() {
  try {
    // You can provide event and context parameters if needed
    const event = {}; // You can provide any necessary event data
    const context = {}; // You can provide any necessary context data

    // Call the leaderboardCronJob function
    await pushdata(event, context);

    console.log('Test completed successfully.');
  } catch (error) {
    console.error('Error occurred during local test:', error);
  }
}

// Run the local test function
runLocalTest();
