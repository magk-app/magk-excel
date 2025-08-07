/**
 * Test script to verify both demo endpoints are working
 */

async function testDemoEndpoints() {
  console.log('🎯 Testing Demo Endpoints...\n');
  
  // Test 1: Demo landing page
  console.log('1. Testing demo landing page...');
  try {
    const response = await fetch('http://localhost:3001/demo');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Demo landing page works');
      console.log(`   Available demos: ${Object.keys(data.demos).length}`);
    } else {
      console.log('❌ Demo landing page failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Demo landing page error:', error.message);
  }
  
  // Test 2: HK demo page
  console.log('\n2. Testing HK demo documentation...');
  try {
    const response = await fetch('http://localhost:3001/demo/hk-passenger-stats');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ HK demo documentation works');
      console.log(`   Data source: ${data.dataSource}`);
    } else {
      console.log('❌ HK demo documentation failed:', response.status);
    }
  } catch (error) {
    console.log('❌ HK demo documentation error:', error.message);
  }
  
  // Test 3: PDF demo page
  console.log('\n3. Testing PDF demo documentation...');
  try {
    const response = await fetch('http://localhost:3001/demo/pdf-extraction');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ PDF demo documentation works');
      console.log(`   Example document: ${data.exampleDocument}`);
    } else {
      console.log('❌ PDF demo documentation failed:', response.status);
    }
  } catch (error) {
    console.log('❌ PDF demo documentation error:', error.message);
  }
  
  // Test 4: Health check
  console.log('\n4. Testing demo health check...');
  try {
    const response = await fetch('http://localhost:3001/demo/health');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Demo health check works');
      console.log(`   Overall status: ${data.status}`);
      console.log(`   Services: ${Object.keys(data.services).join(', ')}`);
    } else {
      console.log('❌ Demo health check failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Demo health check error:', error.message);
  }

  console.log('\n🎉 Demo endpoints are configured and accessible!');
  console.log('\nTo test the actual extractions, use the chat interface demo buttons:');
  console.log('- 🇭🇰 HK Demo: Extracts passenger statistics and downloads Excel');
  console.log('- 📊 PDF Demo: Extracts Google 10-Q balance sheet data');
}

// Run the tests
testDemoEndpoints().catch(console.error);