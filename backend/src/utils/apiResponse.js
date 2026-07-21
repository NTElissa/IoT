export const success = (res, { message = 'Operation successful', data = null, status = 200 } = {}) =>
  res.status(status).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });

export const failure = (res, { message = 'Something went wrong', error = null, status = 400 } = {}) =>
  res.status(status).json({
    success: false,
    message,
    error,
    timestamp: new Date().toISOString(),
  });

export default { success, failure };
