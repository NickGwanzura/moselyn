import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';
import { ensureDatabase, getPool, hasDatabase } from './backend-db';

export type AuthorizeNetMode = 'sandbox' | 'production';
export type AuthorizeNetConfig = { apiLoginId: string; transactionKey: string; signatureKey: string; mode: AuthorizeNetMode; source: 'admin' | 'environment' | 'none' };

function encryptionKey(): Buffer {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('Admin session secret is not configured for payment settings encryption.');
  return createHash('sha256').update('fha-authorize-net-settings-v1:').update(secret).digest();
}

function encrypt(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ciphertext.toString('base64url')}`;
}

function decrypt(value: string | null): string {
  if (!value) return '';
  const [ivPart, tagPart, ciphertextPart] = value.split('.');
  if (!ivPart || !tagPart || !ciphertextPart) throw new Error('Stored payment settings could not be decrypted.');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivPart, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextPart, 'base64url')), decipher.final()]).toString('utf8');
}

export async function getAuthorizeNetConfig(): Promise<AuthorizeNetConfig> {
  const env = {
    apiLoginId: process.env.AUTHORIZE_NET_API_LOGIN_ID?.trim() ?? '',
    transactionKey: process.env.AUTHORIZE_NET_TRANSACTION_KEY?.trim() ?? '',
    signatureKey: process.env.AUTHORIZE_NET_SIGNATURE_KEY?.trim() ?? '',
    mode: process.env.AUTHORIZE_NET_MODE === 'production' ? 'production' as const : 'sandbox' as const,
  };
  if (hasDatabase()) {
    await ensureDatabase();
    const result = await getPool().query<{ api_login_id_ciphertext: string; transaction_key_ciphertext: string; signature_key_ciphertext: string | null; mode: string }>('SELECT api_login_id_ciphertext, transaction_key_ciphertext, signature_key_ciphertext, mode FROM authorize_net_settings WHERE id = 1');
    const row = result.rows[0];
    if (row) return { apiLoginId: decrypt(row.api_login_id_ciphertext), transactionKey: decrypt(row.transaction_key_ciphertext), signatureKey: decrypt(row.signature_key_ciphertext), mode: row.mode === 'production' ? 'production' : 'sandbox', source: 'admin' };
  }
  return { ...env, source: env.apiLoginId && env.transactionKey ? 'environment' : 'none' };
}

export async function saveAuthorizeNetConfig(input: { apiLoginId: string; transactionKey: string; signatureKey: string; mode: AuthorizeNetMode; updatedBy: string }): Promise<void> {
  await ensureDatabase();
  await getPool().query(
    `INSERT INTO authorize_net_settings (id, api_login_id_ciphertext, transaction_key_ciphertext, signature_key_ciphertext, mode, updated_by)
     VALUES (1, $1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET api_login_id_ciphertext = EXCLUDED.api_login_id_ciphertext,
       transaction_key_ciphertext = EXCLUDED.transaction_key_ciphertext,
       signature_key_ciphertext = EXCLUDED.signature_key_ciphertext, mode = EXCLUDED.mode,
       updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
    [encrypt(input.apiLoginId), encrypt(input.transactionKey), input.signatureKey ? encrypt(input.signatureKey) : null, input.mode, input.updatedBy],
  );
}

export async function getAuthorizeNetSettingsSummary(): Promise<{ configured: boolean; signatureConfigured: boolean; mode: AuthorizeNetMode; source: 'admin' | 'environment' | 'none' }> {
  const config = await getAuthorizeNetConfig();
  return { configured: Boolean(config.apiLoginId && config.transactionKey), signatureConfigured: Boolean(config.signatureKey), mode: config.mode, source: config.source };
}
