import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
const origin = process.env.AUTH_TEST_ORIGIN;
const backend = process.env.AUTH_TEST_BACKEND || 'http://localhost:5080';
const username = process.env.AUTH_TEST_USERNAME;
const password = process.env.AUTH_TEST_PASSWORD;
const sessionName = origin?.endsWith(':3001') ? 'raceday_ops_session' : 'raceday_user_session';
const api = '/api/backend/api/v1';
const request = (path, options={}) => fetch(origin + path, { redirect: 'manual', ...options });
test('live cookie authentication and authorization', { skip: !origin || !username || !password }, async (suite) => {
  let cookie, user;
  await suite.test('anonymous API calls return 401, including forged role cookies', async () => {
    const response = await request(api + '/iam/me', { headers: { Cookie: 'role=Admin; userId=spoof; accessToken=fake' } });
    assert.equal(response.status, 401);
  });
  await suite.test('login rejects cross-site submissions before calling the backend', async () => {
    const response = await request(api + '/iam/auth/login', { method: 'POST', headers: { Origin: 'https://attacker.invalid', 'Content-Type':'application/json' }, body: JSON.stringify({ username, password }) });
    assert.equal(response.status, 403);
  });
  await suite.test('wrong credentials do not establish a session', async () => {
    const response = await request(api + '/iam/auth/login', { method: 'POST', headers: { Origin: origin, 'Content-Type':'application/json' }, body: JSON.stringify({ username, password: 'deliberately-invalid-test-password' }) });
    assert(response.status >= 400);
    assert(!(response.headers.get('set-cookie') || '').includes(sessionName + '='));
  });
  await suite.test('login returns no token and sets an expiring HttpOnly cookie', async () => {
    const response = await request(api + '/iam/auth/login', { method: 'POST', headers: { Origin: origin, 'Content-Type':'application/json' }, body: JSON.stringify({ username, password }) });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert(!('accessToken' in result));
    const setCookie = response.headers.getSetCookie().find(value => value.startsWith(sessionName + '='));
    assert(setCookie?.includes('HttpOnly'));
    assert(setCookie.includes('SameSite=lax'));
    assert(setCookie.includes('Expires='));
    assert(!setCookie.includes('Domain='));
    cookie = setCookie.split(';')[0];
  });
  await suite.test('case-insensitive backend login paths cannot leak the JWT', async () => {
    const response = await request(api + '/IAM/auth/LOGIN', { method: 'POST', headers: { Origin: origin, 'Content-Type':'application/json' }, body: JSON.stringify({ username, password }) });
    assert.equal(response.status,200);
    const result = await response.json();
    assert(!('accessToken' in result));
    assert(response.headers.getSetCookie().some(value => value.startsWith(sessionName + '=') && value.includes('HttpOnly')));
  });
  await suite.test('reload-equivalent /me requests restore the same authenticated user', async () => {
    for (let count=0; count<2; count++) {
      const response = await request(api + '/iam/me', { headers:{ Cookie: cookie } });
      assert.equal(response.status, 200);
      const profile = await response.json();
      if (user) assert.equal(profile.id, user.id);
      user = profile;
    }
  });
  await suite.test('editing role and userId cookies cannot change /me identity', async () => {
    const response = await request(api + '/iam/me', { headers: { Cookie: cookie + '; role=Admin; userId=spoof; user_id=spoof; raceday_role=admin' } });
    const profile = await response.json();
    assert.equal(profile.id, user.id);
    assert.equal(profile.roleName, user.roleName);
  });
  await suite.test('tampered JWT signatures are rejected and cookie is cleared', async () => {
    const original = decodeURIComponent(cookie.slice(cookie.indexOf('=') + 1));
    const parts = original.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url'));
    payload.role = 'Admin';
    payload.sub = 'spoofed-user';
    parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const response = await request(api + '/iam/me', { headers: { Cookie: sessionName + '=' + parts.join('.') } });
    assert.equal(response.status, 401);
    assert(response.headers.get('set-cookie')?.includes('Max-Age=0'));
  });
  await suite.test('privileged API uses server roles rather than browser cookies or headers', async () => {
    const response = await request(api + '/iam/admin/users?page=1&pageSize=1', { headers: { Cookie: cookie + '; role=Admin', 'X-Role': 'Admin' } });
    assert.equal(response.status, user.roleName.toLowerCase() === 'admin' ? 200 : 403);
  });
  await suite.test('backend rejects unauthenticated privileged calls and enforces signed-token roles', async () => {
    const anonymous = await fetch(backend + '/api/v1/iam/admin/users?page=1&pageSize=1', { headers: { Cookie: 'role=Admin; userId=spoof' } });
    assert.equal(anonymous.status, 401);
    const token = decodeURIComponent(cookie.slice(cookie.indexOf('=') + 1));
    const response = await fetch(backend + '/api/v1/iam/admin/users?page=1&pageSize=1', { headers: { Authorization: 'Bearer ' + token, 'X-Role':'Admin', Cookie: 'role=Admin' } });
    assert.equal(response.status, user.roleName.toLowerCase() === 'admin' ? 200 : 403);
  });
  await suite.test('the BFF ignores caller-supplied Authorization without its session cookie', async () => {
    const response = await request(api + '/iam/me', { headers: { Authorization: 'Bearer forged-token', Cookie: 'role=Admin' } });
    assert.equal(response.status, 401);
  });
  await suite.test('server route guards validate sessions before rendering private pages', async () => {
    const response = await request(origin.endsWith(':3001') ? '/approvals' : '/profile', { headers: { Cookie: 'role=Admin; accessToken=forged-token' } });
    assert.equal(response.status, 307);
    assert(new URL(response.headers.get('location'), origin).pathname === '/login');
  });
  await suite.test('properly signed expired JWTs are rejected', { skip: !process.env.AUTH_TEST_SIGNING_KEY }, async () => {
    const token = decodeURIComponent(cookie.slice(cookie.indexOf('=') + 1));
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url'));
    payload.exp = Math.floor(Date.now()/1000) - 3600;
    payload.nbf = payload.exp - 3600;
    parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64url');
    parts[2] = createHmac('sha256',process.env.AUTH_TEST_SIGNING_KEY).update(parts[0]+'.'+parts[1]).digest('base64url');
    const response = await request(api + '/iam/me', { headers: { Cookie: sessionName+'='+parts.join('.') } });
    assert.equal(response.status, 401);
  });
  await suite.test('logout requires the same origin and expires the server cookie', async () => {
    const rejected = await request('/api/auth/logout', { method:'POST', headers: { Origin:'https://attacker.invalid', Cookie:cookie } });
    assert.equal(rejected.status,403);
    const response = await request('/api/auth/logout', { method:'POST', headers:{ Origin:origin, Cookie:cookie } });
    assert.equal(response.status,200);
    assert(response.headers.getSetCookie().some(value=>value.startsWith(sessionName+'=')&&value.includes('Max-Age=0')));
    const after = await request(api+'/iam/me');
    assert.equal(after.status,401);
  });
});
