import React, { useState, useEffect } from 'react';
import {
  CalendarPlus,
  User,
  Phone,
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { Department, Doctor, Patient, Appointment, AIRecommendationResult } from '../types';
import { createAppointment, checkDoubleBooking, addPatient } from '../services/dbService';

interface AppointmentFormProps {
  departments: Department[];
  doctors: Doctor[];
  patients: Patient[];
  prefilledRecommendation?: AIRecommendationResult | null;
  onSuccess: (appointment: Appointment) => void;
  onCancel?: () => void;
  onGoToAppointments?: () => void;
  onViewSlip?: (appointment: Appointment) => void;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  departments,
  doctors,
  patients,
  prefilledRecommendation,
  onSuccess,
  onCancel,
  onGoToAppointments,
  onViewSlip,
}) => {
  // Form fields
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState<number | ''>(35);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');

  // Conflict warning & loading states
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Success state (inline confirmation)
  const [submittedAppointment, setSubmittedAppointment] = useState<Appointment | null>(null);

  // Set default appointment date to tomorrow or today
  useEffect(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setAppointmentDate(dateStr);
  }, []);

  // Set default department if none selected
  useEffect(() => {
    if (!selectedDepartmentId && departments.length > 0) {
      setSelectedDepartmentId(departments[0].id);
    }
  }, [departments, selectedDepartmentId]);

  // Handle prefilled AI recommendation
  useEffect(() => {
    if (prefilledRecommendation) {
      setReason(
        prefilledRecommendation.explanation
          ? `[AI แนะนำแผนก] ${prefilledRecommendation.explanation}`
          : ''
      );
      // Match department by code or name
      const matchedDept = departments.find(
        (d) =>
          d.code === prefilledRecommendation.departmentCode ||
          d.name.includes(prefilledRecommendation.recommendedDepartment) ||
          prefilledRecommendation.recommendedDepartment.includes(d.name)
      );
      if (matchedDept) {
        setSelectedDepartmentId(matchedDept.id);
      }
    }
  }, [prefilledRecommendation, departments]);

  // Filter doctors by selected department
  const filteredDoctors = doctors.filter((doc) => {
    if (!selectedDepartmentId) return true;
    return doc.departmentId === selectedDepartmentId;
  });

  // When selected department changes, auto-select first doctor
  useEffect(() => {
    if (selectedDepartmentId) {
      const isCurrentDoctorValid = filteredDoctors.some((d) => d.id === selectedDoctorId);
      if (!isCurrentDoctorValid) {
        if (filteredDoctors.length > 0) {
          setSelectedDoctorId(filteredDoctors[0].id);
        } else {
          setSelectedDoctorId('');
        }
      }
    }
  }, [selectedDepartmentId, filteredDoctors, selectedDoctorId]);

  // Current selected doctor object
  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // Available time slots based on selected doctor
  const availableSlots = currentDoctor?.availableTimeSlots?.length
    ? currentDoctor.availableTimeSlots
    : [
        '09:00 - 10:00',
        '10:00 - 11:00',
        '11:00 - 12:00',
        '13:00 - 14:00',
        '14:00 - 15:00',
        '15:00 - 16:00',
      ];

  // Auto-set time slot if empty
  useEffect(() => {
    if (!appointmentTime && availableSlots.length > 0) {
      setAppointmentTime(availableSlots[0]);
    }
  }, [availableSlots, appointmentTime]);

  // Real-time conflict check (double booking prevention)
  useEffect(() => {
    let isCancelled = false;
    async function checkConflict() {
      if (!selectedDoctorId || !appointmentDate || !appointmentTime) {
        setConflictWarning(null);
        return;
      }
      setIsCheckingConflict(true);
      try {
        const isConflict = await checkDoubleBooking(
          selectedDoctorId,
          appointmentDate,
          appointmentTime
        );
        if (!isCancelled) {
          if (isConflict) {
            setConflictWarning(
              `แพทย์ท่านนี้มีคิวนัดหมายในช่วงเวลา "${appointmentTime}" ของวันที่ ${appointmentDate} แล้ว กรุณาเลือกช่วงเวลาอื่นหรือเลือกแพทย์ท่านอื่น`
            );
          } else {
            setConflictWarning(null);
          }
        }
      } catch (err) {
        console.warn('Conflict check note:', err);
      } finally {
        if (!isCancelled) setIsCheckingConflict(false);
      }
    }

    const timer = setTimeout(checkConflict, 300);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [selectedDoctorId, appointmentDate, appointmentTime]);

  // Handle selecting a sample fictional patient for speed
  const handleSelectSamplePatient = (pat: Patient) => {
    setPatientName(pat.name);
    setPatientPhone(pat.phone);
    setPatientAge(pat.age);
  };

  const resetForm = () => {
    setPatientName('');
    setPatientPhone('');
    setPatientAge(35);
    setReason('');
    setSubmittedAppointment(null);
    setFormError(null);
    setConflictWarning(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!patientName.trim()) {
      setFormError('กรุณากรอกชื่อ-นามสกุลของผู้ป่วย');
      return;
    }
    if (!patientPhone.trim()) {
      setFormError('กรุณากรอกเบอร์โทรศัพท์ติดต่อ');
      return;
    }
    if (patientPhone.replace(/\D/g, '').length < 9) {
      setFormError('กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (อย่างน้อย 9-10 หลัก)');
      return;
    }
    if (!selectedDepartmentId) {
      setFormError('กรุณาเลือกแผนกที่ต้องการตรวจ');
      return;
    }
    if (!selectedDoctorId) {
      setFormError('กรุณาเลือกแพทย์ผู้ตรวจ (หรือแผนกนี้ยังไม่มีแพทย์ประจำ)');
      return;
    }
    if (!appointmentDate) {
      setFormError('กรุณาเลือกวันที่นัดหมาย');
      return;
    }
    if (!appointmentTime) {
      setFormError('กรุณาเลือกเวลาที่นัดหมาย');
      return;
    }
    if (conflictWarning) {
      setFormError('ไม่สามารถจองได้ เนื่องจากมีคิวนัดหมายซ้ำซ้อน กรุณาเปลี่ยนวันหรือเวลา');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedDept = departments.find((d) => d.id === selectedDepartmentId);
      const selectedDoc = doctors.find((d) => d.id === selectedDoctorId);

      // Create new patient record if HN not found
      const newPatientId = `PAT-${Date.now().toString().slice(-6)}`;

      const newAppointmentData: Omit<Appointment, 'id'> = {
        patientId: newPatientId,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientAge: Number(patientAge) || 30,
        departmentId: selectedDepartmentId,
        departmentName: selectedDept?.name || 'แผนกทั่วไป',
        doctorId: selectedDoctorId,
        doctorName: selectedDoc?.name || 'แพทย์ผู้ตรวจ',
        appointmentDate,
        appointmentTime,
        reason: reason.trim() || 'ตรวจสุขภาพทั่วไปและปรึกษาแพทย์',
        status: 'ยืนยันแล้ว',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (prefilledRecommendation?.recommendedDepartment?.trim()) {
        newAppointmentData.aiRecommendedDept = prefilledRecommendation.recommendedDepartment.trim();
      }
      if (prefilledRecommendation?.explanation?.trim()) {
        newAppointmentData.aiRecommendationNote = prefilledRecommendation.explanation.trim();
      }

      const newId = await createAppointment(newAppointmentData);

      // Persist to fictional patient directory if not exists
      try {
        await addPatient({
          hn: `HN-${patientPhone.slice(-4) || '8888'}`,
          name: patientName.trim(),
          phone: patientPhone.trim(),
          age: Number(patientAge) || 30,
          gender: 'ชาย',
        });
      } catch {
        // Continue
      }

      const createdAppointment: Appointment = {
        ...newAppointmentData,
        id: newId,
      };

      setSubmittedAppointment(createdAppointment);
      onSuccess(createdAppointment);
    } catch (err: any) {
      console.error('Failed to create appointment:', err);
      setFormError(err?.message || 'เกิดข้อผิดพลาดในการบันทึกการนัดหมาย กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If appointment was just successfully submitted, show prominent confirmation screen
  if (submittedAppointment) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold font-sans">บันทึกการนัดหมายแพทย์สำเร็จ!</h2>
            <p className="text-emerald-100 text-sm mt-1">
              ข้อมูลการนัดหมายถูกบันทึกลงในฐานข้อมูล Cloud Firestore เรียบร้อยแล้ว
            </p>
          </div>

          {/* Details Summary */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 block text-xs">ชื่อผู้ป่วย:</span>
                <span className="font-bold text-slate-900 text-base">
                  {submittedAppointment.patientName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">เบอร์โทรศัพท์:</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {submittedAppointment.patientPhone}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">แผนกตรวจ:</span>
                <span className="font-semibold text-blue-700 flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {submittedAppointment.departmentName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">แพทย์ผู้ตรวจ:</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  {submittedAppointment.doctorName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">วันที่นัดหมาย:</span>
                <span className="font-bold text-slate-900">
                  {submittedAppointment.appointmentDate}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">เวลานัดตรวจ:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {submittedAppointment.appointmentTime} น.
                </span>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                <span className="text-slate-400 block text-xs">อาการ / เหตุผล:</span>
                <span className="text-slate-700">{submittedAppointment.reason}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                จองการนัดหมายเพิ่มอีกราย
              </button>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                {onViewSlip && (
                  <button
                    type="button"
                    onClick={() => onViewSlip(submittedAppointment)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-blue-600" />
                    ดู / พิมพ์ใบนัดตรวจ
                  </button>
                )}

                {onGoToAppointments && (
                  <button
                    type="button"
                    onClick={onGoToAppointments}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <span>ดูรายการนัดหมายทั้งหมด</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-sky-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-sky-100 mb-2">
                <CalendarPlus className="w-3.5 h-3.5" />
                แบบฟอร์มนัดหมายแพทย์ผู้ป่วยนอก (OPD)
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-sans">
                ลงทะเบียนนัดหมายแพทย์
              </h2>
              <p className="text-xs sm:text-sm text-sky-100 mt-1">
                กรอกข้อมูลผู้ป่วย เลือกแผนกและแพทย์ผู้ตรวจ ระบบจะตรวจสอบคิวซ้ำซ้อนอัตโนมัติ
              </p>
            </div>
            {prefilledRecommendation && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/15 rounded-xl border border-white/20 text-xs">
                <Sparkles className="w-4 h-4 text-sky-300" />
                <span>รับข้อมูลจาก AI แนะนำ</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendation Banner if available */}
        {prefilledRecommendation && (
          <div className="bg-sky-50 border-b border-sky-100 px-6 py-3.5 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-blue-900">
                แผนกที่ระบบ AI แนะนำ: {prefilledRecommendation.recommendedDepartment}
              </span>
              <p className="text-slate-600 mt-0.5">{prefilledRecommendation.explanation}</p>
            </div>
          </div>
        )}

        {/* Quick Sample Patients Selection */}
        {patients.length > 0 && (
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              เลือกผู้ป่วยตัวอย่าง (คลิกเพื่อกรอกอัตโนมัติ):
            </span>
            {patients.slice(0, 4).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectSamplePatient(p)}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors font-medium text-[11px] cursor-pointer"
              >
                {p.name} ({p.age} ปี)
              </button>
            ))}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {formError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Patient Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-600" />
              1. ข้อมูลผู้ป่วย (Patient Information)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  ชื่อ-นามสกุล ผู้ป่วย <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="เช่น นายสมชาย สุขใจ"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  อายุ (ปี) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="130"
                  required
                  placeholder="เช่น 35"
                  value={patientAge}
                  onChange={(e) =>
                    setPatientAge(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="เช่น 081-234-5678"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Department and Doctor */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-blue-600" />
              2. แผนกและแพทย์ผู้ตรวจ (Department & Doctor)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Department Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  แผนกการรักษา <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                >
                  <option value="">-- เลือกแผนกการรักษา --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.building} {dept.floor})
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  แพทย์ผู้ตรวจ <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                >
                  <option value="">-- เลือกแพทย์ผู้ตรวจ --</option>
                  {filteredDoctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} - {doc.specialization} ({doc.roomNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Doctor Info Card */}
            {currentDoctor ? (
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs space-y-1 text-slate-700">
                <div className="flex items-center justify-between font-semibold text-blue-950">
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    {currentDoctor.name} ({currentDoctor.roomNumber})
                  </span>
                  <span className="text-blue-700">{currentDoctor.specialization}</span>
                </div>
                <div className="text-slate-600 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                  <span>
                    <strong>วันออกตรวจ:</strong>{' '}
                    {currentDoctor.availableDays?.join(', ') || 'ทุกวันทำการ'}
                  </span>
                  <span>
                    <strong>เบอร์โทรคลินิก:</strong> {currentDoctor.phone}
                  </span>
                </div>
              </div>
            ) : selectedDepartmentId && filteredDoctors.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>ยังไม่มีแพทย์ประจำแผนกนี้ในระบบ คุณสามารถเพิ่มแพทย์ได้ที่เมนู "จัดการข้อมูลแพทย์"</span>
              </div>
            ) : null}
          </div>

          {/* Section 3: Appointment Date & Time (Double Booking Protected) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Calendar className="w-4 h-4 text-blue-600" />
              3. กำหนดวันและเวลาตรวจ (Appointment Schedule)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  วันที่นัดหมาย <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  ช่วงเวลาตรวจ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <select
                    required
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  >
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot} น.
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Real-time Double Booking Feedback */}
            {conflictWarning ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5 font-medium animate-pulse">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{conflictWarning}</span>
              </div>
            ) : appointmentDate && appointmentTime && selectedDoctorId && !isCheckingConflict ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ช่วงเวลานี้ว่าง สามารถทำการนัดหมายได้ (ไม่มีคิวซ้ำซ้อน)</span>
              </div>
            ) : null}
          </div>

          {/* Section 4: Reason for appointment */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileText className="w-4 h-4 text-blue-600" />
              4. เหตุผลการนัดหมายและอาการเบื้องต้น
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                อาการเบื้องต้น หรือเหตุผลที่ต้องการพบแพทย์ <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="ระบุอาการสำคัญ เช่น ปวดศีรษะเรื้อรัง 3 วัน, นัดตรวจติดตามเบาหวาน, ปวดข้อเข่า ฯลฯ"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !!conflictWarning}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังบันทึกนัดหมายลง Firestore...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ยืนยันการนัดหมายแพทย์</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
