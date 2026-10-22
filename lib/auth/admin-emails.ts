import 'server-only';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function configuredAdminEmails(value = process.env.ADMIN_EMAILS) {
  return new Set(
    (value ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter((email) => emailPattern.test(email)),
  );
}

export function hasValidAdminEmailList(value = process.env.ADMIN_EMAILS) {
  if (!value?.trim()) return true;
  const emails = value.split(',').map((email) => email.trim().toLowerCase());
  return (
    emails.every((email) => emailPattern.test(email)) && new Set(emails).size === emails.length
  );
}

export function isConfiguredAdminEmail(email: string) {
  return configuredAdminEmails().has(email.trim().toLowerCase());
}
