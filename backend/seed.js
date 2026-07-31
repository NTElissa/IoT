import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './src/config/database.js';
import Hospital from './src/models/Hospital.js';
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
    Hospital.deleteMany({}),
    User.deleteMany({}),
    Room.deleteMany({}),
    Patient.deleteMany({}),
    IVFluid.deleteMany({}),
    Task.deleteMany({}),
  ]);

  console.log('[seed] Creating platform super administrator...');
  const superAdmin = await User.create({
    name: 'Platform Super Admin',
    email: 'superadmin@dripwatch.rw',
    password: 'SuperAdmin@12345',
    role: 'super_admin',
    phone: '+250700000000',
    hospital: null,
  });

  console.log('[seed] Registering Remera Rukoma Hospital...');
  const hospital = await Hospital.create({
    name: 'Remera Rukoma Hospital',
    address: 'Remera Rukoma, Rwanda',
    phone: '+250780000000',
    createdBy: superAdmin._id,
  });

  const admin = await User.create({
    name: 'Dr. MUSABE Jean Bosco',
    email: 'admin@remerarukoma.rw',
    password: 'Admin@12345',
    role: 'admin',
    // Real number provided during setup - receives real SMS once
    // AT_USERNAME/AT_API_KEY are configured in backend/.env.
    phone: '+250738382033',
    hospital: hospital._id,
    ward: 'Administration',
    createdBy: superAdmin._id,
  });

  const doctors = [];
  const doctorNames = ['Uwase', 'Habimana', 'Mukamana', 'Niyonzima', 'Ingabire'];
  for (let i = 0; i < doctorNames.length; i += 1) {
    doctors.push(
      await User.create({
        name: `Dr. ${doctorNames[i]}`,
        email: `doctor${i + 1}@remerarukoma.rw`,
        password: 'Doctor@12345',
        role: 'doctor',
        phone: `+25078000010${i}`,
        ward: WARDS[i % WARDS.length],
        hospital: hospital._id,
        createdBy: admin._id,
      })
    );
  }

  const nurses = [];
  const nurseNames = [
    'Kamanzi', 'Uwimana', 'Mugisha', 'Nyirahabimana', 'Bizimana',
    'Uwera', 'Twagirayezu', 'Mutesi', 'Ndayisenga', 'Umutoni',
    'Rugamba', 'Iradukunda', 'Nsengimana', 'Uwamahoro', 'Byiringiro',
  ];
  for (let i = 0; i < nurseNames.length; i += 1) {
    nurses.push(
      await User.create({
        name: `Nurse ${nurseNames[i]}`,
        email: `nurse${i + 1}@remerarukoma.rw`,
        password: 'Nurse@12345',
        role: 'nurse',
        // nurse1 gets the second real phone number provided so live SMS
        // alerts (bag-change requests, escalations) can be tested end-to-end.
        phone: i === 0 ? '+250781832092' : `+25078000020${i}`,
        ward: WARDS[i % WARDS.length],
        hospital: hospital._id,
        createdBy: admin._id,
      })
    );
  }

  const staffMembers = [];
  for (let i = 0; i < 10; i += 1) {
    staffMembers.push(
      await User.create({
        name: `Staff Member ${i + 1}`,
        email: `staff${i + 1}@remerarukoma.rw`,
        password: 'Staff@12345',
        role: 'staff',
        phone: `+25078000030${i}`,
        ward: WARDS[i % WARDS.length],
        hospital: hospital._id,
        createdBy: admin._id,
      })
    );
  }

  console.log('[seed] Creating rooms...');
  const rooms = [];
  for (let i = 1; i <= 12; i += 1) {
    const ward = WARDS[i % WARDS.length];
    const room = await Room.create({
      hospital: hospital._id,
      roomNumber: `R${100 + i}`,
      ward,
      bedCount: 2,
      assignedDoctors: [doctors[i % doctors.length]._id],
      assignedNurses: [nurses[(i - 1) % nurses.length]._id, nurses[i % nurses.length]._id],
      status: 'occupied',
      createdBy: admin._id,
    });
    rooms.push(room);
  }

  console.log('[seed] Registering patients...');
  const genders = ['M', 'F'];
  const allergyPool = ['Penicillin', 'Latex', 'Peanuts', 'Sulfa drugs', 'Iodine'];
  const patients = [];
  for (let i = 1; i <= 20; i += 1) {
    const room = rooms[i % rooms.length];
    const patient = await Patient.create({
      hospital: hospital._id,
      name: `Patient ${String.fromCharCode(64 + ((i % 26) + 1))}${i}`,
      dateOfBirth: new Date(1950 + (i % 60), i % 12, (i % 27) + 1),
      gender: genders[i % 2],
      contact: `+25078801${String(1000 + i).slice(-4)}`,
      medicalHistory: 'No significant prior history recorded (demo data).',
      allergies: i % 4 === 0 ? [allergyPool[i % allergyPool.length]] : [],
      room: room._id,
      bed: i % 2 === 0 ? 'A' : 'B',
      assignedDoctor: room.assignedDoctors[0],
      assignedNurse: room.assignedNurses[i % room.assignedNurses.length],
      createdBy: admin._id,
      patientCode: `P-DEMO${String(i).padStart(2, '0')}`,
    });
    patients.push(patient);
  }

  console.log('[seed] Enabling the portal for a demo patient...');
  const demoPatient = patients[0];
  const demoPortalUser = await User.create({
    name: demoPatient.name,
    email: `${demoPatient.patientCode.toLowerCase()}@patient.dripwatch.local`,
    password: 'Patient@12345',
    role: 'patient',
    hospital: hospital._id,
    patient: demoPatient._id,
    createdBy: admin._id,
  });
  demoPatient.portalUser = demoPortalUser._id;
  demoPatient.portalEnabled = true;
  await demoPatient.save();

  console.log('[seed] Starting IV fluids...');
  for (let i = 0; i < 15; i += 1) {
    const patient = patients[i];
    const room = rooms.find((r) => r._id.equals(patient.room));
    const bagSize = [500, 1000][i % 2];
    const emptyBagWeight = 30;
    const initialWeight = emptyBagWeight + bagSize;
    const startingLevelPct = [95, 60, 45, 15, 8, 30, 70, 90, 5, 55, 40, 65, 20, 12, 80][i];
    const currentWeight = emptyBagWeight + (startingLevelPct / 100) * bagSize;
    const flowRate = 100 + (i % 4) * 25;

    await IVFluid.create({
      hospital: hospital._id,
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
      hospital: hospital._id,
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
  const lowBags = await IVFluid.find({ hospital: hospital._id, status: 'alert_low' }).populate('room patient');
  for (const bag of lowBags) {
    await Task.create({
      hospital: hospital._id,
      ivFluid: bag._id,
      room: bag.room._id,
      patient: bag.patient._id,
      assignedBy: bag.room.assignedNurses[0],
      assignedTo: staffMembers[Math.floor(Math.random() * staffMembers.length)]._id,
      taskType: 'bag_change',
      description: `Change IV bag for ${bag.patient.name} in room ${bag.room.roomNumber}`,
      status: 'pending',
    });
  }

  console.log('[seed] Registering a second hospital to demonstrate multi-tenancy...');
  const hospital2 = await Hospital.create({
    name: 'Kibagabaga District Hospital',
    address: 'Kibagabaga, Kigali, Rwanda',
    createdBy: superAdmin._id,
  });
  const admin2 = await User.create({
    name: 'Dr. Alice Mukandayisenga',
    email: 'admin@kibagabaga.rw',
    password: 'Admin@12345',
    role: 'admin',
    hospital: hospital2._id,
    createdBy: superAdmin._id,
  });
  const doctor2 = await User.create({
    name: 'Dr. Eric Nshuti',
    email: 'doctor1@kibagabaga.rw',
    password: 'Doctor@12345',
    role: 'doctor',
    hospital: hospital2._id,
    ward: 'Medical',
    createdBy: admin2._id,
  });
  const nurse2 = await User.create({
    name: 'Nurse Claudine Umuhoza',
    email: 'nurse1@kibagabaga.rw',
    password: 'Nurse@12345',
    role: 'nurse',
    hospital: hospital2._id,
    ward: 'Medical',
    createdBy: admin2._id,
  });
  const room2 = await Room.create({
    hospital: hospital2._id,
    roomNumber: 'K101',
    ward: 'Medical',
    bedCount: 2,
    assignedDoctors: [doctor2._id],
    assignedNurses: [nurse2._id],
    createdBy: admin2._id,
  });
  await Patient.create({
    hospital: hospital2._id,
    name: 'Patient K1',
    gender: 'F',
    room: room2._id,
    bed: 'A',
    assignedDoctor: doctor2._id,
    assignedNurse: nurse2._id,
    createdBy: admin2._id,
  });

  console.log('[seed] Done.');
  console.log('');
  console.log('Demo login credentials:');
  console.log('  Super Admin: superadmin@dripwatch.rw / SuperAdmin@12345');
  console.log('  --- Remera Rukoma Hospital ---');
  console.log('  Admin:   admin@remerarukoma.rw / Admin@12345');
  console.log('  Doctor:  doctor1@remerarukoma.rw / Doctor@12345');
  console.log('  Nurse:   nurse1@remerarukoma.rw / Nurse@12345');
  console.log('  Staff:   staff1@remerarukoma.rw / Staff@12345');
  console.log(`  Patient: patient ID ${demoPatient.patientCode} / Patient@12345 (use the "Patient sign-in" tab)`);
  console.log('  --- Kibagabaga District Hospital (multi-tenancy demo) ---');
  console.log('  Admin:   admin@kibagabaga.rw / Admin@12345');
  console.log('  Doctor:  doctor1@kibagabaga.rw / Doctor@12345');
  console.log('  Nurse:   nurse1@kibagabaga.rw / Nurse@12345');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
