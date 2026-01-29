/**
 * Test complete invite flow with multiple roles (Viewer, Editor, Admin)
 */

const API_BASE = 'http://localhost:5000/api/v1';

async function testMultiRoleInviteFlow() {
  console.log('\n🧪 Testing Multi-Role Invite Flow...\n');

  const timestamp = Date.now();
  const adminEmail = `admin-${timestamp}@test.com`;
  const workspaceName = `MultiRole Workspace ${timestamp}`;

  try {
    // Register admin
    console.log('📝 Registering admin...');
    let response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: 'TestPass123',
        firstName: 'Admin',
        lastName: 'User',
        tenantName: workspaceName,
      }),
    });

    let result = await response.json();
    const adminToken = result.token;
    const tenantId = result.tenant.id;

    console.log(`✅ Admin registered: ${result.user.role}`);

    // Test inviting users with different roles
    const testRoles = ['viewer', 'editor', 'admin'];
    const invites = [];

    for (const role of testRoles) {
      const invitedEmail = `${role}-${timestamp}@test.com`;
      
      console.log(`\n📧 Inviting ${role}...`);
      response = await fetch(`${API_BASE}/auth/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          email: invitedEmail,
          role: role,
        }),
      });

      result = await response.json();
      const inviteCode = result.inviteData?.inviteCode;

      if (!inviteCode) {
        console.log(`⚠️  Failed to invite ${role}: ${result.error || 'Unknown error'}`);
        continue;
      }

      // Verify tenant info endpoint works for this invite
      response = await fetch(
        `${API_BASE}/auth/tenant-info/${tenantId}?email=${invitedEmail}&inviteCode=${inviteCode}`
      );
      const tenantInfo = await response.json();

      if (tenantInfo.inviteRole !== role) {
        throw new Error(`Role mismatch for ${role}: expected ${role}, got ${tenantInfo.inviteRole}`);
      }

      console.log(`✅ ${role.toUpperCase()} invited with code: ${inviteCode}`);
      console.log(`   - Verified in tenant info: ${tenantInfo.inviteRole}`);

      invites.push({
        email: invitedEmail,
        role: role,
        inviteCode: inviteCode,
      });
    }

    // Register all invited users
    console.log('\n📝 Registering invited users...');
    const registeredUsers = [];

    for (const invite of invites) {
      response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: invite.email,
          password: 'TestPass123',
          firstName: invite.role.charAt(0).toUpperCase() + invite.role.slice(1),
          lastName: 'User',
          tenantId: tenantId,
          inviteCode: invite.inviteCode,
        }),
      });

      result = await response.json();

      if (result.user.role !== invite.role) {
        throw new Error(
          `Role mismatch for ${invite.email}: expected ${invite.role}, got ${result.user.role}`
        );
      }

      console.log(`✅ ${invite.role} registered with role: ${result.user.role}`);
      registeredUsers.push({
        name: `${result.user.firstName} ${result.user.lastName}`,
        email: invite.email,
        role: result.user.role,
      });
    }

    // Verify all users in team
    console.log('\n👥 Verifying team members...');
    response = await fetch(`${API_BASE}/auth/team`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });

    result = await response.json();

    // Check all users have correct roles
    const expectedCount = testRoles.length + 1; // +1 for admin
    if (result.members.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} members, got ${result.members.length}`);
    }

    result.members.forEach((member) => {
      console.log(`   - ${member.firstName} ${member.lastName}: ${member.role}`);
    });

    console.log('\n🎉 MULTI-ROLE INVITE TEST PASSED!');
    console.log('✅ Admin can invite users with multiple roles');
    console.log('✅ Invitees are assigned correct roles');
    console.log('✅ All roles (viewer, editor, admin) work correctly');

    return true;
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    return false;
  }
}

testMultiRoleInviteFlow().then((success) => {
  process.exit(success ? 0 : 1);
});
