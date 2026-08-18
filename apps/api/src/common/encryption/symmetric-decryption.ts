import crypto from 'crypto';
import { ALG } from './algorythm';

export const symmetricDecrypt = (encrypted: string) => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY is not set');
  }

  const parts = encrypted.split(':');
  const iv = Buffer.from(parts.shift() as string, 'hex');
  const data = Buffer.from(parts.join(':'), 'hex');

  const decipher = crypto.createDecipheriv(ALG, Buffer.from(key, 'hex'), iv);

  let decrypted = decipher.update(data);

  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
};
