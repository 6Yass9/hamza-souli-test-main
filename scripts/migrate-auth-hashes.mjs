import 'dotenv/config';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LOGIN_CODE_SALT = process.env.LOGIN_CODE_SALT;

// Safety switches
const DRY_RUN = process.argv.includes('--dry-run');
const BCRYPT_ROUNDS = 10;
const PAGE_SIZE = 200;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LOGIN_CODE_SALT) {
  console.error('Missing env vars. Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LOGIN_CODE_SALT');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function shaLoginCode(code) {
  return crypto.createHash('sha256').update(`${code}:${LOGIN_CODE_SALT}`).digest('hex');
}

async function main() {
  console.log(`Starting migration ${DRY_RUN ? '(DRY RUN)' : ''}...`);

  let from = 0;
  let totalUpdated = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;

    const { data: users, error } = await sb
      .from('users')
      .select('id, role, email, password, login_code, password_hash, login_code_hash, login_code_sha')
      .or('password_hash.is.null,login_code_hash.is.null,login_code_sha.is.null')
      .range(from, to);

    if (error) {
      console.error('Fetch error:', error);
      process.exit(1);
    }

    if (!users || users.length === 0) break;

    const updates = [];
    for (const u of users) {
      const patch = { id: u.id };

      if ((u.role === 'admin' || u.role === 'staff') && !u.password_hash) {
        const pw = (u.password ?? '').toString();
        if (pw.length > 0) patch.password_hash = await bcrypt.hash(pw, BCRYPT_ROUNDS);
      }

      if (u.role === 'client') {
        const code = (u.login_code ?? '').toString().trim();
        if (code && /^\d{6}$/.test(code)) {
          if (!u.login_code_sha) patch.login_code_sha = shaLoginCode(code);
          if (!u.login_code_hash) patch.login_code_hash = await bcrypt.hash(code, BCRYPT_ROUNDS);
        }
      }

      const hasChanges =
        Object.prototype.hasOwnProperty.call(patch, 'password_hash') ||
        Object.prototype.hasOwnProperty.call(patch, 'login_code_sha') ||
        Object.prototype.hasOwnProperty.call(patch, 'login_code_hash');

      if (hasChanges) updates.push(patch);
    }

    if (updates.length > 0) {
      if (DRY_RUN) {
        console.log(`Would update ${updates.length} users in range ${from}-${to}`);
      } else {
        for (let i = 0; i < updates.length; i += 50) {
          const batch = updates.slice(i, i + 50);
          for (const row of batch) {
  const id = row.id;
  const patch = { ...row };
  delete patch.id;

  const { error: upErr } = await sb.from('users').update(patch).eq('id', id);
  if (upErr) {
    console.error('Update error:', upErr);
    process.exit(1);
  }
  totalUpdated += 1;
}
console.log(`Updated ${totalUpdated} users so far...`);

          totalUpdated += batch.length;
          console.log(`Updated ${totalUpdated} users so far...`);
        }
      }
    }

    from += PAGE_SIZE;
  }

  console.log(`Done. ${DRY_RUN ? 'No changes were written.' : `Total users updated: ${totalUpdated}`}`);
  console.log('After verifying logins, you can drop plaintext columns: password, login_code');
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
