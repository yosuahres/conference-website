import crypto from 'crypto';
import { ALG } from './algorythm';

export const symmetricEncrypt = (value: string) => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY is not set');
  }

  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(ALG, Buffer.from(key, 'hex'), iv);

  let encrypted = cipher.update(value);

  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
};
