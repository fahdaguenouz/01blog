export function toUserMessage(err: any, fallback = 'Something went wrong. Please try again.') {
  const status = err?.status;
  const serverMsg = err?.error?.message; // from backend
  const msg = serverMsg || err?.message;

  if (status === 0) return 'Cannot reach the server. Check your connection and try again.';
  if (status === 400) return serverMsg || 'Please check your input and try again.';
  if (status === 401) return serverMsg || 'Wrong username or password.';
  if (status === 403) return serverMsg || 'Your account is not allowed to access this.';
  if (status === 404) return 'We couldn’t find what you requested.';
  if (status === 409) return serverMsg || 'This already exists. Please try different info.';
  if (status === 413) return 'That file is too large. Please upload a smaller one.';
  if (status >= 500) return serverMsg || 'We’re having a problem right now. Please try again in a moment.';
  return msg || fallback;
}
