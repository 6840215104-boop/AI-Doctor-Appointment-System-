export interface Department {
  id: string;
  name: string;
  nameEn: string;
  code: string;
  description: string;
  icon: string;
  building: string;
  floor: string;
  active: boolean;
  createdAt?: string;
}

export interface Doctor {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  specialization: string;
  phone: string;
  email: string;
  roomNumber: string;
  availableDays: string[];
  availableTimeSlots: string[];
  maxPatientsPerDay: number;
  status: 'active' | 'on_leave';
  createdAt?: string;
  updatedAt?: string;
}

export interface Patient {
  id: string;
  hn: string;
  name: string;
  phone: string;
  age: number;
  gender: string;
  bloodType?: string;
  allergies?: string;
  emergencyContact?: string;
  createdAt?: string;
}

export type AppointmentStatus =
  | 'รอรับการตรวจ' // Pending
  | 'ยืนยันแล้ว'   // Confirmed
  | 'เสร็จสิ้น'     // Completed
  | 'ยกเลิก';       // Cancelled

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  departmentId: string;
  departmentName: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // e.g. "09:00 - 10:00"
  reason: string;
  status: AppointmentStatus;
  aiRecommendedDept?: string;
  aiRecommendationNote?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AIRecommendationResult {
  recommendedDepartment: string;
  departmentCode: string;
  urgency: 'ปกติ (Routine)' | 'เร่งด่วน (Urgent)' | 'ฉุกเฉิน (Emergency)';
  explanation: string;
  matchingDoctorsSpecialty: string;
  preparationTips: string[];
  disclaimer: string;
  source: 'gemini' | 'rule_engine';
  notice?: string;
}
