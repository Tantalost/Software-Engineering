// Run this with: node test_submission.js

// 1. Setup the URL (Make sure your server is running on port 3000)
const API_URL = 'http://127.0.0.1:3000/api/stalls/apply';

// 2. Create a Mock Image (Smallest valid Base64 image)
const MOCK_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

// 3. Create the payload exactly like the mobile app does
const payload = {
  deviceId: "TEST_DEVICE_" + Math.floor(Math.random() * 1000),
  name: "Debug User",
  contact: "0917-123-4567",
  email: "debug@test.com",
  product: "Test Product",
  targetSlot: "A-101",
  floor: "Permanent",
  permitUrl: MOCK_IMAGE,
  validIdUrl: MOCK_IMAGE,
  clearanceUrl: MOCK_IMAGE,
  devicePlatform: "node-script"
};

console.log("🚀 STARTING TEST SUBMISSION...");
console.log(`📡 Target: ${API_URL}`);
console.log(`📦 Payload Size: ~${JSON.stringify(payload).length} bytes`);

const run = async () => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await response.text();

    console.log("---------------------------------------------------");
    if (response.ok) {
        console.log("✅ SUCCESS! Server accepted the data.");
        console.log("📄 Server Response:", text);
    } else {
        console.log(`❌ SERVER REJECTED (Status: ${response.status})`);
        console.log("📄 Error Message:", text);
        
        if (response.status === 413) {
            console.log("💡 HINT: 'Payload Too Large'. You forgot to add limit:'50mb' in server.js");
        }
    }
    console.log("---------------------------------------------------");

  } catch (error) {
    console.error("❌ NETWORK ERROR:", error.cause || error.message);
    console.log("💡 HINT: Is the server running? (node server.js)");
  }
};

run();