/**
 * Client-Side Input Validators
 * Used for instant form feedback before API submission
 */

export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
};

export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  // Allows international (+), dashes, parens, spaces, and min 7 digits
  const cleaned = phone.replace(/[^0-9]/g, '');
  return cleaned.length >= 7 && cleaned.length <= 15;
};

export const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6;
};

export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'Empty', color: '#94a3b8' };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score, label: 'Weak', color: '#ef4444' };
  if (score <= 3) return { score, label: 'Moderate', color: '#f59e0b' };
  return { score, label: 'Strong', color: '#10b981' };
};

export const isValidUrl = (url) => {
  if (!url) return true; // Optional field in forms
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isValidRegistrationNumber = (regNum) => {
  if (!regNum || typeof regNum !== 'string') return false;
  return regNum.trim().length >= 4;
};

export const isNotEmpty = (val) => {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') return val.trim().length > 0;
  return true;
};
