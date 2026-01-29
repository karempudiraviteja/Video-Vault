/**
 * Complete system test: Verify all core functionality
 * Tests:
 * 1. Admin can create workspace on first registration
 * 2. Admin can invite users with viewer role  
 * 3. Admin can invite users with editor role
 * 4. Admin can invite users with admin role
 * 5. All invitees receive correct roles
 * 6. Team list shows all members with correct roles
 */

const API_BASE = 'http://localhost:5000/api/v1';

async function runFullSystemTest() {
  console.log(
    '\n╔════════════════════════════════════════════════════════╗'
  );
  console.log(
    '║         🎬 COMPLETE SYSTEM FUNCTIONALITY TEST         ║'
  );
  console.log(
    '╚════════════════════════════════════════════════════════╝\n'
  );

  const timestamp = Date.now();
  const adminEmail = `admin-${timestamp}@test.com`;
  const workspaceName = `System Test Workspace ${timestamp}`;
  const users = {
    viewer: { email: `viewer-${timestamp}@test.com`, password: 'ViewPass123' },
    editor: { email: `editor-${timestamp}@test.com`, password: 'EditPass123' },
    admin: { email: `admin2-${timestamp}@test.com`, password: 'AdminPass123' },
  };

  try {
    // ========== TEST 1: Admin creates workspace ==========
    console.log('TEST 1️⃣  - Admin Creates Workspace');
    console.log('─'.repeat(54));

    let response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: 'AdminPass123',
        firstName: 'Admin',
        lastName: 'Creator',
        tenantName: workspaceName,
      }),
    });

    let result = await response.json();

    if (!response.ok || result.user.role !== 'admin') {
      throw new Error(`Test 1 failed: ${result.error}`);
    }

    const adminToken = result.token;
    const tenantId = result.tenant.id;

    console.log(`✅ Admin created workspace: "${workspaceName}"`);
    console.log(`✅ Admin role: ${result.user.role}`);
    console.log();

    // ========== TEST 2-4: Admin invites users with different roles ==========
    const roleTests = [
      { role: 'viewer', label: 'Viewer (Read-Only)' },
      { role: 'editor', label: 'Editor (Read/Write)' },
      { role: 'admin', label: 'Admin (Full Control)' },
    ];

    const invites = {};

    for (let i = 0; i < roleTests.length; i++) {
      const { role, label } = roleTests[i];
      const testNum = i + 2;

      console.log(`TEST ${testNum}️⃣  - Admin Invites ${label}`);
      console.log('─'.repeat(54));

      const userData = users[role];

      response = await fetch(`${API_BASE}/auth/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          email: userData.email,
          role: role,
        }),
      });

      result = await response.json();

      if (!response.ok) {
        throw new Error(`Test ${testNum} failed: ${result.error}`);
      }

      invites[role] = {
        email: userData.email,
        inviteCode: result.inviteData.inviteCode,
        registrationUrl: result.inviteData.registrationUrl,
      };

      console.log(`✅ ${label} invited: ${userData.email}`);
      console.log(`✅ Invite code: ${result.inviteData.inviteCode}`);
      console.log();
    }

    // ========== TEST 5: Invitees register and get correct roles ==========
    console.log('TEST 5️⃣  - Invitees Register with Correct Roles');
    console.log('─'.repeat(54));

    for (const role of ['viewer', 'editor', 'admin']) {
      const inviteData = invites[role];
      const userData = users[role];

      response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteData.email,
          password: userData.password,
          firstName: role.charAt(0).toUpperCase() + role.slice(1),
          lastName: 'User',
          tenantId: tenantId,
          inviteCode: inviteData.inviteCode,
        }),
      });

      result = await response.json();

      if (!response.ok) {
        throw new Error(`Registration failed for ${role}: ${result.error}`);
      }

      if (result.user.role !== role) {
        throw new Error(
          `Role mismatch for ${role}: expected ${role}, got ${result.user.role}`
        );
      }

      console.log(`✅ ${role} registered with role: ${result.user.role}`);
    }
    console.log();

    // ========== TEST 6: Verify team list ==========
    console.log('TEST 6️⃣  - Verify Team Members List');
    console.log('─'.repeat(54));

    response = await fetch(`${API_BASE}/auth/team`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });

    result = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to fetch team: ${result.error}`);
    }

    // Should have 4 members: 1 admin creator + 3 invited
    if (result.members.length !== 4) {
      throw new Error(
        `Expected 4 team members, got ${result.members.length}`
      );
    }

    // Verify roles
    const roleCount = { admin: 0, editor: 0, viewer: 0 };
    result.members.forEach((member) => {
      roleCount[member.role]++;
      console.log(`  • ${member.firstName} ${member.lastName}`);
      console.log(`    Email: ${member.email}`);
      console.log(`    Role: ${member.role}`);
    });

    console.log();
    console.log(`✅ Admin count: ${roleCount.admin} (expected 2)`);
    console.log(`✅ Editor count: ${roleCount.editor} (expected 1)`);
    console.log(`✅ Viewer count: ${roleCount.viewer} (expected 1)`);

    if (roleCount.admin !== 2 || roleCount.editor !== 1 || roleCount.viewer !== 1) {
      throw new Error('Role distribution mismatch');
    }

    // ========== FINAL RESULTS ==========
    console.log();
    console.log(
      '╔════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║              ✅ ALL TESTS PASSED SUCCESSFULLY!         ║'
    );
    console.log(
      '╠════════════════════════════════════════════════════════╣'
    );
    console.log('║ ✅ TEST 1: Admin creates workspace');
    console.log('║ ✅ TEST 2: Admin invites viewer');
    console.log('║ ✅ TEST 3: Admin invites editor');
    console.log('║ ✅ TEST 4: Admin invites admin');
    console.log('║ ✅ TEST 5: Invitees get correct roles');
    console.log('║ ✅ TEST 6: Team list shows all members');
    console.log(
      '╚════════════════════════════════════════════════════════╝'
    );
    console.log();
    console.log('🎉 System is ready for production!');
    console.log();

    return true;
  } catch (error) {
    console.error(
      '\n╔════════════════════════════════════════════════════════╗'
    );
    console.error(
      '║                ❌ TEST FAILED                          ║'
    );
    console.error(
      '╠════════════════════════════════════════════════════════╣'
    );
    console.error(`║ Error: ${error.message.padEnd(48)}║`);
    console.error(
      '╚════════════════════════════════════════════════════════╝'
    );
    console.error();
    return false;
  }
}

runFullSystemTest().then((success) => {
  process.exit(success ? 0 : 1);
});
