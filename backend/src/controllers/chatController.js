import Patient from '../models/Patient.js';
import Task from '../models/Task.js';
import Message from '../models/Message.js';
import { broadcastChatMessage } from '../services/notificationService.js';
import { notifyUsers } from '../services/notifyUsers.js';
import { success, failure } from '../utils/apiResponse.js';

// Who can read/post in a patient's care-team chat: the admin, the assigned
// doctor/nurse, any staff member currently delegated a task for that
// patient, and the patient's own portal account if they have one. This is
// deliberately broader than canAccessPatient (clinical record access) -
// chat is about coordinating care, not viewing the chart.
const canAccessChat = async (user, patient) => {
  if (user.role === 'admin') return true;
  if (user.role === 'doctor') return patient.assignedDoctor?.toString() === user._id.toString();
  if (user.role === 'nurse') return patient.assignedNurse?.toString() === user._id.toString();
  if (user.role === 'patient') return patient.portalUser?.toString() === user._id.toString();
  if (user.role === 'staff') {
    const hasTask = await Task.exists({ patient: patient._id, assignedTo: user._id });
    return !!hasTask;
  }
  return false;
};

// Everyone currently eligible to be in this chat, for scoping the socket
// broadcast and persisted notifications on a new message.
const chatParticipantIds = async (patient) => {
  const ids = [];
  if (patient.assignedDoctor) ids.push(patient.assignedDoctor);
  if (patient.assignedNurse) ids.push(patient.assignedNurse);
  if (patient.portalUser) ids.push(patient.portalUser);
  const tasks = await Task.find({ patient: patient._id }).select('assignedTo');
  tasks.forEach((t) => ids.push(t.assignedTo));
  return [...new Set(ids.map((id) => id.toString()))];
};

export const getMessages = async (req, res) => {
  const patient = await Patient.findOne({ _id: req.params.id, hospital: req.user.hospital });
  if (!patient) return failure(res, { message: 'Patient not found', status: 404 });
  if (!(await canAccessChat(req.user, patient))) {
    return failure(res, { message: 'Not authorized to view this conversation', status: 403 });
  }

  const messages = await Message.find({ patient: patient._id }).sort({ createdAt: 1 }).limit(500);
  return success(res, { data: messages });
};

export const sendMessage = async (req, res) => {
  const patient = await Patient.findOne({ _id: req.params.id, hospital: req.user.hospital });
  if (!patient) return failure(res, { message: 'Patient not found', status: 404 });
  if (!(await canAccessChat(req.user, patient))) {
    return failure(res, { message: 'Not authorized to post in this conversation', status: 403 });
  }

  const { text } = req.body;
  if (!text?.trim()) return failure(res, { message: 'Message text is required', status: 400 });

  const message = await Message.create({
    hospital: req.user.hospital,
    patient: patient._id,
    sender: req.user._id,
    senderName: req.user.name,
    senderRole: req.user.role,
    text: text.trim(),
    readBy: [req.user._id],
  });

  const participantIds = await chatParticipantIds(patient);
  const recipientIds = participantIds.filter((id) => id !== req.user._id.toString());

  broadcastChatMessage(message, [...recipientIds, req.user._id.toString()], req.user.hospital);
  await notifyUsers({
    hospital: req.user.hospital,
    userIds: recipientIds,
    type: 'system',
    message: `New message from ${req.user.name} about ${patient.name}`,
    patient: patient._id,
  });

  return success(res, { message: 'Message sent', data: message, status: 201 });
};

export const markMessagesRead = async (req, res) => {
  const patient = await Patient.findOne({ _id: req.params.id, hospital: req.user.hospital });
  if (!patient) return failure(res, { message: 'Patient not found', status: 404 });
  if (!(await canAccessChat(req.user, patient))) {
    return failure(res, { message: 'Not authorized for this conversation', status: 403 });
  }

  await Message.updateMany(
    { patient: patient._id, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );
  return success(res, { message: 'Marked as read' });
};

export default { getMessages, sendMessage, markMessagesRead };
