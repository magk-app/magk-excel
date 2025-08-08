#!/usr/bin/env tsx

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Test client for the HK Extract API
 * Demonstrates how to call the API and save Excel files to the file system
 */

const API_BASE = 'http://localhost:3001';

interface ExtractRequest {
  date: string;
  filename?: string;
  headless?: boolean;
}

async function testHKExtractAPI() {
  console.log('🧪 Testing HK Extract API Client...\n');

  try {
    // Test 1: Check API status first
    console.log('1️⃣ Checking API status...');
    await checkAPIStatus();

    // Test 2: Download Excel file with custom filename
    console.log('\n2️⃣ Testing Excel download with custom filename...');
    await downloadExcelFile({
      date: '20250118',
      filename: 'custom_passenger_stats.xlsx',
      headless: true
    });

    // Test 3: Download Excel file with default filename
    console.log('\n3️⃣ Testing Excel download with default filename...');
    await downloadExcelFile({
      date: '20250119'
    });

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure the workflow engine is running:');
      console.log('   cd apps/workflow-engine');
      console.log('   npm run dev');
    }
  }
}

async function checkAPIStatus(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/hk-extract/status`);
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ API Status:', data.status);
    console.log('📋 Service:', data.description);
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
    throw error;
  }
}

async function downloadExcelFile(request: ExtractRequest): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log(`📊 Requesting extraction for date: ${request.date}`);
    if (request.filename) {
      console.log(`📁 Custom filename: ${request.filename}`);
    }

    // Make API request
    const response = await fetch(`${API_BASE}/hk-extract`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(request)
    });

    // Check if request was successful
    if (!response.ok) {
      // Parse error response
      const errorData = await response.json();
      console.error('❌ API Error Response:', errorData);
      throw new Error(`API Error: ${errorData.message} - ${errorData.error}`);
    }

    // Check content type to ensure we got an Excel file
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    // Extract filename from response headers
    const contentDisposition = response.headers.get('content-disposition');
    const extractedFilename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 'download.xlsx';
    
    // Get file metadata from headers
    const fileSize = response.headers.get('content-length');
    const processingTime = response.headers.get('x-processing-time');
    
    console.log(`📥 Downloading file: ${extractedFilename}`);
    console.log(`📊 File size: ${fileSize} bytes`);
    console.log(`⏱️  Server processing time: ${processingTime}`);

    // Convert response to buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create downloads directory if it doesn't exist
    const downloadsDir = './downloads';
    if (!existsSync(downloadsDir)) {
      await mkdir(downloadsDir, { recursive: true });
      console.log(`📁 Created downloads directory: ${downloadsDir}`);
    }

    // Save file to downloads directory
    const filePath = path.join(downloadsDir, extractedFilename);
    await writeFile(filePath, buffer);

    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;

    console.log(`💾 File saved successfully!`);
    console.log(`📂 Location: ${path.resolve(filePath)}`);
    console.log(`🕐 Total time: ${totalTime}s`);
    
    // Verify file was saved correctly
    const fs = await import('fs');
    const stats = fs.statSync(filePath);
    console.log(`✅ File verification: ${stats.size} bytes written`);

  } catch (error) {
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    console.error(`❌ Download failed after ${totalTime}s:`, error);
    throw error;
  }
}

// Helper function to demonstrate error handling
async function testErrorHandling() {
  console.log('\n🔧 Testing error handling...');
  
  try {
    // Test with invalid date format
    await downloadExcelFile({
      date: 'invalid-date'
    });
  } catch (error) {
    console.log('✅ Error handling working correctly:', error.message);
  }
}

// Run comprehensive tests
async function runAllTests() {
  await testHKExtractAPI();
  
  // Uncomment to test error handling
  // await testErrorHandling();
}

// Print usage instructions
function printUsageInstructions() {
  console.log('\n📚 Usage Instructions:');
  console.log('1. Start the workflow engine: npm run dev');
  console.log('2. Run this test client: npx tsx src/routes/test-extract-client.ts');
  console.log('3. Check the ./downloads folder for Excel files');
  console.log('\n🔧 Customization:');
  console.log('- Edit the date in the script (YYYYMMDD format)');
  console.log('- Modify filenames as needed');
  console.log('- Add more test cases to the script');
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(() => {
      printUsageInstructions();
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

export { testHKExtractAPI, downloadExcelFile };