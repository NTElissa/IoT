import crypto from 'crypto';
import Patient from '../models/Patient.js';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion when read aloud

const randomCode = () => {
  let code = 'P-';
  for (let i = 0; i < 6; i += 1) {
    code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return code;
};

// Globally unique across the whole platform (not just one hospital) so a
// patient can log in with just their code, no hospital selection needed.
export const generateUniquePatientCode = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = randomCode();
    // eslint-disable-next-line no-await-in-loop
    const existing = await Patient.findOne({ patientCode: code });
    if (!existing) return code;
  }
  throw new Error('Could not generate a unique patient code, please try again');
};

export default generateUniquePatientCode;
