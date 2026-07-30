export const success = (res, { message = 'Operation successful', data = null, status = 200 } = {}) =>
  res.status(status).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });

// `data` here is optional extra payload on an error response (e.g. the
// existing IV fluid bag a "needs confirmation" warning refers to) - most
// failures won't need it.
export const failure = (res, { message = 'Something went wrong', error = null, data = null, status = 400 } = {}) =>
  res.status(status).json({
    success: false,
    message,
    error,
    data,
    timestamp: new Date().toISOString(),
  });

export default { success, failure };
