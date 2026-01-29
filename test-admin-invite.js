/**
 * Test admin inviting another admin
 */

const API_BASE = 'http://localhost:5000/api/v1';

async function testAdminInviteAdmin() {
  console.log('\n🧪 Testing Admin Inviting Another Admin...\n');

  const timestamp = Date.now();
  const adminEmail = `admin-${timestamp}@test.com`;
  const workspaceName = `Admin Invite Workspace ${timestamp}`;
  const newAdminEmail = `newadmin-${timestamp}@test.com`;

  try {
    // Register first admin
    console.log('📝 Registering first admin...');
    let response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: 'TestPass123',
        firstName: 'Admin',
        lastName: 'One',
        tenantName: workspaceName,
      }),
    });

    let result = await response.json();
    const adminToken = result.token;
    const tenantId = result.tenant.id;
    console.log(`✅ First admin registered`);

    // Second admin invites another admin
    console.log(`\n📧 Inviting another admin...`);
    response = await fetch(`${API_BASE}/auth/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        email: newAdminEmail,
        role: 'admin',
      }),
    });

    result = await response.json();
    console.log('Invite response:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      throw new Error(`Invite failed: ${result.error}`);
    }

    const inviteCode = result.inviteData.inviteCode;
    console.log(`✅ Admin invited with code: ${inviteCode}`);

    // Verify in tenant info
    response = await fetch(
      `${API_BASE}/auth/tenant-info/${tenantId}?email=${newAdminEmail}&inviteCode=${inviteCode}`
    );
    
    result = await response.json();
    console.log(`✅ Tenant info verified: role=${result.inviteRole}`);

    // Try to register the invited admin
    console.log(`\n📝 Registering invited admin...`);
    response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newAdminEmail,
        password: 'TestPass123',
        firstName: 'Admin',
        lastName: 'Two',
        tenantId: tenantId,
        inviteCode: inviteCode,
      }),
    });

    result = await response.json();
    console.log('Register response:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      throw new Error(`Registration failed: ${result.error}`);
    }

    console.log(`✅ Admin registered with role: ${result.user.role}`);

    console.log('\n🎉 TEST PASSED!');
    return true;
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    return false;
  }
}

testAdminInviteAdmin().then((success) => {
  process.exit(success ? 0 : 1);
});
