const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const PBKDF2_ITERATIONS = 100000;

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function generateSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function isLocalDev(env) {
  return env.CF_PAGES_BRANCH === 'local';
}

export async function hashPassword(password, saltHex) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(saltHex),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function parseCookies(header) {
  const out = {};
  (header || '')
    .split(';')
    .forEach((part) => {
      const [key, ...rest] = part.trim().split('=');
      if (key) out[key] = rest.join('=');
    });
  return out;
}

export function sessionCookie(token, secure = true) {
  const secureAttr = secure ? 'Secure; ' : '';
  return `__session=${token}; HttpOnly; ${secureAttr}SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

export function clearSessionCookie(secure = true) {
  const secureAttr = secure ? 'Secure; ' : '';
  return `__session=; HttpOnly; ${secureAttr}SameSite=Lax; Path=/; Max-Age=0`;
}

export async function createSession(env, userId) {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(token, userId, expiresAt)
    .run();
  return token;
}

export async function getUserFromRequest(env, request) {
  const cookies = parseCookies(request.headers.get('cookie'));
  const token = cookies.__session;
  if (!token) return null;
  const session = await env.DB.prepare(
    `SELECT s.user_id, s.expires_at, u.email
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ?`
  )
    .bind(token)
    .first();
  if (!session) return null;
  if (session.expires_at < Math.floor(Date.now() / 1000)) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return null;
  }
  return { id: session.user_id, email: session.email };
}

const LOCK_WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 5;

export async function isLockedOut(env, email, ip) {
  const since = Math.floor(Date.now() / 1000) - LOCK_WINDOW_SECONDS;
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM login_attempts
     WHERE attempted_at >= ? AND (email = ? OR ip = ?)`
  )
    .bind(since, email, ip)
    .first();
  return Number(row?.n || 0) >= MAX_ATTEMPTS;
}

export async function recordLoginFailure(env, email, ip) {
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare('INSERT INTO login_attempts (email, ip, attempted_at) VALUES (?, ?, ?)')
    .bind(email, ip, now)
    .run();
  await env.DB.prepare('DELETE FROM login_attempts WHERE attempted_at < ?')
    .bind(now - 24 * 60 * 60)
    .run();
}
