export function toUserMessage(err: any, fallback = 'Something went wrong. Please try again.') {
  const status = err?.status;
  const msg = err?.error?.message || err?.message;

  if (status === 0) return 'Cannot connect to the server. Check your internet connection.';
  if (status === 400) return msg || 'Please review your input and try again.';
  if (status === 401) return 'Unauthorized. Please check your info .';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'Requested resource was not found.';
  if (status === 409) return msg || 'This username or email is already in use. Please choose a different one.';
  if (status === 413) return 'The file you tried to upload is too large. Please select a smaller image.'; // <-- explicit for 413
  if (status >= 500) return 'Server error. Please try again later.';
  return msg || fallback;
}
