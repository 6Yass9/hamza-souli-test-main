import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET!;
const LOGIN_CODE_SALT = process.env.LOGIN_CODE_SALT!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type Body =
  | { type: 'staff'; email: string; password: string }
  | { type: 'client'; code: string };

function shaLoginCode(code: string) {
  // searchable fingerprint (salted)
  return crypto.createHash('sha256').update(`${code}:${LOGIN_CODE_SALT}`).digest('hex');
}

function send(res: VercelResponse, status: number, payload: any) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return send(res, 500, { error: 'Missing Supabase env vars' });
    if (!SUPABASE_JWT_SECRET) return send(res, 500, { error: 'Missing SUPABASE_JWT_SECRET' });
    if (!LOGIN_CODE_SALT) return send(res, 500, { error: 'Missing LOGIN_CODE_SALT' });

    const body = req.body as Body;

    // ---- STAFF/ADMIN LOGIN ----
    if (body.type === 'staff') {
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';

      if (!email || !password) return send(res, 400, { error: 'Missing credentials' });

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .in('role', ['admin', 'staff'])
        .maybeSingle();

      if (error || !user) return send(res, 401, { error: 'Invalid credentials' });
      if (!user.password_hash) return send(res, 401, { error: 'Account not migrated: missing password_hash' });

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return send(res, 401, { error: 'Invalid credentials' });

      const token = jwt.sign(
        {
          sub: String(user.id),
          role: 'authenticated',
          app_role: user.role,
          email: user.email ?? null,
        },
        SUPABASE_JWT_SECRET,
        { expiresIn: '7d' }
      );

      return send(res, 200, { token, user });
    }

    // ---- CLIENT LOGIN (6-DIGIT CODE) ----
    if (body.type === 'client') {
      const code = (body.code || '').trim();
      if (!/^\d{6}$/.test(code)) return send(res, 400, { error: 'Invalid code format' });

      const codeSha = shaLoginCode(code);

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('role', 'client')
        .eq('login_code_sha', codeSha)
        .maybeSingle();

      if (error || !user) return send(res, 401, { error: 'Invalid code' });
      if (!user.login_code_hash) return send(res, 401, { error: 'Account not migrated: missing login_code_hash' });

      const ok = await bcrypt.compare(code, user.login_code_hash);
      if (!ok) return send(res, 401, { error: 'Invalid code' });

      const token = jwt.sign(
        {
          sub: String(user.id),
          role: 'authenticated',
          app_role: user.role,
        },
        SUPABASE_JWT_SECRET,
        { expiresIn: '7d' }
      );

      return send(res, 200, { token, user });
    }

    return send(res, 400, { error: 'Invalid request' });
  } catch (e: any) {
    console.error('api/login error', e);
    return send(res, 500, { error: 'Server error' });
  }
}
