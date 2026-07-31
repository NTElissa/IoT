import Patient from '../models/Patient.js';
import PatientVital from '../models/PatientVital.js';
import { success, failure } from '../utils/apiResponse.js';

const canAccessPatient = (user, patient) => {
  if (user.role === 'admin') return true;
  if (user.role === 'doctor') return patient.assignedDoctor?.toString() === user._id.toString();
  if (user.role === 'nurse') return patient.assignedNurse?.toString() === user._id.toString();
  if (user.role === 'patient') return patient.portalUser?.toString() === user._id.toString();
  return false;
};

export const getVitals = async (req, res) => {
  const patient = await Patient.findOne({ _id: req.params.id, hospital: req.user.hospital });
  if (!patient) return failure(res, { message: 'Patient not found', status: 404 });
  if (!canAccessPatient(req.user, patient)) {
    return failure(res, { message: 'Not authorized to view vitals for this patient', status: 403 });
  }
  const vitals = await PatientVital.find({ patient: patient._id })
    .populate('recordedBy', 'name role')
    .sort({ createdAt: -1 })
    .limit(100);
  return success(res, { data: vitals });
};

// Only a doctor or nurse actually assigned to this patient may log a
// reading - not the patient themselves, and not just any admin, since this
// is a clinical action performed at the bedside.
export const createVital = async (req, res) => {
  const patient = await Patient.findOne({ _id: req.params.id, hospital: req.user.hospital });
  if (!patient) return failure(res, { message: 'Patient not found', status: 404 });
  const isAssignedCarer =
    (req.user.role === 'doctor' && patient.assignedDoctor?.toString() === req.user._id.toString()) ||
    (req.user.role === 'nurse' && patient.assignedNurse?.toString() === req.user._id.toString());
  if (!isAssignedCarer && req.user.role !== 'admin') {
    return failure(res, { message: 'Only this patient\u2019s assigned doctor or nurse may log vitals', status: 403 });
  }

  const {
    temperatureC,
    heartRate,
    respiratoryRate,
    bloodPressureSystolic,
    bloodPressureDiastolic,
    oxygenSaturation,
    notes,
  } = req.body;

  const vital = await PatientVital.create({
    hospital: req.user.hospital,
    patient: patient._id,
    recordedBy: req.user._id,
    temperatureC,
    heartRate,
    respiratoryRate,
    bloodPressureSystolic,
    bloodPressureDiastolic,
    oxygenSaturation,
    notes,
  });

  const populated = await vital.populate('recordedBy', 'name role');
  return success(res, { message: 'Vitals recorded', data: populated, status: 201 });
};

export default { getVitals, createVital };
