import LoginEvent from '../models/LoginEvent.js';
import { success } from '../utils/apiResponse.js';

// Admins see their own hospital's login history; a Super Admin sees
// platform-wide activity (their own hospital is null, so no filter needed
// beyond role).
export const getLoginEvents = async (req, res) => {
  const filter = req.user.role === 'super_admin' ? {} : { hospital: req.user.hospital };
  const events = await LoginEvent.find(filter)
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .limit(200);
  return success(res, { data: events });
};

export default { getLoginEvents };
