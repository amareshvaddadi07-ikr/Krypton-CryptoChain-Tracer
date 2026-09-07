/**
 * ladder.cron.js
 * 
 * Statutory Auto-Escalation Cron Job for AP Police Cyber Crime Investigation
 * 
 * Runs EVERY 1 MINUTE.
 * Executes STRICT SQL Query:
 * SELECT * FROM escalation_cases WHERE next_escalation_at <= NOW() AND vasp_reply_received = false AND status = 'PENDING'
 * 
 * ONLY matching rows escalate. Does NOT fetch all cases.
 * Handles persistent DB timers and reload on server restart.
 */

import {
  escalateCase,
  reloadPendingJobsFromDb,
  getCaseStatus,
} from './ladder.service.js';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve(process.cwd(), 'data', 'escalation_db.json');

// Mutex lock to prevent overlapping cron ticks
let isCronTickRunning = false;
let cronIntervalHandle = null;

/**
 * Executes the exact database query:
 * SELECT * FROM escalation_cases 
 * WHERE next_escalation_at <= NOW() 
 *   AND vasp_reply_received = false 
 *   AND status = 'PENDING'
 */
function fetchMaturedEscalationCases() {
  if (!fs.existsSync(DB_FILE)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    const cases = data.escalation_cases || [];

    const now = new Date();

    // STRICT FILTER: Equivalent to
    // WHERE next_escalation_at <= NOW() AND vasp_reply_received = false AND status = 'PENDING'
    // Excludes any rows where next_escalation_at is NULL or in the future
    const matured = cases.filter((row) => {
      if (!row.next_escalation_at) return false;
      if (row.vasp_reply_received !== false) return false;
      if (row.status !== 'PENDING') return false;

      const nextTime = new Date(row.next_escalation_at).getTime();
      return nextTime <= now.getTime();
    });

    return matured;
  } catch (err) {
    console.error('[CRON ERROR] Failed to query escalation_cases:', err.message);
    return [];
  }
}

/**
 * Core Cron Tick function - runs every 1 minute
 */
export async function runEscalationCronTick() {
  if (isCronTickRunning) {
    console.log('[CRON] Previous escalation tick still executing. Skipping concurrent run.');
    return;
  }

  isCronTickRunning = true;
  const tickStartTime = new Date();
  console.log(`\n------------------------------------------------------------`);
  console.log(`[CRON TICK] Statutory Escalation Check at ${tickStartTime.toISOString()}`);
  console.log(`[CRON QUERY] SELECT * FROM escalation_cases WHERE next_escalation_at <= NOW() AND vasp_reply_received = false AND status = 'PENDING'`);

  try {
    // 1. Fetch ONLY rows that have matured
    const maturedCases = fetchMaturedEscalationCases();

    if (maturedCases.length === 0) {
      console.log(`[CRON TICK] No matured cases found. All cases are waiting for statutory intervals or already frozen.`);
      return { evaluated_count: 0, escalated_count: 0 };
    }

    console.log(`[CRON TICK] Found ${maturedCases.length} matured case(s) ready for escalation.`);

    let escalatedCount = 0;

    for (const item of maturedCases) {
      // 2. CRITICAL PRE-CHECK: Check if VASP reply was received in the interim
      // Refresh state from DB
      const currentStatus = getCaseStatus(item.id);

      if (!currentStatus) {
        console.warn(`[CRON SKIP] Case ${item.id} not found.`);
        continue;
      }

      if (currentStatus.vasp_reply_received === true) {
        console.log(`[CRON STOP] Case ${item.id} (${item.fir_number}) marked vasp_reply_received = true. Skipping escalation.`);
        continue;
      }

      if (currentStatus.status !== 'PENDING') {
        console.log(`[CRON SKIP] Case ${item.id} is status='${currentStatus.status}'. Skipping.`);
        continue;
      }

      // Double-check timing: next_escalation_at MUST be <= NOW()
      const now = Date.now();
      const targetTime = new Date(currentStatus.next_escalation_at).getTime();

      if (targetTime > now) {
        console.log(`[CRON WAIT] Case ${item.id} has not yet reached next_escalation_at (${currentStatus.next_escalation_at}). Wait: ${Math.round((targetTime - now) / 1000)}s.`);
        continue;
      }

      console.log(`[CRON ESCALATING] Case ${item.id} (Stage ${currentStatus.current_stage} ➔ Stage ${currentStatus.current_stage + 1})`);
      
      // 3. Execute escalation:
      // a) Send email of NEXT stage
      // b) UPDATE current_stage = current_stage + 1
      // c) UPDATE next_escalation_at = NOW() + INTERVAL
      // d) INSERT into escalation_logs
      const result = await escalateCase(item.id);

      if (result.success) {
        escalatedCount++;
        console.log(`[CRON VERIFIED] Case ${item.id} successfully escalated to Stage ${result.current_stage}. Next wait until: ${result.next_escalation_at}`);
      } else {
        console.warn(`[CRON RESULT] Case ${item.id} outcome:`, result);
      }
    }

    console.log(`[CRON SUMMARY] Processed ${maturedCases.length} case(s). Escalated: ${escalatedCount}.`);
    return { evaluated_count: maturedCases.length, escalated_count: escalatedCount };
  } catch (error) {
    console.error('[CRON FATAL] Error during escalation tick:', error);
  } finally {
    isCronTickRunning = false;
  }
}

/**
 * Starts the 1-Minute Cron Engine
 * Reloads pending jobs from DB on server startup so no jobs are lost.
 */
export async function startLadderCronEngine() {
  console.log('============================================================');
  console.log(' AP POLICE STATUTORY ESCALATION CRON ENGINE (60s CYCLE)');
  console.log('============================================================');

  // STEP 1: Persistent DB Recovery on Server Startup
  console.log('[STARTUP] Reloading pending jobs from persistent DB...');
  await reloadPendingJobsFromDb();

  // STEP 2: Execute immediate check on startup
  console.log('[STARTUP] Running initial statutory database verification...');
  await runEscalationCronTick();

  // STEP 3: Setup 1-Minute Cron Interval (60,000 ms)
  if (cronIntervalHandle) {
    clearInterval(cronIntervalHandle);
  }

  cronIntervalHandle = setInterval(async () => {
    await runEscalationCronTick();
  }, 60 * 1000);

  console.log('[CRON STARTED] Scheduled 1-minute persistent statutory tick.');
}

export function stopLadderCronEngine() {
  if (cronIntervalHandle) {
    clearInterval(cronIntervalHandle);
    cronIntervalHandle = null;
    console.log('[CRON STOPPED] Ladder cron engine paused.');
  }
}

// Auto-run when executed directly via node ladder.cron.js
if (import.meta.url === `file://${process.argv[1]}`) {
  startLadderCronEngine();
}
