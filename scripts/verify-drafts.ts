async function runVerification() {
  const baseUrl = 'http://localhost:3000'
  console.log('--- STARTING DRAFTS VERIFICATION SUITE ---')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`)
      passed++
    } else {
      console.error(`❌ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`)
      failed++
    }
  }

  // 1. Verify Homepage footer contains Drafts link
  try {
    const homeRes = await fetch(`${baseUrl}/`)
    const homeHtml = await homeRes.text()
    assert(
      homeRes.status === 200 && homeHtml.includes('/drafts') && homeHtml.includes('Drafts'),
      'Homepage footer includes Drafts link',
      `Status: ${homeRes.status}`
    )
  } catch (err) {
    assert(false, 'Homepage footer includes Drafts link', String(err))
  }

  // 2. Verify /drafts page renders publicly
  try {
    const draftsRes = await fetch(`${baseUrl}/drafts`)
    const draftsHtml = await draftsRes.text()
    assert(
      draftsRes.status === 200,
      'GET /drafts responds with HTTP 200'
    )
    assert(
      draftsHtml.includes('rathin') && draftsHtml.includes('drafts'),
      '/drafts page contains branding'
    )
    assert(
      draftsHtml.includes('✦') || draftsHtml.includes('Draft Separator'),
      '/drafts page renders custom separators'
    )
  } catch (err) {
    assert(false, 'Public /drafts page rendering', String(err))
  }

  // 3. Verify /api/drafts public GET
  try {
    const apiRes = await fetch(`${baseUrl}/api/drafts`)
    const apiData = await apiRes.json()
    assert(
      apiRes.status === 200 && typeof apiData.content === 'string' && apiData.content.length > 50,
      'GET /api/drafts returns initial markdown stream'
    )
  } catch (err) {
    assert(false, 'GET /api/drafts', String(err))
  }

  // 4. Test wrong password
  try {
    const wrongAuthRes = await fetch(`${baseUrl}/api/drafts/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong-password' }),
    })
    assert(
      wrongAuthRes.status === 401,
      'POST /api/drafts/auth with wrong password returns 401 Unauthorized'
    )
  } catch (err) {
    assert(false, 'Wrong password test', String(err))
  }

  // 5. Test correct password & cookie retrieval
  let sessionCookie = ''
  try {
    const authRes = await fetch(`${baseUrl}/api/drafts/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'rathin-drafts' }),
    })
    const authData = await authRes.json()
    const setCookie = authRes.headers.get('set-cookie') || ''
    if (setCookie.includes('drafts_session')) {
      sessionCookie = setCookie.split(';')[0]
    }

    assert(
      authRes.status === 200 && authData.ok === true && sessionCookie.length > 0,
      'POST /api/drafts/auth with correct password returns 200 OK and sets session cookie'
    )
  } catch (err) {
    assert(false, 'Correct password authentication', String(err))
  }

  // 6. Test unauthorized PUT /api/drafts
  try {
    const unauthPut = await fetch(`${baseUrl}/api/drafts`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'hacked content' }),
    })
    assert(
      unauthPut.status === 401,
      'PUT /api/drafts without session cookie returns 401 Unauthorized'
    )
  } catch (err) {
    assert(false, 'Unauthorized PUT protection', String(err))
  }

  // 7. Test authorized PUT /api/drafts
  const testEditContent = `# Working Drafts & Field Notes\n\n*Verified live edit stream via password-unlocked author session.*\n\n---\n\n## 01. The Counter-Intuitive Architecture of Modern Populism\n*Date: September 2026 • Category: Political Economy*\n\nUpdated draft text with verification timestamp: ${new Date().toISOString()}\n\n---\n\n## 02. Technocracy and Algorithmic Due Process\n*Date: August 2026 • Category: Legal Theory*\n\nVerified second section content.\n`

  try {
    const authPut = await fetch(`${baseUrl}/api/drafts`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ content: testEditContent }),
    })
    const putData = await authPut.json()
    assert(
      authPut.status === 200 && putData.ok === true,
      'PUT /api/drafts with session cookie saves markdown content'
    )
  } catch (err) {
    assert(false, 'Authorized PUT update', String(err))
  }

  // 8. Verify updated content is immediately reflected in GET /api/drafts and GET /drafts
  try {
    const verifyGet = await fetch(`${baseUrl}/api/drafts`)
    const verifyData = await verifyGet.json()
    assert(
      verifyData.content.includes('Verified live edit stream'),
      'GET /api/drafts confirms persistence of updated content'
    )

    const verifyPage = await fetch(`${baseUrl}/drafts`)
    const verifyHtml = await verifyPage.text()
    assert(
      verifyHtml.includes('Verified live edit stream'),
      'GET /drafts renders updated markdown content in HTML'
    )
  } catch (err) {
    assert(false, 'Updated content rendering verification', String(err))
  }

  // 9. Test logout
  try {
    const logoutRes = await fetch(`${baseUrl}/api/drafts/auth`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    })
    assert(
      logoutRes.status === 200,
      'DELETE /api/drafts/auth logs out successfully'
    )
  } catch (err) {
    assert(false, 'Logout verification', String(err))
  }

  console.log(`\n--- VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED ---`)
  if (failed > 0) {
    process.exit(1)
  }
}

runVerification()
