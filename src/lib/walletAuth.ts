import { generateMnemonic, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

export function createRecoveryPhrase(): string[] {
  return generateMnemonic(wordlist, 128).split(' ');
}

export async function recoveryVerifier(words: string[]): Promise<string> {
  const phrase=words.join(' ').trim().toLowerCase().replace(/\s+/g,' ');
  if(!validateMnemonic(phrase,wordlist)) throw new Error('Invalid recovery phrase');
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(phrase));
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

export function isValidRecoveryPhrase(words:string[]):boolean{
  return validateMnemonic(words.join(' ').trim().toLowerCase().replace(/\s+/g,' '),wordlist);
}
