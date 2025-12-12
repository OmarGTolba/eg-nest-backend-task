export const EMAIL_EVENTS = {
  PASSWORD_RESET: 'email.password-reset',
  EMAIL_VERIFICATION: 'email.verification',
  WELCOME: 'email.welcome',
} as const;

export type EmailEventType = typeof EMAIL_EVENTS[keyof typeof EMAIL_EVENTS];