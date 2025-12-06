import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Encrypt a string value using AES-256-GCM
 */
export function encrypt(text: string, masterKey: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha512');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Format: salt + iv + tag + encrypted
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

/**
 * Decrypt a string value using AES-256-GCM
 */
export function decrypt(encryptedData: string, masterKey: string): string {
  const buffer = Buffer.from(encryptedData, 'base64');

  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + TAG_LENGTH
  );
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha512');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(encrypted) + decipher.final('utf8');
}

/**
 * Get encryption key from environment
 */
export function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is required for encrypted fields'
    );
  }
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
  }
  return key;
}

/**
 * Encrypt a string value with version support for key rotation
 * Format: version:encryptedData
 */
export function encryptWithVersion(
  text: string,
  masterKey: string,
  version: number = 1
): string {
  const encrypted = encrypt(text, masterKey);
  return `${version}:${encrypted}`;
}

/**
 * Decrypt a string value with version support for key rotation
 * Supports both versioned (version:data) and unversioned (legacy) formats
 */
export function decryptWithVersion(
  encryptedData: string,
  masterKeys: Record<number, string>
): string {
  // Check if data has version prefix
  const versionMatch = encryptedData.match(/^(\d+):(.+)$/);

  if (versionMatch) {
    // Versioned format
    const version = parseInt(versionMatch[1], 10);
    const data = versionMatch[2];
    const key = masterKeys[version];

    if (!key) {
      throw new Error(`Encryption key for version ${version} not found`);
    }

    return decrypt(data, key);
  } else {
    // Legacy format (no version) - try with version 1 key
    const key = masterKeys[1] || Object.values(masterKeys)[0];
    if (!key) {
      throw new Error('No encryption key available for decryption');
    }
    return decrypt(encryptedData, key);
  }
}

/**
 * Encrypt an entire JSON object
 * The object is serialized to JSON, then encrypted
 */
export function encryptJSON(data: object, masterKey: string): string {
  const jsonString = JSON.stringify(data);
  return encrypt(jsonString, masterKey);
}

/**
 * Decrypt an encrypted JSON object
 * Returns the parsed object
 */
export function decryptJSON(encryptedData: string, masterKey: string): object {
  const jsonString = decrypt(encryptedData, masterKey);
  return JSON.parse(jsonString);
}

/**
 * Encrypt a JSON object with version support
 */
export function encryptJSONWithVersion(
  data: object,
  masterKey: string,
  version: number = 1
): string {
  const jsonString = JSON.stringify(data);
  return encryptWithVersion(jsonString, masterKey, version);
}

/**
 * Decrypt a versioned JSON object
 */
export function decryptJSONWithVersion(
  encryptedData: string,
  masterKeys: Record<number, string>
): object {
  const jsonString = decryptWithVersion(encryptedData, masterKeys);
  return JSON.parse(jsonString);
}
