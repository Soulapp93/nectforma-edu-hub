/**
 * RLS Integration Tests for Nectforma
 * 
 * Tests Row Level Security policies across all roles:
 * - AdminPrincipal: Full access to own establishment
 * - Admin: Administrative access to own establishment
 * - Formateur: Access to assigned formations/modules
 * - Étudiant: Access to assigned formations (read-only mostly)
 * - Tuteur: Read-only access to assigned students' data
 * 
 * Also tests multi-tenant isolation between establishments.
 * 
 * Usage: node src/__tests__/rls/run-rls-tests.js
 */

const SUPABASE_URL = 'https://dlitdjbmqpsdmhrbluak.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MGMT_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'dlitdjbmqpsdmhrbluak';

if (!SERVICE_ROLE_KEY || !MGMT_TOKEN) {
  console.error('Required env vars: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ACCESS_TOKEN');
  process.exit(1);
}

// ============ HELPERS ============

async function adminQuery(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
    headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` }
  });
  return res.json();
}

async function adminInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  // Supabase returns array with Prefer: return=representation
  return Array.isArray(json) ? json : [json];
}

async function adminDelete(table, filter) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` }
  });
}

async function execSQL(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${MGMT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
  });
  return res.json();
}

async function createAuthUser(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password, email_confirm: true })
  });
  return res.json();
}

async function deleteAuthUser(userId) {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` }
  });
}

async function loginAs(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': SERVICE_ROLE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  return data.access_token;
}

async function queryAs(token, table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
    headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const text = await res.text();
    return { __error: true, status: res.status, message: text };
  }
  return res.json();
}

async function insertAs(token, table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const text = await res.text();
    return { __error: true, status: res.status, message: text };
  }
  return res.json();
}

async function deleteAs(token, table, filter) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${token}` }
  });
  return { status: res.status, ok: res.ok };
}

// ============ TEST FRAMEWORK ============

const results = { passed: 0, failed: 0, errors: [] };

function assert(condition, testName) {
  if (condition) {
    results.passed++;
    console.log(`  ✅ ${testName}`);
  } else {
    results.failed++;
    results.errors.push(testName);
    console.log(`  ❌ ${testName}`);
  }
}

// ============ TEST DATA ============

const TEST_PASSWORD = 'RlsTest2026!';
const testData = {
  // Establishment A
  estA: null, adminA_auth: null, adminA_user: null, adminA_token: null,
  formateurA_auth: null, formateurA_user: null, formateurA_token: null,
  etudiantA_auth: null, etudiantA_user: null, etudiantA_token: null,
  tuteurA_auth: null, tuteurA_user: null, tuteurA_token: null,
  formationA: null, moduleA: null,
  // Establishment B (for multi-tenant isolation)
  estB: null, adminB_auth: null, adminB_user: null, adminB_token: null,
  formationB: null,
};

// ============ SETUP ============

async function setup() {
  console.log('\n🔧 Setting up test data...\n');

  // Create Establishment A
  const estARes = await adminInsert('establishments', {
    name: 'RLS Test School A', type: 'Organisme de formation',
    email: 'rls-test-a@example.com', address: '1 Rue Test A'
  });
  const estA = Array.isArray(estARes) ? estARes[0] : estARes;
  testData.estA = estA;
  console.log(`  Created establishment A: ${estA.id}`);

  // Create Establishment B
  const estBRes = await adminInsert('establishments', {
    name: 'RLS Test School B', type: 'Centre de formation',
    email: 'rls-test-b@example.com', address: '2 Rue Test B'
  });
  const estB = Array.isArray(estBRes) ? estBRes[0] : estBRes;
  testData.estB = estB;
  console.log(`  Created establishment B: ${estB.id}`);

  // Create auth users
  const users = [
    { key: 'adminA', email: 'rls-admin-a@test.com', role: 'AdminPrincipal', est: estA.id },
    { key: 'formateurA', email: 'rls-formateur-a@test.com', role: 'Formateur', est: estA.id },
    { key: 'etudiantA', email: 'rls-etudiant-a@test.com', role: 'Étudiant', est: estA.id },
    { key: 'tuteurA', email: 'rls-tuteur-a@test.com', role: 'Tuteur', est: estA.id },
    { key: 'adminB', email: 'rls-admin-b@test.com', role: 'AdminPrincipal', est: estB.id },
  ];

  for (const u of users) {
    // Create auth user
    const authUser = await createAuthUser(u.email, TEST_PASSWORD);
    testData[`${u.key}_auth`] = authUser;

    // Create app user
    const appUserRes = await adminInsert('users', {
      id: authUser.id, first_name: u.key, last_name: 'Test',
      email: u.email, role: u.role, status: 'Actif',
      establishment_id: u.est, is_activated: true
    });
    const appUser = Array.isArray(appUserRes) ? appUserRes[0] : appUserRes;
    testData[`${u.key}_user`] = appUser;

    // Login
    const token = await loginAs(u.email, TEST_PASSWORD);
    testData[`${u.key}_token`] = token;
    console.log(`  Created & logged in ${u.key} (${u.role}): ${authUser.id}`);
  }

  // Create tutor record for tuteurA
  await adminInsert('tutors', {
    user_id: testData.tuteurA_auth.id,
    establishment_id: estA.id,
    first_name: 'tuteurA', last_name: 'Test',
    email: 'rls-tuteur-a@test.com'
  });

  // Create Formation A (in establishment A)
  const formARes = await adminInsert('formations', {
    title: 'RLS Test Formation A', description: 'Test formation for RLS',
    level: 'Licence', status: 'Actif', establishment_id: estA.id,
    start_date: '2026-01-01', end_date: '2026-12-31', duration: 600
  });
  const formA = formARes[0];
  testData.formationA = formA;
  console.log(`  Created formation A: ${formA?.id} (data: ${JSON.stringify(formA).substring(0, 100)})`);

  // Create Formation B (in establishment B)
  const formBRes = await adminInsert('formations', {
    title: 'RLS Test Formation B', description: 'Test formation for RLS isolation',
    level: 'BTS', status: 'Actif', establishment_id: estB.id,
    start_date: '2026-01-01', end_date: '2026-12-31', duration: 400
  });
  const formB = formBRes[0];
  testData.formationB = formB;
  console.log(`  Created formation B: ${formB?.id} (data: ${JSON.stringify(formB).substring(0, 100)})`);

  // Create module in Formation A
  const modARes = await adminInsert('formation_modules', {
    formation_id: formA.id, title: 'RLS Test Module', description: 'Test',
    duration_hours: 30, establishment_id: estA.id
  });
  const modA = modARes[0];
  testData.moduleA = modA;

  // Assign formateur to module
  await adminInsert('module_instructors', {
    module_id: modA.id, instructor_id: testData.formateurA_auth.id
  });

  // Assign student to formation A
  await adminInsert('user_formation_assignments', {
    user_id: testData.etudiantA_auth.id, formation_id: formA.id
  });

  // Assign tutor to student
  await adminInsert('tutor_student_assignments', {
    tutor_id: testData.tuteurA_auth.id,
    student_id: testData.etudiantA_auth.id,
    is_active: true,
    establishment_id: estA.id
  });

  // Assign admin B's student to formation B
  await adminInsert('user_formation_assignments', {
    user_id: testData.adminB_auth.id, formation_id: formB.id
  });

  console.log('  ✅ Setup complete\n');
}

// ============ CLEANUP ============

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...\n');

  // Delete in reverse dependency order
  const tables = [
    'tutor_student_assignments', 'module_instructors', 'user_formation_assignments',
    'formation_modules', 'formations', 'tutors', 'users'
  ];

  for (const table of tables) {
    if (testData.estA) await adminDelete(table, `establishment_id=eq.${testData.estA.id}`);
    if (testData.estB) await adminDelete(table, `establishment_id=eq.${testData.estB.id}`);
  }

  // Delete user_formation_assignments by user too (might not have establishment_id)
  const userIds = ['adminA', 'formateurA', 'etudiantA', 'tuteurA', 'adminB']
    .map(k => testData[`${k}_auth`]?.id).filter(Boolean);
  for (const uid of userIds) {
    await adminDelete('user_formation_assignments', `user_id=eq.${uid}`);
  }

  // Delete chat_groups
  if (testData.estA) await adminDelete('chat_groups', `establishment_id=eq.${testData.estA.id}`);
  if (testData.estB) await adminDelete('chat_groups', `establishment_id=eq.${testData.estB.id}`);

  // Delete establishments
  if (testData.estA) await adminDelete('establishments', `id=eq.${testData.estA.id}`);
  if (testData.estB) await adminDelete('establishments', `id=eq.${testData.estB.id}`);

  // Delete auth users
  for (const key of ['adminA', 'formateurA', 'etudiantA', 'tuteurA', 'adminB']) {
    if (testData[`${key}_auth`]?.id) await deleteAuthUser(testData[`${key}_auth`].id);
  }

  console.log('  ✅ Cleanup complete\n');
}

// ============ TEST SUITES ============

async function testAdminAccess() {
  console.log('📋 Testing AdminPrincipal access (Establishment A)...');
  const token = testData.adminA_token;

  // Admin can see own establishment users
  const users = await queryAs(token, 'users', '?select=id,role');
  assert(!users.__error && Array.isArray(users), 'Admin can query users');
  assert(!users.__error && users.length > 0, 'Admin sees establishment users');

  // Admin can see formations in own establishment
  const formations = await queryAs(token, 'formations', '?select=id,title');
  assert(!formations.__error && Array.isArray(formations), 'Admin can query formations');
  const hasOwnFormation = formations.some?.(f => f.id === testData.formationA.id);
  assert(hasOwnFormation, 'Admin sees own establishment formation');

  // Admin CANNOT see Formation B (other establishment)
  const hasOtherFormation = formations.some?.(f => f.id === testData.formationB?.id);
  assert(!hasOtherFormation, 'Admin CANNOT see other establishment formation');

  // Admin can see formation modules
  const modules = await queryAs(token, 'formation_modules', '?select=id,title');
  assert(!modules.__error && Array.isArray(modules), 'Admin can query modules');

  // Admin can see attendance sheets (even if empty)
  const sheets = await queryAs(token, 'attendance_sheets', '?select=id');
  assert(!sheets.__error, 'Admin can query attendance_sheets without error');

  // Admin can see schedules
  const schedules = await queryAs(token, 'schedules', '?select=id');
  assert(!schedules.__error, 'Admin can query schedules without error');

  // Admin can see evaluation periods
  const periods = await queryAs(token, 'evaluation_periods', '?select=id');
  assert(!periods.__error, 'Admin can query evaluation_periods without error');

  // Admin can see messages
  const messages = await queryAs(token, 'messages', '?select=id');
  assert(!messages.__error, 'Admin can query messages without error');

  // Admin can see invoices
  const invoices = await queryAs(token, 'invoices', '?select=id');
  assert(!invoices.__error, 'Admin can query invoices without error');
}

async function testFormateurAccess() {
  console.log('\n📋 Testing Formateur access (Establishment A)...');
  const token = testData.formateurA_token;

  // Formateur can see users (students in their formations)
  const users = await queryAs(token, 'users', '?select=id,role');
  assert(!users.__error, 'Formateur can query users without error');

  // Formateur can see assigned formations (via module_instructors)
  const formations = await queryAs(token, 'formations', '?select=id,title');
  assert(!formations.__error, 'Formateur can query formations without error');

  // Formateur CANNOT see Formation B
  const hasOtherFormation = Array.isArray(formations) && formations.some(f => f.id === testData.formationB?.id);
  assert(!hasOtherFormation, 'Formateur CANNOT see other establishment formation');

  // Formateur can see modules
  const modules = await queryAs(token, 'formation_modules', '?select=id');
  assert(!modules.__error, 'Formateur can query formation_modules without error');

  // Formateur can see schedules
  const schedules = await queryAs(token, 'schedules', '?select=id');
  assert(!schedules.__error, 'Formateur can query schedules without error');

  // Formateur can see attendance sheets
  const sheets = await queryAs(token, 'attendance_sheets', '?select=id');
  assert(!sheets.__error, 'Formateur can query attendance_sheets without error');
}

async function testEtudiantAccess() {
  console.log('\n📋 Testing Étudiant access (Establishment A)...');
  const token = testData.etudiantA_token;

  // Student can see own user record
  const users = await queryAs(token, 'users', `?select=id&id=eq.${testData.etudiantA_auth.id}`);
  assert(!users.__error && Array.isArray(users) && users.length > 0, 'Student can see own profile');

  // Student can see assigned formations
  const formations = await queryAs(token, 'formations', '?select=id,title');
  assert(!formations.__error, 'Student can query formations without error');
  const hasOwnFormation = Array.isArray(formations) && formations.some(f => f.id === testData.formationA.id);
  assert(hasOwnFormation, 'Student sees assigned formation');

  // Student CANNOT see Formation B
  const hasOtherFormation = Array.isArray(formations) && formations.some(f => f.id === testData.formationB?.id);
  assert(!hasOtherFormation, 'Student CANNOT see other establishment formation');

  // Student can see own formation assignments
  const assignments = await queryAs(token, 'user_formation_assignments', '?select=id,formation_id');
  assert(!assignments.__error, 'Student can query own assignments without error');

  // Student can see schedules for assigned formation
  const schedules = await queryAs(token, 'schedules', '?select=id');
  assert(!schedules.__error, 'Student can query schedules without error');

  // Student can see attendance sheets for assigned formation
  const sheets = await queryAs(token, 'attendance_sheets', '?select=id');
  assert(!sheets.__error, 'Student can query attendance_sheets without error');

  // Student can see grades
  const grades = await queryAs(token, 'grades', '?select=id');
  assert(!grades.__error, 'Student can query grades without error');

  // Student can see modules
  const modules = await queryAs(token, 'formation_modules', '?select=id');
  assert(!modules.__error, 'Student can query formation_modules without error');
}

async function testTuteurAccess() {
  console.log('\n📋 Testing Tuteur access (Establishment A)...');
  const token = testData.tuteurA_token;

  // Tuteur can see own user record
  const users = await queryAs(token, 'users', `?select=id&id=eq.${testData.tuteurA_auth.id}`);
  assert(!users.__error, 'Tuteur can query users without error');

  // Tuteur can see assigned student's formations
  const formations = await queryAs(token, 'formations', '?select=id,title');
  assert(!formations.__error, 'Tuteur can query formations without error');

  // Tuteur CANNOT see Formation B
  const hasOtherFormation = Array.isArray(formations) && formations.some(f => f.id === testData.formationB?.id);
  assert(!hasOtherFormation, 'Tuteur CANNOT see other establishment formation');

  // Tuteur can see student assignments
  const assignments = await queryAs(token, 'user_formation_assignments', '?select=id');
  assert(!assignments.__error, 'Tuteur can query user_formation_assignments without error');

  // Tuteur can see schedules for student's formations
  const schedules = await queryAs(token, 'schedules', '?select=id');
  assert(!schedules.__error, 'Tuteur can query schedules without error');

  // Tuteur can see attendance sheets
  const sheets = await queryAs(token, 'attendance_sheets', '?select=id');
  assert(!sheets.__error, 'Tuteur can query attendance_sheets without error');
}

async function testMultiTenantIsolation() {
  console.log('\n📋 Testing Multi-Tenant Isolation (A vs B)...');
  const tokenA = testData.adminA_token;
  const tokenB = testData.adminB_token;

  // Admin A cannot see Establishment B data
  const usersA = await queryAs(tokenA, 'users', '?select=id,establishment_id');
  const seesEstB = Array.isArray(usersA) && usersA.some(u => u.establishment_id === testData.estB.id);
  assert(!seesEstB, 'Admin A CANNOT see Establishment B users');

  // Admin B cannot see Establishment A data
  const usersB = await queryAs(tokenB, 'users', '?select=id,establishment_id');
  const seesEstA = Array.isArray(usersB) && usersB.some(u => u.establishment_id === testData.estA.id);
  assert(!seesEstA, 'Admin B CANNOT see Establishment A users');

  // Admin A cannot see Formation B
  const formationsA = await queryAs(tokenA, 'formations', '?select=id');
  const seesFormB = Array.isArray(formationsA) && formationsA.some(f => f.id === testData.formationB.id);
  assert(!seesFormB, 'Admin A CANNOT see Formation B');

  // Admin B cannot see Formation A
  const formationsB = await queryAs(tokenB, 'formations', '?select=id');
  const seesFormA = Array.isArray(formationsB) && formationsB.some(f => f.id === testData.formationA.id);
  assert(!seesFormA, 'Admin B CANNOT see Formation A');

  // Admin A cannot see Modules in Formation B
  const modulesA = await queryAs(tokenA, 'formation_modules', '?select=id,formation_id');
  const seesModB = Array.isArray(modulesA) && modulesA.some(m => m.formation_id === testData.formationB.id);
  assert(!seesModB, 'Admin A CANNOT see Formation B modules');

  // Cross-establishment write test: Admin A cannot insert into B's formation
  const badInsert = await insertAs(tokenA, 'user_formation_assignments', {
    user_id: testData.adminA_auth.id,
    formation_id: testData.formationB.id
  });
  assert(badInsert.__error || (Array.isArray(badInsert) && badInsert.length === 0),
    'Admin A CANNOT assign users to Formation B');
}

async function testNoRecursionErrors() {
  console.log('\n📋 Testing No RLS Recursion Errors (all roles)...');

  const roles = [
    { name: 'AdminPrincipal', token: testData.adminA_token },
    { name: 'Formateur', token: testData.formateurA_token },
    { name: 'Étudiant', token: testData.etudiantA_token },
    { name: 'Tuteur', token: testData.tuteurA_token },
  ];

  const criticalTables = [
    'users', 'formations', 'formation_modules', 'user_formation_assignments',
    'schedules', 'schedule_slots', 'attendance_sheets', 'attendance_signatures',
    'evaluation_periods', 'evaluations', 'grades', 'messages',
    'text_books', 'text_book_entries', 'chat_groups', 'chat_messages',
    'notifications', 'events'
  ];

  for (const role of roles) {
    let errCount = 0;
    for (const table of criticalTables) {
      const res = await queryAs(role.token, table, '?select=id&limit=1');
      if (res.__error && (res.message?.includes('infinite recursion') || res.status === 500)) {
        errCount++;
        console.log(`    ❌ ${role.name} → ${table}: ${res.status} ${res.message?.substring(0, 80)}`);
      }
    }
    assert(errCount === 0, `${role.name}: No recursion/500 on ${criticalTables.length} critical tables`);
  }
}

// ============ MAIN ============

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     Nectforma RLS Integration Tests             ║');
  console.log('╚══════════════════════════════════════════════════╝');

  try {
    await setup();

    await testAdminAccess();
    await testFormateurAccess();
    await testEtudiantAccess();
    await testTuteurAccess();
    await testMultiTenantIsolation();
    await testNoRecursionErrors();

  } catch (err) {
    console.error('\n💥 Unexpected error:', err.message);
    results.failed++;
    results.errors.push(`Unexpected: ${err.message}`);
  } finally {
    await cleanup();
  }

  // Print summary
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log(`║  Results: ${results.passed} passed, ${results.failed} failed`);
  console.log('╚══════════════════════════════════════════════════╝');

  if (results.errors.length > 0) {
    console.log('\nFailed tests:');
    results.errors.forEach(e => console.log(`  ❌ ${e}`));
  }

  // Write JSON report
  const report = {
    timestamp: new Date().toISOString(),
    summary: { passed: results.passed, failed: results.failed, total: results.passed + results.failed },
    failures: results.errors
  };
  const { mkdirSync, writeFileSync } = await import('fs');
  mkdirSync('/app/test_reports', { recursive: true });
  writeFileSync('/app/test_reports/rls_integration.json', JSON.stringify(report, null, 2));
  console.log('\nReport saved to /app/test_reports/rls_integration.json');

  process.exit(results.failed > 0 ? 1 : 0);
}

main();
