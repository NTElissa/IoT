import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './src/config/database.js';
import User from './src/models/User.js';
import Room from './src/models/Room.js';
import Patient from './src/models/Patient.js';
import IVFluid from './src/models/IVFluid.js';
import Task from './src/models/Task.js';
import { estimateEmptyTime } from './src/services/ivCalculationService.js';

const WARDS = ['Medical', 'Surgical', 'Maternity', 'Pediatric'];
const FLUID_TYPES = ['Normal Saline', '5% Dextrose', "Ringer's Lactate"];

const run = async () => {
  await connectDB();
  console.log('[seed] Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Room.deleteMany({}),
    Patient.deleteMany({}),
    IVFluid.deleteMany({}),
    Task.deleteMany({}),
  ]);

  console.log('[seed] Creating users...');
  const admin = await User.create({
    name: 'Dr. MUSABE Jean Bosco',
    email: 'admin@remerarukoma.rw',
    password: 'Admin@12345',
    role: 'admin',
    phone: '+250781832092',
    ward: 'Administration',
  });

  const doctors = await User.insertMany(
    Array.from({ length: 5 }).map((_, i) => ({
      name: `Dr. ${['Uwase', 'Habimana', 'Mukamana', 'Niyonzima', 'Ingabire'][i]}`,
      email: `doctor${i + 1}@remerarukoma.rw`,
      password: 'Doctor@12345',
      role: 'doctor',
      phone: `+25078000010${i}`,
      ward: WARDS[i % WARDS.length],
      createdBy: admin._id,
    }))
  );
  // re-hash since insertMany skips pre-save hooks
  for (const doc of doctors) {
    doc.password = 'Doctor@12345';
    await doc.save();
  }

  const nurseNames = [
    'Kamanzi', 'Uwimana', 'Mugisha', 'Nyirahabimana', 'Bizimana',
    'Uwera', 'Twagirayezu', 'Mutesi', 'Ndayisenga', 'Umutoni',
    'Rugamba', 'Iradukunda', 'Nsengimana', 'Uwamahoro', 'Byiringiro',
  ];
  const nursesRaw = nurseNames.map((n, i) => ({
    name: `Nurse ${n}`,
    email: `nurse${i + 1}@remerarukoma.rw`,
    password: 'Nurse@12345',
    role: 'nurse',
    phone: `+25078000020${i}`,
    ward: WARDS[i % WARDS.length],
    createdBy: admin._id,
  }));
  const nurses = [];
  for (const n of nursesRaw) {
    nurses.push(await User.create(n));
  }

  const supportRaw = Array.from({ length: 10 }).map((_, i) => ({
    name: `Support Staff ${i + 1}`,
    email: `support${i + 1}@remerarukoma.rw`,
    password: 'Support@12345',
    role: 'support_staff',
    phone: `+25078000030${i}`,
    ward: WARDS[i % WARDS.length],
    createdBy: admin._id,
  }));
  const supportStaff = [];
  for (const s of supportRaw) {
    supportStaff.push(await User.create(s));
  }

  console.log('[seed] Creating rooms...');
  const rooms = [];
  for (let i = 1; i <= 12; i += 1) {
    const ward = WARDS[i % WARDS.length];
    const room = await Room.create({
      roomNumber: `R${100 + i}`,
      ward,
      bedCount: 2,
      assignedDoctors: [doctors[i % doctors.length]._id],
      assignedNurses: [nurses[i % nurses.length]._id, nurses[(i + 1) % nurses.length]._id],
      status: 'occupied',
      createdBy: admin._id,
    });
    rooms.push(room);
  }

  console.log('[seed] Registering patients...');
  const genders = ['M', 'F'];
  const patients = [];
  for (let i = 1; i <= 20; i += 1) {
    const room = rooms[i % rooms.length];
    const patient = await Patient.create({
      name: `Patient ${String.fromCharCode(64 + ((i % 26) + 1))}${i}`,
      dateOfBirth: new Date(1950 + (i % 60), i % 12, (i % 27) + 1),
      gender: genders[i % 2],
      contact: `+25078801${String(1000 + i).slice(-4)}`,
      medicalHistory: 'No significant prior history recorded (demo data).',
      room: room._id,
      bed: i % 2 === 0 ? 'A' : 'B',
      assignedDoctor: room.assignedDoctors[0],
      assignedNurse: room.assignedNurses[i % room.assignedNurses.length],
      createdBy: admin._id,
    });
    patients.push(patient);
  }

  console.log('[seed] Starting IV fluids...');
  for (let i = 0; i < 15; i += 1) {
    const patient = patients[i];
    const room = rooms.find((r) => r._id.equals(patient.room));
    const bagSize = [500, 1000][i % 2];
    const emptyBagWeight = 30;
    const initialWeight = emptyBagWeight + bagSize;
    // Vary starting fluid levels so the dashboard shows a mix of statuses
    const startingLevelPct = [95, 60, 45, 15, 8, 30, 70, 90, 5, 55, 40, 65, 20, 12, 80][i];
    const currentWeight = emptyBagWeight + (startingLevelPct / 100) * bagSize;
    const flowRate = 100 + (i % 4) * 25;

    await IVFluid.create({
      fluidType: FLUID_TYPES[i % FLUID_TYPES.length],
      bagSize,
      emptyBagWeight,
      initialWeight,
      currentWeight,
      flowRate,
      fluidLevel: startingLevelPct,
      status: startingLevelPct < 10 ? 'alert_low' : startingLevelPct > 90 ? 'alert_high' : 'active',
      room: room._id,
      patient: patient._id,
      startedBy: room.assignedNurses[0],
      estimatedEmptyTime: estimateEmptyTime({ currentWeight, emptyBagWeight, flowRate }),
    });
  }

  console.log('[seed] Creating a couple of completed IV bags...');
  for (let i = 15; i < 20; i += 1) {
    const patient = patients[i];
    const room = rooms.find((r) => r._id.equals(patient.room));
    const bagSize = 500;
    const emptyBagWeight = 30;
    await IVFluid.create({
      fluidType: FLUID_TYPES[i % FLUID_TYPES.length],
      bagSize,
      emptyBagWeight,
      initialWeight: emptyBagWeight + bagSize,
      currentWeight: emptyBagWeight,
      flowRate: 125,
      fluidLevel: 0,
      status: 'completed',
      room: room._id,
      patient: patient._id,
      startedBy: room.assignedNurses[0],
      startTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 30 * 60 * 1000),
    });
  }

  console.log('[seed] Creating sample delegated tasks...');
  const lowBags = await IVFluid.find({ status: 'alert_low' }).populate('room patient');
  for (const bag of lowBags) {
    await Task.create({
      ivFluid: bag._id,
      room: bag.room._id,
      patient: bag.patient._id,
      assignedBy: bag.room.assignedNurses[0],
      assignedTo: supportStaff[Math.floor(Math.random() * supportStaff.length)]._id,
      taskType: 'bag_change',
      description: `Change IV bag for ${bag.patient.name} in room ${bag.room.roomNumber}`,
      status: 'pending',
    });
  }

  console.log('[seed] Done.');
  console.log('');
  console.log('Demo login credentials:');
  console.log(`  Admin:   admin@remerarukoma.rw / Admin@12345`);
  console.log(`  Doctor:  doctor1@remerarukoma.rw / Doctor@12345`);
  console.log(`  Nurse:   nurse1@remerarukoma.rw / Nurse@12345`);
  console.log(`  Support: support1@remerarukoma.rw / Support@12345`);

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
