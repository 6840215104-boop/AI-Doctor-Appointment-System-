/**
 * Firestore Database Service with Real CRUD and Double-Booking Prevention
 * Uses persistent Firestore collections: departments, doctors, patients, appointments
 */
import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  Department,
  Doctor,
  Patient,
  Appointment,
  AppointmentStatus,
} from '../types';

// Default hospital departments for Thailand Hospital Simulation
export const INITIAL_DEPARTMENTS: Omit<Department, 'id'>[] = [
  {
    name: 'แผนกอายุรกรรม',
    nameEn: 'Internal Medicine',
    code: 'INTERNAL_MEDICINE',
    description: 'ตรวจรักษาและดูแลโรคทั่วไป โรคเรื้อรัง เบาหวาน ความดัน ไขมัน และระบบอวัยวะภายใน',
    icon: 'Stethoscope',
    building: 'อาคารเฉลิมพระเกียรติ',
    floor: 'ชั้น 2',
    active: true,
  },
  {
    name: 'แผนกศัลยกรรม',
    nameEn: 'General Surgery',
    code: 'SURGERY',
    description: 'บริการตรวจวินิจฉัยและผ่าตัดรักษาโรคทางศัลยกรรมทั่วไป ก้อนเนื้อ และไส้ติ่ง',
    icon: 'Scissors',
    building: 'อาคารผ่าตัดและวิกฤต',
    floor: 'ชั้น 3',
    active: true,
  },
  {
    name: 'แผนกกุมารเวชกรรม',
    nameEn: 'Pediatrics',
    code: 'PEDIATRICS',
    description: 'ดูแลสุขภาพ ตรวจรักษาโรค พัฒนาการ และวัคซีนสำหรับทารกและเด็กอายุแรกเกิดถึง 15 ปี',
    icon: 'Baby',
    building: 'อาคารแม่และเด็ก',
    floor: 'ชั้น 1',
    active: true,
  },
  {
    name: 'แผนกสูตินรีเวชกรรม',
    nameEn: 'Obstetrics & Gynecology',
    code: 'OBGYN',
    description: 'ฝากครรภ์ คลอดบุตร ตรวจคัดกรองมะเร็งปากมดลูก และดูแลสุขภาพสตรีทุกช่วงวัย',
    icon: 'HeartHandshake',
    building: 'อาคารแม่และเด็ก',
    floor: 'ชั้น 2',
    active: true,
  },
  {
    name: 'แผนกออร์โธปิดิกส์ (กระดูกและข้อ)',
    nameEn: 'Orthopedics',
    code: 'ORTHOPEDICS',
    description: 'ตรวจรักษาโรคกระดูก ข้อต่อ เส้นเอ็น กล้ามเนื้อ กระดูกหัก และการบาดเจ็บจากการเล่นกีฬา',
    icon: 'Activity',
    building: 'อาคารเฉลิมพระเกียรติ',
    floor: 'ชั้น 1',
    active: true,
  },
  {
    name: 'แผนกจักษุวิทยา (ตา)',
    nameEn: 'Ophthalmology',
    code: 'OPHTHALMOLOGY',
    description: 'ตรวจวัดสายตา รักษาโรคต้อกระจก ต้อหิน จอประสาทตา และภาวะสายตาผิดปกติ',
    icon: 'Eye',
    building: 'อาคารผู้ป่วยนอก (OPD)',
    floor: 'ชั้น 4',
    active: true,
  },
  {
    name: 'แผนกโสต ศอ นาสิก (หู คอ จมูก)',
    nameEn: 'ENT',
    code: 'ENT',
    description: 'รักษาโรคหูอื้อ ภูมิแพ้โพรงจมูก ไซนัสอักเสบ ต่อมทอนซิล และการได้ยิน',
    icon: 'Headphones',
    building: 'อาคารผู้ป่วยนอก (OPD)',
    floor: 'ชั้น 4',
    active: true,
  },
  {
    name: 'แผนกผิวหนังและเลเซอร์',
    nameEn: 'Dermatology',
    code: 'DERMATOLOGY',
    description: 'ตรวจรักษาโรคผิวหนัง ผื่นคัน สะเก็ดเงิน สิว ฝ้า และบริการความงามทางการแพทย์',
    icon: 'Sparkles',
    building: 'อาคารเฉลิมพระเกียรติ',
    floor: 'ชั้น 4',
    active: true,
  },
  {
    name: 'แผนกหัวใจและหลอดเลือด',
    nameEn: 'Cardiology',
    code: 'CARDIOLOGY',
    description: 'ตรวจคลื่นไฟฟ้าหัวใจ อัลตราซาวด์หัวใจ วินิจฉัยและรักษาโรคหลอดเลือดหัวใจตีบ',
    icon: 'Heart',
    building: 'ศูนย์หัวใจสิริกิติ์',
    floor: 'ชั้น 2',
    active: true,
  },
  {
    name: 'แผนกทันตกรรม',
    nameEn: 'Dentistry',
    code: 'DENTAL',
    description: 'ขูดหินปูน อุดฟัน ถอนฟัน รักษารากฟัน ผ่าฟันคุด และจัดฟัน',
    icon: 'Smile',
    building: 'อาคารผู้ป่วยนอก (OPD)',
    floor: 'ชั้น 3',
    active: true,
  },
  {
    name: 'แผนกจิตเวชและสุขภาพใจ',
    nameEn: 'Psychiatry',
    code: 'PSYCHIATRY',
    description: 'ให้คำปรึกษาปัญหาความเครียด วิตกกังวล ภาวะซึมเศร้า และการนอนไม่หลับ',
    icon: 'Brain',
    building: 'อาคารส่งเสริมสุขภาพ',
    floor: 'ชั้น 5',
    active: true,
  },
];

// Fictional sample doctors for educational demonstration
export const INITIAL_DOCTORS: Omit<Doctor, 'id'>[] = [
  {
    name: 'นพ. วรัญญู ประเสริฐสุข',
    departmentId: '',
    departmentName: 'แผนกอายุรกรรม',
    specialization: 'อายุรศาสตร์โรคต่อมไร้ท่อและเบาหวาน',
    phone: '02-888-1001',
    email: 'waranyu.p@hospital-demo.ac.th',
    roomNumber: 'OPD-201',
    availableDays: ['จันทร์', 'อังคาร', 'พฤหัสบดี'],
    availableTimeSlots: ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '13:00 - 14:00'],
    maxPatientsPerDay: 15,
    status: 'active',
  },
  {
    name: 'พญ. นภัสสร วงศ์ไพศาล',
    departmentId: '',
    departmentName: 'แผนกอายุรกรรม',
    specialization: 'อายุรศาสตร์ทั่วไปและโรคไต',
    phone: '02-888-1002',
    email: 'napassorn.w@hospital-demo.ac.th',
    roomNumber: 'OPD-202',
    availableDays: ['พุธ', 'ศุกร์', 'เสาร์'],
    availableTimeSlots: ['09:00 - 10:00', '10:00 - 11:00', '13:00 - 14:00', '14:00 - 15:00'],
    maxPatientsPerDay: 12,
    status: 'active',
  },
  {
    name: 'นพ. ชวลิต ธนกิจอนันต์',
    departmentId: '',
    departmentName: 'แผนกศัลยกรรม',
    specialization: 'ศัลยกรรมทั่วไปและการผ่าตัดผ่านกล้อง',
    phone: '02-888-1003',
    email: 'chawalit.t@hospital-demo.ac.th',
    roomNumber: 'SURG-305',
    availableDays: ['จันทร์', 'พุธ', 'ศุกร์'],
    availableTimeSlots: ['09:00 - 10:00', '10:00 - 11:00', '13:30 - 14:30'],
    maxPatientsPerDay: 10,
    status: 'active',
  },
  {
    name: 'พญ. พรพิมล ดำรงเกียรติ',
    departmentId: '',
    departmentName: 'แผนกกุมารเวชกรรม',
    specialization: 'กุมารเวชศาสตร์และภูมิแพ้เด็ก',
    phone: '02-888-1004',
    email: 'pornpimon.d@hospital-demo.ac.th',
    roomNumber: 'PED-102',
    availableDays: ['อังคาร', 'พฤหัสบดี', 'เสาร์'],
    availableTimeSlots: ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '13:00 - 14:00'],
    maxPatientsPerDay: 18,
    status: 'active',
  },
  {
    name: 'นพ. ศิริชัย เตชะวัฒนา',
    departmentId: '',
    departmentName: 'แผนกออร์โธปิดิกส์ (กระดูกและข้อ)',
    specialization: 'ศัลยกรรมกระดูกสันหลังและข้อเข่าเทียม',
    phone: '02-888-1005',
    email: 'sirichai.t@hospital-demo.ac.th',
    roomNumber: 'ORTHO-112',
    availableDays: ['จันทร์', 'อังคาร', 'พฤหัสบดี'],
    availableTimeSlots: ['09:00 - 10:00', '10:00 - 11:00', '14:00 - 15:00', '15:00 - 16:00'],
    maxPatientsPerDay: 12,
    status: 'active',
  },
  {
    name: 'พญ. รัชดาพร มงคลชัย',
    departmentId: '',
    departmentName: 'แผนกหัวใจและหลอดเลือด',
    specialization: 'อายุรศาสตร์โรคหัวใจและการสวนหัวใจ',
    phone: '02-888-1006',
    email: 'ratchadaporn.m@hospital-demo.ac.th',
    roomNumber: 'CARD-208',
    availableDays: ['พุธ', 'ศุกร์', 'เสาร์'],
    availableTimeSlots: ['09:00 - 10:00', '10:00 - 11:00', '13:00 - 14:00'],
    maxPatientsPerDay: 10,
    status: 'active',
  },
  {
    name: 'นพ. กิตติพงษ์ เจริญทรัพย์',
    departmentId: '',
    departmentName: 'แผนกจักษุวิทยา (ตา)',
    specialization: 'จักษุวิทยาต้อกระจกและผ่าตัดแก้ไขสายตา',
    phone: '02-888-1007',
    email: 'kittipong.c@hospital-demo.ac.th',
    roomNumber: 'EYE-401',
    availableDays: ['จันทร์', 'พุธ', 'ศุกร์'],
    availableTimeSlots: ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00'],
    maxPatientsPerDay: 14,
    status: 'active',
  },
];

// Fictional sample patients for educational demonstration
export const INITIAL_PATIENTS: Omit<Patient, 'id'>[] = [
  {
    hn: 'HN-670101',
    name: 'นายสมชาย พงษ์สิทธิ์',
    phone: '081-998-1122',
    age: 48,
    gender: 'ชาย',
    bloodType: 'O',
    allergies: 'แพ้ยาเพนิซิลลิน (Penicillin)',
    emergencyContact: 'นางวรรณา พงษ์สิทธิ์ (ภรรยา) 089-111-2233',
  },
  {
    hn: 'HN-670102',
    name: 'นางสาวสุภาภรณ์ ชัยประสิทธิ์',
    phone: '082-334-5566',
    age: 32,
    gender: 'หญิง',
    bloodType: 'A',
    allergies: 'ไม่มีประวัติแพ้ยา',
    emergencyContact: 'นายธีระ ชัยประสิทธิ์ (บิดา) 081-445-6677',
  },
  {
    hn: 'HN-670103',
    name: 'เด็กชายธนวัฒน์ รัตนวิมล',
    phone: '085-778-9900',
    age: 8,
    gender: 'ชาย',
    bloodType: 'B',
    allergies: 'แพ้อาหารทะเล (กุ้ง, ปู)',
    emergencyContact: 'นางกานดา รัตนวิมล (มารดา) 085-778-9900',
  },
  {
    hn: 'HN-670104',
    name: 'นายประสิทธิ์ ภูมิมณี',
    phone: '089-223-4455',
    age: 63,
    gender: 'ชาย',
    bloodType: 'AB',
    allergies: 'ไม่มีประวัติแพ้ยา',
    emergencyContact: 'นางมณี ภูมิมณี (ภรรยา) 089-334-5566',
  },
];

/**
 * Initialize Firestore data if collections are empty
 */
export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    // 1. Check departments
    let deptSnap = await getDocs(collection(db, 'departments'));
    const deptMap: Record<string, string> = {};

    if (deptSnap.empty) {
      console.log('Seeding initial departments...');
      for (const dept of INITIAL_DEPARTMENTS) {
        const ref = await addDoc(collection(db, 'departments'), {
          ...dept,
          createdAt: new Date().toISOString(),
        });
        deptMap[dept.name] = ref.id;
      }
      deptSnap = await getDocs(collection(db, 'departments'));
    } else {
      deptSnap.docs.forEach((d) => {
        deptMap[d.data().name] = d.id;
      });
    }

    // 2. Check doctors
    let docSnap = await getDocs(collection(db, 'doctors'));
    const docList: Doctor[] = [];

    if (docSnap.empty) {
      console.log('Seeding initial doctors...');
      for (const docItem of INITIAL_DOCTORS) {
        const dId = deptMap[docItem.departmentName] || '';
        const docRef = await addDoc(collection(db, 'doctors'), {
          ...docItem,
          departmentId: dId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        docList.push({ ...docItem, id: docRef.id, departmentId: dId });
      }
      docSnap = await getDocs(collection(db, 'doctors'));
    } else {
      docSnap.docs.forEach((d) => {
        docList.push({ id: d.id, ...(d.data() as Omit<Doctor, 'id'>) });
      });
    }

    // 3. Check patients
    let patSnap = await getDocs(collection(db, 'patients'));
    const patientList: Patient[] = [];

    if (patSnap.empty) {
      console.log('Seeding initial patients...');
      for (const pat of INITIAL_PATIENTS) {
        const patRef = await addDoc(collection(db, 'patients'), {
          ...pat,
          createdAt: new Date().toISOString(),
        });
        patientList.push({ ...pat, id: patRef.id });
      }
    } else {
      patSnap.docs.forEach((d) => {
        patientList.push({ id: d.id, ...(d.data() as Omit<Patient, 'id'>) });
      });
    }

    // 4. Check appointments - seed if empty or less than 2
    const apptSnap = await getDocs(collection(db, 'appointments'));
    if (apptSnap.size < 2 && docList.length > 0 && patientList.length > 0) {
      console.log('Seeding sample appointments...');
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const dayAfterTomorrow = new Date(Date.now() + 172800000).toISOString().split('T')[0];

      const sampleAppointments: Omit<Appointment, 'id'>[] = [
        {
          patientId: patientList[0]?.id || 'PAT-001',
          patientName: patientList[0]?.name || 'นายสมชาย พงษ์สิทธิ์',
          patientPhone: patientList[0]?.phone || '081-998-1122',
          patientAge: patientList[0]?.age || 48,
          departmentId: docList[0]?.departmentId || '',
          departmentName: docList[0]?.departmentName || 'แผนกอายุรกรรม',
          doctorId: docList[0]?.id || '',
          doctorName: docList[0]?.name || 'นพ. วรัญญู ประเสริฐสุข',
          appointmentDate: today,
          appointmentTime: '09:00 - 10:00',
          reason: 'ตรวจติดตามค่าน้ำตาลในเลือดและรับยาเบาหวานประจำงวด',
          status: 'ยืนยันแล้ว',
          aiRecommendedDept: 'แผนกอายุรกรรม',
          notes: 'ผู้ป่วยงดอาหารและน้ำหลัง 20.00 น.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          patientId: patientList[1]?.id || 'PAT-002',
          patientName: patientList[1]?.name || 'นางสาวสุภาภรณ์ ชัยประสิทธิ์',
          patientPhone: patientList[1]?.phone || '082-334-5566',
          patientAge: patientList[1]?.age || 32,
          departmentId: docList[1]?.departmentId || docList[0]?.departmentId || '',
          departmentName: docList[1]?.departmentName || 'แผนกอายุรกรรม',
          doctorId: docList[1]?.id || docList[0]?.id || '',
          doctorName: docList[1]?.name || 'พญ. นภัสสร วงศ์ไพศาล',
          appointmentDate: today,
          appointmentTime: '10:00 - 11:00',
          reason: 'ปวดศีรษะเรื้อรังและเวียนหัวเวลาเปลี่ยนท่าทาง',
          status: 'รอรับการตรวจ',
          aiRecommendedDept: 'แผนกอายุรกรรม',
          notes: 'วัดความดันเบื้องต้นปกติ',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          patientId: patientList[2]?.id || 'PAT-003',
          patientName: patientList[2]?.name || 'เด็กชายธนวัฒน์ รัตนวิมล',
          patientPhone: patientList[2]?.phone || '085-778-9900',
          patientAge: patientList[2]?.age || 8,
          departmentId: docList[3]?.departmentId || '',
          departmentName: docList[3]?.departmentName || 'แผนกกุมารเวชกรรม',
          doctorId: docList[3]?.id || '',
          doctorName: docList[3]?.name || 'พญ. พรพิมล ดำรงเกียรติ',
          appointmentDate: tomorrow,
          appointmentTime: '11:00 - 12:00',
          reason: 'ตรวจรับวัคซีนป้องกันไข้หวัดใหญ่และประเมินการเจริญเติบโต',
          status: 'ยืนยันแล้ว',
          aiRecommendedDept: 'แผนกกุมารเวชกรรม',
          notes: 'เตรียมสมุดบันทึกวัคซีนมาด้วย',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          patientId: patientList[3]?.id || 'PAT-004',
          patientName: patientList[3]?.name || 'นายประสิทธิ์ ภูมิมณี',
          patientPhone: patientList[3]?.phone || '089-223-4455',
          patientAge: patientList[3]?.age || 63,
          departmentId: docList[5]?.departmentId || docList[0]?.departmentId || '',
          departmentName: docList[5]?.departmentName || 'แผนกหัวใจและหลอดเลือด',
          doctorId: docList[5]?.id || docList[0]?.id || '',
          doctorName: docList[5]?.name || 'พญ. รัชดาพร มงคลชัย',
          appointmentDate: dayAfterTomorrow,
          appointmentTime: '13:00 - 14:00',
          reason: 'ตรวจติดตามอาการใจสั่นและรับประเมินคลื่นไฟฟ้าหัวใจ',
          status: 'ยืนยันแล้ว',
          aiRecommendedDept: 'แผนกหัวใจและหลอดเลือด',
          notes: 'ตรวจ EKG ซ้ำ',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      for (const appt of sampleAppointments) {
        if (appt.doctorId) {
          await addDoc(collection(db, 'appointments'), appt);
        }
      }
    }
  } catch (error) {
    console.warn('Seeding note:', error);
  }
}

// ======================= DEPARTMENTS =======================

export async function fetchDepartments(): Promise<Department[]> {
  try {
    const snap = await getDocs(collection(db, 'departments'));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Department, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'departments');
  }
}

export function subscribeToDepartments(
  onUpdate: (departments: Department[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, 'departments'),
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Department, 'id'>),
      }));
      onUpdate(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'departments');
    }
  );
}

// ======================= DOCTORS =======================

export async function fetchDoctors(): Promise<Doctor[]> {
  try {
    const snap = await getDocs(collection(db, 'doctors'));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Doctor, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'doctors');
  }
}

export function subscribeToDoctors(
  onUpdate: (doctors: Doctor[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, 'doctors'),
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Doctor, 'id'>),
      }));
      onUpdate(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'doctors');
    }
  );
}

/**
 * Remove all keys with `undefined` values from an object before sending to Firestore
 * to prevent: "FirebaseError: Unsupported field value: undefined"
 */
export function removeUndefinedFields<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

export async function addDoctor(doctor: Omit<Doctor, 'id'>): Promise<string> {
  try {
    const payload = removeUndefinedFields({
      ...doctor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const ref = await addDoc(collection(db, 'doctors'), payload);
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'doctors');
  }
}

export async function updateDoctor(id: string, doctor: Partial<Doctor>): Promise<void> {
  try {
    const docRef = doc(db, 'doctors', id);
    const payload = removeUndefinedFields({
      ...doctor,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `doctors/${id}`);
  }
}

export async function deleteDoctor(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'doctors', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `doctors/${id}`);
  }
}

// ======================= PATIENTS =======================

export async function fetchPatients(): Promise<Patient[]> {
  try {
    const snap = await getDocs(collection(db, 'patients'));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Patient, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'patients');
  }
}

export function subscribeToPatients(
  onUpdate: (patients: Patient[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, 'patients'),
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Patient, 'id'>),
      }));
      onUpdate(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'patients');
    }
  );
}

export async function addPatient(patient: Omit<Patient, 'id'>): Promise<string> {
  try {
    const payload = removeUndefinedFields({
      ...patient,
      createdAt: new Date().toISOString(),
    });
    const ref = await addDoc(collection(db, 'patients'), payload);
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'patients');
  }
}

// ======================= APPOINTMENTS =======================

export async function fetchAppointments(): Promise<Appointment[]> {
  try {
    const snap = await getDocs(collection(db, 'appointments'));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Appointment, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'appointments');
  }
}

/**
 * Check if the doctor is already booked at this date and time
 * (Double-booking prevention rule)
 */
export async function checkDoubleBooking(
  doctorId: string,
  appointmentDate: string,
  appointmentTime: string,
  excludeAppointmentId?: string
): Promise<boolean> {
  if (!doctorId || !appointmentDate || !appointmentTime) return false;

  try {
    const snap = await getDocs(collection(db, 'appointments'));
    const conflict = snap.docs.find((d) => {
      if (excludeAppointmentId && d.id === excludeAppointmentId) return false;
      const data = d.data() as Appointment;
      return (
        data.doctorId === doctorId &&
        data.appointmentDate === appointmentDate &&
        data.appointmentTime === appointmentTime &&
        data.status !== 'ยกเลิก'
      );
    });
    return !!conflict;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'appointments');
  }
}

export async function createAppointment(
  appointment: Omit<Appointment, 'id'>
): Promise<string> {
  // 1. Validate required fields
  if (!appointment.patientName?.trim()) {
    throw new Error('กรุณาระบุชื่อ-นามสกุลผู้ป่วย');
  }
  if (!appointment.patientPhone?.trim()) {
    throw new Error('กรุณาระบุเบอร์โทรศัพท์ติดต่อ');
  }
  if (!appointment.doctorId) {
    throw new Error('กรุณาเลือกแพทย์ผู้ตรวจ');
  }
  if (!appointment.departmentId) {
    throw new Error('กรุณาเลือกแผนกการรักษา');
  }
  if (!appointment.appointmentDate) {
    throw new Error('กรุณาเลือกวันที่นัดหมาย');
  }
  if (!appointment.appointmentTime) {
    throw new Error('กรุณาเลือกช่วงเวลาตรวจ');
  }

  // 2. Prevent double booking
  const hasConflict = await checkDoubleBooking(
    appointment.doctorId,
    appointment.appointmentDate,
    appointment.appointmentTime
  );

  if (hasConflict) {
    throw new Error(
      `แพทย์ท่านนี้มีคิวนัดหมายในช่วงเวลา "${appointment.appointmentTime}" ของวันที่ ${appointment.appointmentDate} แล้ว กรุณาเลือกช่วงเวลาอื่นหรือเลือกแพทย์ท่านอื่น`
    );
  }

  // 3. Build strictly defined payload (never undefined)
  const rawPayload: Record<string, any> = {
    patientId: appointment.patientId || `PAT-${Date.now().toString().slice(-6)}`,
    patientName: appointment.patientName.trim(),
    patientPhone: appointment.patientPhone.trim(),
    patientAge: Number(appointment.patientAge) || 30,
    departmentId: appointment.departmentId,
    departmentName: appointment.departmentName || 'แผนกทั่วไป',
    doctorId: appointment.doctorId,
    doctorName: appointment.doctorName || 'แพทย์ผู้ตรวจ',
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    reason: appointment.reason?.trim() || 'ตรวจสุขภาพทั่วไปและปรึกษาแพทย์',
    status: appointment.status || 'ยืนยันแล้ว',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Only assign optional fields when they have a defined truthy string value
  if (appointment.aiRecommendedDept && appointment.aiRecommendedDept.trim()) {
    rawPayload.aiRecommendedDept = appointment.aiRecommendedDept.trim();
  }
  if (appointment.aiRecommendationNote && appointment.aiRecommendationNote.trim()) {
    rawPayload.aiRecommendationNote = appointment.aiRecommendationNote.trim();
  }
  if (appointment.notes && appointment.notes.trim()) {
    rawPayload.notes = appointment.notes.trim();
  }

  const cleanPayload = removeUndefinedFields(rawPayload);

  try {
    const ref = await addDoc(collection(db, 'appointments'), cleanPayload);
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'appointments');
  }
}

export async function updateAppointment(
  id: string,
  appointment: Partial<Appointment>
): Promise<void> {
  // If doctor, date or time is modified, verify no double booking exists
  if (appointment.doctorId && appointment.appointmentDate && appointment.appointmentTime) {
    const hasConflict = await checkDoubleBooking(
      appointment.doctorId,
      appointment.appointmentDate,
      appointment.appointmentTime,
      id
    );
    if (hasConflict) {
      throw new Error(
        `แพทย์ท่านนี้มีคิวนัดหมายในช่วงเวลา "${appointment.appointmentTime}" ของวันที่ ${appointment.appointmentDate} แล้ว กรุณาเลือกช่วงเวลาอื่น`
      );
    }
  }

  try {
    const docRef = doc(db, 'appointments', id);
    await updateDoc(docRef, {
      ...appointment,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
  }
}

export async function cancelAppointment(id: string, reason?: string): Promise<void> {
  try {
    const docRef = doc(db, 'appointments', id);
    await updateDoc(docRef, {
      status: 'ยกเลิก',
      notes: reason ? `เหตุผลที่ยกเลิก: ${reason}` : 'ยกเลิกการนัดหมาย',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
  }
}

export async function deleteAppointment(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'appointments', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `appointments/${id}`);
  }
}

/**
 * Real-time listener for appointments collection
 */
export function subscribeToAppointments(
  onUpdate: (appointments: Appointment[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, 'appointments'),
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Appointment, 'id'>),
      }));
      onUpdate(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'appointments');
    }
  );
}
