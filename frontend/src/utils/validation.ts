const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns an error message when the email is invalid, otherwise null. */
export function validateEmail(email: string): string | null {
  if (!EMAIL_PATTERN.test(email.trim())) {
    return 'Please enter a valid email address';
  }
  return null;
}

/** Returns an error message when the password is too short, otherwise null. */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  return null;
}
