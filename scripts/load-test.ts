/**
 * Simple Load Test Script
 * Tests API endpoints under concurrent load
 * 
 * Usage: npx tsx scripts/load-test.ts
 */

import 'dotenv/config';

interface TestResult {
  endpoint: string;
  totalRequests: number;
  successCount: number;
  failCount: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
}

async function measureRequest(url: string, options?: RequestInit): Promise<{ success: boolean; time: number }> {
  const start = Date.now();
  try {
    const response = await fetch(url, options);
    const time = Date.now() - start;
    return { success: response.ok || response.status === 401, time }; // 401 is expected for auth failures
  } catch {
    return { success: false, time: Date.now() - start };
  }
}

async function runLoadTest(
  name: string,
  url: string,
  options: RequestInit | undefined,
  concurrency: number,
  totalRequests: number
): Promise<TestResult> {
  console.log(`\n🔄 Testing ${name}...`);
  console.log(`   Concurrency: ${concurrency}, Total: ${totalRequests}`);

  const times: number[] = [];
  let successCount = 0;
  let failCount = 0;

  const startTime = Date.now();

  // Run requests in batches
  for (let i = 0; i < totalRequests; i += concurrency) {
    const batch = Math.min(concurrency, totalRequests - i);
    const promises = Array(batch).fill(null).map(() => measureRequest(url, options));
    const results = await Promise.all(promises);

    for (const result of results) {
      times.push(result.time);
      if (result.success) successCount++;
      else failCount++;
    }

    // Progress indicator
    process.stdout.write(`\r   Progress: ${Math.min(i + batch, totalRequests)}/${totalRequests}`);
  }

  const totalTime = Date.now() - startTime;
  console.log('');

  return {
    endpoint: name,
    totalRequests,
    successCount,
    failCount,
    avgResponseTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
    minResponseTime: Math.min(...times),
    maxResponseTime: Math.max(...times),
    requestsPerSecond: Math.round((totalRequests / totalTime) * 1000 * 10) / 10,
  };
}

async function main() {
  const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              ⚡ Load Testing - Phase 13                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nBase URL: ${BASE_URL}`);

  // Check if server is running
  try {
    await fetch(BASE_URL);
  } catch {
    console.error('\n❌ Server not reachable. Start with: npm run dev\n');
    process.exit(1);
  }

  const results: TestResult[] = [];

  // Test 1: Homepage (static)
  results.push(await runLoadTest(
    'GET / (Homepage)',
    BASE_URL,
    undefined,
    10, // concurrency
    50  // total requests
  ));

  // Test 2: Auth endpoint
  results.push(await runLoadTest(
    'GET /api/auth/me',
    `${BASE_URL}/api/auth/me`,
    { headers: { 'Cookie': 'slq_user_session=test' } },
    10,
    50
  ));

  // Test 3: Login (will fail but tests the endpoint)
  results.push(await runLoadTest(
    'POST /api/auth/login',
    `${BASE_URL}/api/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'loadtest', password: 'test123' })
    },
    5, // Lower concurrency for login (rate limited)
    25
  ));

  // Print results
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                      📊 Results                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  for (const r of results) {
    console.log(`\n📍 ${r.endpoint}`);
    console.log(`   Total Requests:    ${r.totalRequests}`);
    console.log(`   Success/Fail:      ${r.successCount}/${r.failCount}`);
    console.log(`   Avg Response Time: ${r.avgResponseTime}ms`);
    console.log(`   Min/Max Time:      ${r.minResponseTime}ms / ${r.maxResponseTime}ms`);
    console.log(`   Requests/sec:      ${r.requestsPerSecond}`);

    // Status
    const successRate = (r.successCount / r.totalRequests) * 100;
    if (successRate >= 95 && r.avgResponseTime < 500) {
      console.log(`   Status:            ✅ PASS`);
    } else if (successRate >= 80) {
      console.log(`   Status:            ⚠️ WARNING`);
    } else {
      console.log(`   Status:            ❌ FAIL`);
    }
  }

  // Summary
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                         Summary');
  console.log('═══════════════════════════════════════════════════════════════');

  const totalSuccess = results.reduce((a, r) => a + r.successCount, 0);
  const totalFail = results.reduce((a, r) => a + r.failCount, 0);
  const avgRPS = Math.round(results.reduce((a, r) => a + r.requestsPerSecond, 0) / results.length);

  console.log(`   Total Requests:     ${totalSuccess + totalFail}`);
  console.log(`   Success Rate:       ${Math.round((totalSuccess / (totalSuccess + totalFail)) * 100)}%`);
  console.log(`   Average RPS:        ${avgRPS}`);

  if (totalFail === 0) {
    console.log('\n   ✅ All tests passed!');
  } else {
    console.log(`\n   ⚠️ ${totalFail} requests failed`);
  }

  console.log('\n');
}

main().catch(console.error);
