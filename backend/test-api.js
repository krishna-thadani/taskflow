import { spawn } from 'child_process';

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}/bfhl/tasks`;

// Utility to sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('Starting TaskFlow API tests...');
  
  // Start the server on port 5001
  const server = spawn('node', ['src/server.js'], {
    env: { ...process.env, PORT: PORT.toString(), MONGODB_URI: '' },
    shell: true
  });

  server.stdout.on('data', (data) => {
    // console.log(`[Server]: ${data}`);
  });

  server.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data}`);
  });

  // Wait for server to start (poll /health)
  let healthy = false;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/health`);
      if (res.status === 200) {
        healthy = true;
        break;
      }
    } catch (e) {
      // ignore and retry
    }
    await sleep(500);
  }

  if (!healthy) {
    console.error('Server failed to start on port', PORT);
    server.kill();
    process.exit(1);
  }

  console.log('Server is healthy. Beginning assertions...');

  let exitCode = 0;

  try {
    // Assert 1: GET /bfhl/tasks on empty db should return 200 with []
    const resEmpty = await fetch(BASE_URL);
    assertEqual(resEmpty.status, 200, 'GET empty tasks status');
    const tasksEmpty = await resEmpty.json();
    assertEqual(Array.isArray(tasksEmpty), true, 'GET empty tasks is array');
    assertEqual(tasksEmpty.length, 0, 'GET empty tasks length');

    // Assert 2: GET /bfhl/tasks/stats on empty db should return correct stats structure
    const resStatsEmpty = await fetch(`${BASE_URL}/stats`);
    assertEqual(resStatsEmpty.status, 200, 'GET empty stats status');
    const statsEmpty = await resStatsEmpty.json();
    assertEqual(statsEmpty.totalTasks, 0, 'Empty stats total');
    assertEqual(statsEmpty.pendingTasks, 0, 'Empty stats pending');
    assertEqual(statsEmpty.completedTasks, 0, 'Empty stats completed');
    assertEqual(statsEmpty.averageImportance, 0, 'Empty stats avg importance');
    assertEqual(statsEmpty.overdueTasks, 0, 'Empty stats overdue');

    // Assert 3: POST /bfhl/tasks validation (title too short)
    const resShortTitle = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'ab',
        importance: 3,
        dueDate: new Date(Date.now() + 86400000).toISOString()
      })
    });
    assertEqual(resShortTitle.status, 400, 'POST short title should fail with 400');
    const jsonShort = await resShortTitle.json();
    assertExists(jsonShort.error, 'Short title error message');

    // Assert 4: POST /bfhl/tasks validation (importance out of bounds)
    const resBadImportance = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Valid Title',
        importance: 6,
        dueDate: new Date(Date.now() + 86400000).toISOString()
      })
    });
    assertEqual(resBadImportance.status, 400, 'POST bad importance should fail with 400');
    const jsonImp = await resBadImportance.json();
    assertExists(jsonImp.error, 'Bad importance error message');

    // Assert 5: POST /bfhl/tasks validation (past due date)
    const resPastDate = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Valid Title',
        importance: 3,
        dueDate: new Date(Date.now() - 86400000).toISOString() // yesterday
      })
    });
    assertEqual(resPastDate.status, 400, 'POST past due date should fail with 400');
    const jsonPast = await resPastDate.json();
    assertExists(jsonPast.error, 'Past due date error message');

    // Assert 6: Create Task Alpha (Valid)
    const alphaDueDate = new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000).toISOString(); // 1.5 days from now (floor to 1 day)
    const resAlpha = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Task Alpha',
        description: 'First test task description',
        importance: 3,
        dueDate: alphaDueDate
      })
    });
    assertEqual(resAlpha.status, 201, 'POST Task Alpha success');
    const taskAlpha = await resAlpha.json();
    assertEqual(taskAlpha.title, 'Task Alpha', 'Task Alpha title');
    assertEqual(taskAlpha.importance, 3, 'Task Alpha importance');
    assertEqual(taskAlpha.status, 'pending', 'Task Alpha status default');
    assertExists(taskAlpha.priorityScore, 'Task Alpha priorityScore field present');
    // Score should be: (3 * 10) + (100 / max(1, 1)) = 30 + 100 = 130
    assertEqual(taskAlpha.priorityScore, 130, 'Task Alpha priorityScore calculation');

    // Assert 7: Create Task Beta (High Priority)
    const betaDueDate = new Date(Date.now() + 1.2 * 24 * 60 * 60 * 1000).toISOString(); // 1.2 days from now (floor to 1 day)
    const resBeta = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Task Beta',
        description: 'Second test task description',
        importance: 5,
        dueDate: betaDueDate
      })
    });
    assertEqual(resBeta.status, 201, 'POST Task Beta success');
    const taskBeta = await resBeta.json();
    // Score should be: (5 * 10) + (100 / 1) = 150
    assertEqual(taskBeta.priorityScore, 150, 'Task Beta priorityScore calculation');

    // Assert 8: Create Task Gamma (Low Priority, longer dueDate)
    const gammaDueDate = new Date(Date.now() + 5.5 * 24 * 60 * 60 * 1000).toISOString(); // 5.5 days from now (floor to 5 days)
    const resGamma = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Task Gamma',
        description: 'Third test task description',
        importance: 2,
        dueDate: gammaDueDate
      })
    });
    assertEqual(resGamma.status, 201, 'POST Task Gamma success');
    const taskGamma = await resGamma.json();
    // Score should be: (2 * 10) + (100 / 5) = 20 + 20 = 40
    assertEqual(taskGamma.priorityScore, 40, 'Task Gamma priorityScore calculation');

    // Assert 9: GET /bfhl/tasks should be sorted by priorityScore DESC
    // Order should be: Beta (150), Alpha (130), Gamma (40)
    const resSorted = await fetch(BASE_URL);
    assertEqual(resSorted.status, 200, 'GET sorted tasks status');
    const sortedTasks = await resSorted.json();
    assertEqual(sortedTasks.length, 3, 'GET sorted tasks length');
    assertEqual(sortedTasks[0]._id, taskBeta._id, 'Beta first (highest score)');
    assertEqual(sortedTasks[1]._id, taskAlpha._id, 'Alpha second');
    assertEqual(sortedTasks[2]._id, taskGamma._id, 'Gamma third (lowest score)');

    // Assert 10: Query Filter - status=pending
    const resPending = await fetch(`${BASE_URL}?status=pending`);
    const pendingTasks = await resPending.json();
    assertEqual(pendingTasks.length, 3, 'Filter status=pending length');

    // Assert 11: Query Filter - minImportance=4 (only Beta)
    const resImpFilter = await fetch(`${BASE_URL}?minImportance=4`);
    const impTasks = await resImpFilter.json();
    assertEqual(impTasks.length, 1, 'Filter minImportance=4 length');
    assertEqual(impTasks[0]._id, taskBeta._id, 'Filter minImportance=4 content');

    // Assert 12: PATCH /bfhl/tasks/:id (Mark Task Alpha as complete)
    const resPatchAlpha = await fetch(`${BASE_URL}/${taskAlpha._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    });
    assertEqual(resPatchAlpha.status, 200, 'PATCH Task Alpha success');
    const updatedAlpha = await resPatchAlpha.json();
    assertEqual(updatedAlpha.status, 'completed', 'Task Alpha status updated to completed');
    assertEqual(updatedAlpha.priorityScore, 0, 'Completed task priorityScore must be 0');

    // Assert 13: GET /bfhl/tasks/stats (Analytics aggregation dashboard check)
    const resStats = await fetch(`${BASE_URL}/stats`);
    assertEqual(resStats.status, 200, 'GET stats status');
    const stats = await resStats.json();
    assertEqual(stats.totalTasks, 3, 'Stats totalTasks');
    assertEqual(stats.pendingTasks, 2, 'Stats pendingTasks');
    assertEqual(stats.completedTasks, 1, 'Stats completedTasks');
    assertEqual(stats.overdueTasks, 0, 'Stats overdueTasks');
    assertEqual(stats.averageImportance, 3.33, 'Stats averageImportance');
    assertEqual(stats.tasksByImportance['2'], 1, 'Stats importance distribution 2');
    assertEqual(stats.tasksByImportance['3'], 1, 'Stats importance distribution 3');
    assertEqual(stats.tasksByImportance['5'], 1, 'Stats importance distribution 5');

    // Assert 14: DELETE /bfhl/tasks/:id (Delete Task Gamma)
    const resDeleteGamma = await fetch(`${BASE_URL}/${taskGamma._id}`, { method: 'DELETE' });
    assertEqual(resDeleteGamma.status, 200, 'DELETE Task Gamma status');
    const deleteJson = await resDeleteGamma.json();
    assertExists(deleteJson.message, 'DELETE message present');

    // Assert 15: Fetch all tasks again: should have 2 tasks (Beta and completed Alpha)
    const resFinalList = await fetch(BASE_URL);
    const finalList = await resFinalList.json();
    assertEqual(finalList.length, 2, 'Final list length after delete');
    assertEqual(finalList.some(t => t._id === taskGamma._id), false, 'Gamma is not in final list');

    // Assert 16: Fetch deleted task directly: should return 404 on PATCH or DELETE
    const resFindDeleted = await fetch(`${BASE_URL}/${taskGamma._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Title' })
    });
    assertEqual(resFindDeleted.status, 404, 'PATCH deleted task should return 404');

    // Assert 17: Malformed ID on DELETE should return 400
    const resMalformedId = await fetch(`${BASE_URL}/invalid-id-123`, { method: 'DELETE' });
    assertEqual(resMalformedId.status, 400, 'DELETE malformed ID should return 400');

    console.log('\n=======================================');
    console.log('  ALL API ASSERTIONS PASSED SUCCESSFULLY!');
    console.log('=======================================');

  } catch (error) {
    console.error('\nAssertion failed with error:', error);
    exitCode = 1;
  } finally {
    // Kill server process
    server.kill();
    process.exit(exitCode);
  }
}

// Simple assertion helper functions
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`FAIL: ${message}. Expected: ${expected}, Got: ${actual}`);
  }
  console.log(`PASS: ${message}`);
}

function assertExists(val, message) {
  if (val === undefined || val === null) {
    throw new Error(`FAIL: ${message} is missing.`);
  }
  console.log(`PASS: ${message} exists`);
}

runTests();
