const ERROR_MAP: Record<string, string> = {
  UserNotFoundException: 'No account found with this email.',
  NotAuthorizedException: 'Incorrect password. Please try again.',
  UsernameExistsException: 'An account with this email already exists.',
  InvalidPasswordException: 'Password does not meet requirements. Must include uppercase, lowercase, number, and symbol.',
  CodeMismatchException: 'Invalid verification code. Please try again.',
  ExpiredCodeException: 'Verification code has expired. Please request a new one.',
  LimitExceededException: 'Too many attempts. Please try again later.',
}

export function mapAuthError(error: unknown): string {
  const err = error as { name?: string, message?: string }
  if (err.name && err.name in ERROR_MAP)
    return ERROR_MAP[err.name]!
  if (err.message?.includes('Username/client id combination not found'))
    return ERROR_MAP.UserNotFoundException!
  return err.message || 'An error occurred. Please try again.'
}
