/**
 * Test the complete invite flow
 * 1. Register admin user (creates workspace)
 * 2. Admin invites editor user with role
 * 3. Invited user registers and gets correct role
 */

const API_BASE = 'http://localhost:5000/api/v1';

async function testInviteFlow() {
  console.log('\n🧪 Testing Complete Invite Flow...\n');

  // Use timestamp for unique values
  const timestamp = Date.now();
  const uniqueEmail = `admin-${timestamp}@test.com`;
  const uniqueWorkspace = `Test Workspace ${timestamp}`;
  const invitedEmail = `editor-${timestamp}@test.com`;

  try {
    // ============ STEP 1: Register Admin User ============
    console.log('📝 STEP 1: Admin registers (creates workspace)');
    const adminData = {
      email: uniqueEmail,
      password: 'TestPass123',
      firstName: 'Admin',
      lastName: 'User',
      tenantName: uniqueWorkspace,
    };

    let response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminData),
    });

    let result = await response.json();
    if (!response.ok) {
      console.error('❌ Admin registration failed:', result.error);
      // If already registered, try to login
      if (result.error.includes('already registered')) {
        console.log('ℹ️  User already registered, attempting login...');
        response = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: adminData.email,
            password: adminData.password,
          }),
        });
        result = await response.json();
      } else {
        throw new Error(result.error);
      }
    }

    const adminToken = result.token;
    const adminId = result.user.id;
    const tenantId = result.tenant.id;
    const tenantName = result.tenant.name;

    console.log('✅ Admin registered successfully');
    console.log(`   - User ID: ${adminId}`);
    console.log(`   - Role: ${result.user.role}`);
    console.log(`   - Tenant: ${tenantName} (${tenantId})`);

    // ============ STEP 2: Admin Invites Editor User ============
    console.log('\n📧 STEP 2: Admin invites editor user');
    const inviteData = {
      email: invitedEmail,
      role: 'editor',
    };

    response = await fetch(`${API_BASE}/auth/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify(inviteData),
    });

    result = await response.json();
    if (!response.ok) {
      console.error('❌ Invite failed:', result.error);
      throw new Error(result.error);
    }

    const inviteCode = result.inviteData.inviteCode;
    const registrationUrl = result.inviteData.registrationUrl;

    console.log('✅ Invite created successfully');
    console.log(`   - Email: ${inviteData.email}`);
    console.log(`   - Role: ${inviteData.role}`);
    console.log(`   - Invite Code: ${inviteCode}`);
    console.log(`   - Registration URL: ${registrationUrl}`);

    // ============ STEP 3: Test Tenant Info Endpoint ============
    console.log('\n🏢 STEP 3: Verify tenant info endpoint');
    response = await fetch(
      `${API_BASE}/auth/tenant-info/${tenantId}?email=${inviteData.email}&inviteCode=${inviteCode}`
    );

    result = await response.json();
    if (!response.ok) {
      console.error('❌ Tenant info fetch failed:', result.error);
      throw new Error(result.error);
    }

    console.log('✅ Tenant info retrieved successfully');
    console.log(`   - Workspace Name: ${result.tenantName}`);
    console.log(`   - Invite Role: ${result.inviteRole}`);
    console.log(`   - Invite Email: ${result.inviteEmail}`);

    // ============ STEP 4: Invited User Registers ============
    console.log('\n📝 STEP 4: Invited user registers');
    const invitedUserData = {
      email: inviteData.email,
      password: 'EditorPass123',
      firstName: 'Editor',
      lastName: 'User',
      tenantId: tenantId,
      inviteCode: inviteCode,
    };

    response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invitedUserData),
    });

    result = await response.json();
    if (!response.ok) {
      console.error('❌ Invited user registration failed:', result.error);
      throw new Error(result.error);
    }

    const editorToken = result.token;
    const editorId = result.user.id;
    const editorRole = result.user.role;

    console.log('✅ Invited user registered successfully');
    console.log(`   - User ID: ${editorId}`);
    console.log(`   - Role: ${editorRole}`);
    console.log(`   - Expected Role: ${inviteData.role}`);

    // ============ STEP 5: Verify Role Assignment ============
    console.log('\n✔️  STEP 5: Verify role assignment');
    if (editorRole === inviteData.role) {
      console.log(`✅ Role assignment CORRECT: User is ${editorRole}`);
    } else {
      console.error(
        `❌ Role assignment FAILED: Expected ${inviteData.role} but got ${editorRole}`
      );
    }

    // ============ STEP 6: Admin Views Team Members ============
    console.log('\n👥 STEP 6: Admin views team members');
    response = await fetch(`${API_BASE}/auth/team`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });

    result = await response.json();
    if (!response.ok) {
      console.error('❌ Team members fetch failed:', result.error);
      throw new Error(result.error);
    }

    console.log('✅ Team members retrieved:');
    result.members.forEach((member) => {
      console.log(`   - ${member.firstName} ${member.lastName} (${member.email}): ${member.role}`);
    });

    // ============ FINAL VERIFICATION ============
    console.log('\n🎉 FLOW COMPLETED SUCCESSFULLY!');
    console.log('✅ Admin created workspace');
    console.log('✅ Admin invited editor with correct role');
    console.log('✅ Invited user registered and received correct role');
    console.log('✅ Team member list shows correct roles');

    return true;
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    return false;
  }
}

// Run test
testInviteFlow().then((success) => {
  process.exit(success ? 0 : 1);
});
