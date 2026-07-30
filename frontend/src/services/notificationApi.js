import api, { unwrap } from './api.js';

// Named notificationApi (not notificationService) to avoid clashing with
// the socket-facing naming used elsewhere in the app.
export const getNotifications = () => unwrap(api.get('/notifications'));
export const markRead = (id) => unwrap(api.patch(`/notifications/${id}/read`));
export const markAllRead = () => unwrap(api.patch('/notifications/read-all'));

export default { getNotifications, markRead, markAllRead };
