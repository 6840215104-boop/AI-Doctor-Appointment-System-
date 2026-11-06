import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Stethoscope,
  Building2,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Doctor, Department } from '../types';
import { addDoctor, updateDoctor, deleteDoctor } from '../services/dbService';

interface DoctorManagementProps {
  doctors: Doctor[];
  departments: Department[];
  onRefresh?: () => void;
  onShowToast?: (msg: string) => void;
}

export const DoctorManagement: React.FC<DoctorManagementProps> = ({
  doctors,
  departments,
  onRefresh,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deleteConfirmDoctor, setDeleteConfirmDoctor] = useState<Doctor | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [status, setStatus] = useState<'active' | 'on_leave'>('active');
  const [availableDays, setAvailableDays] = useState<string[]>(['จันทร์', 'พุธ', 'ศุกร์']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const DAYS_LIST = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

  const openAddModal = () => {
    setEditingDoctor(null);
    setName('');
    setDepartmentId(departments[0]?.id || '');
    setSpecialization('');
    setPhone('02-888-1000');
    setEmail('');
    setRoomNumber('OPD-101');
    setStatus('active');
    setAvailableDays(['จันทร์', 'พุธ', 'ศุกร์']);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (doc: Doctor) => {
    setEditingDoctor(doc);
    setName(doc.name);
    setDepartmentId(doc.departmentId);
    setSpecialization(doc.specialization);
    setPhone(doc.phone);
    setEmail(doc.email);
    setRoomNumber(doc.roomNumber);
    setStatus(doc.status);
    setAvailableDays(doc.availableDays || ['จันทร์', 'พุธ']);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const toggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter((d) => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('กรุณากรอกชื่อแพทย์');
      return;
    }
    if (!departmentId) {
      setErrorMsg('กรุณาเลือกแผนก');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const selectedDept = departments.find((d) => d.id === departmentId);
      const deptName = selectedDept?.name || 'แผนกทั่วไป';

      if (editingDoctor) {
        // Update existing doctor in Firestore
        await updateDoctor(editingDoctor.id, {
          name: name.trim(),
          departmentId,
          departmentName: deptName,
          specialization: specialization.trim(),
          phone: phone.trim(),
          email: email.trim(),
          roomNumber: roomNumber.trim(),
          status,
          availableDays,
        });
        if (onShowToast) onShowToast(`อัปเดตข้อมูล ${name.trim()} สำเร็จ`);
      } else {
        // Add new doctor to Firestore
        await addDoctor({
          name: name.trim(),
          departmentId,
          departmentName: deptName,
          specialization: specialization.trim() || 'แพทย์ทั่วไป',
          phone: phone.trim() || '02-888-1000',
          email: email.trim() || 'doctor@hospital.ac.th',
          roomNumber: roomNumber.trim() || 'OPD-101',
          status,
          availableDays,
          availableTimeSlots: [
            '09:00 - 10:00',
            '10:00 - 11:00',
            '11:00 - 12:00',
            '13:00 - 14:00',
            '14:00 - 15:00',
          ],
          maxPatientsPerDay: 15,
        });
        if (onShowToast) onShowToast(`เพิ่มแพทย์ ${name.trim()} ลงในฐานข้อมูลสำเร็จ`);
      }

      onRefresh?.();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving doctor:', err);
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลแพทย์');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmDoctor) return;
    try {
      await deleteDoctor(deleteConfirmDoctor.id);
      if (onShowToast) onShowToast(`ลบข้อมูล ${deleteConfirmDoctor.name} สำเร็จ`);
      setDeleteConfirmDoctor(null);
      onRefresh?.();
    } catch (err: any) {
      console.error('Failed to delete doctor:', err);
      alert('ไม่สามารถลบข้อมูลแพทย์ได้: ' + (err?.message || 'ข้อผิดพลาดเครือข่าย'));
    }
  };

  // Filtered doctors
  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDeptFilter ? doc.departmentId === selectedDeptFilter : true;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-blue-600" />
            การจัดการแพทย์และตารางตรวจ (Doctor Management)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            เพิ่ม ลบ แก้ไข และค้นหาข้อมูลแพทย์ประจำโรงพยาบาล พร้อมตารางออกตรวจ (บันทึกข้อมูลจริงใน Firestore)
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>เพิ่มแพทย์ท่านใหม่</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="ค้นหาชื่อแพทย์, ความเชี่ยวชาญ, ห้องตรวจ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          >
            <option value="">ทุกแผนก ({departments.length})</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctors Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDoctors.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
            ไม่พบข้อมูลแพทย์ที่ตรงกับเงื่อนไขการค้นหา
          </div>
        ) : (
          filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Header with status badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base border border-blue-100">
                      <Stethoscope className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{doc.name}</h3>
                      <p className="text-xs text-blue-600 font-semibold">{doc.departmentName}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                      doc.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {doc.status === 'active' ? 'ปฏิบัติงาน' : 'ลางาน'}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">ความเชี่ยวชาญเฉพาะทาง:</span>
                    <span className="font-medium text-slate-800">{doc.specialization}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">ห้องตรวจ:</span>
                      <span className="font-semibold text-slate-800">{doc.roomNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">เบอร์ติดต่อ:</span>
                      <span className="font-mono text-slate-700">{doc.phone}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="text-slate-400 block text-[11px] mb-1">วันออกตรวจ:</span>
                    <div className="flex flex-wrap gap-1">
                      {doc.availableDays?.map((day) => (
                        <span
                          key={day}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-medium border border-blue-100"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(doc)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  แก้ไข
                </button>
                <button
                  onClick={() => setDeleteConfirmDoctor(doc)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  ลบ
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Doctor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 to-sky-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base font-sans">
                {editingDoctor ? 'แก้ไขข้อมูลแพทย์' : 'เพิ่มแพทย์ท่านใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs sm:text-sm">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">ชื่อ-นามสกุล แพทย์ *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นพ. วีระชัย สิทธิคุณ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">แผนกการรักษา *</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">สถานะ</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'on_leave')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  >
                    <option value="active">ปฏิบัติงาน (Active)</option>
                    <option value="on_leave">ลางาน (On Leave)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">ความเชี่ยวชาญเฉพาะทาง</label>
                <input
                  type="text"
                  placeholder="เช่น ศัลยกรรมข้อเข่าเทียม, อายุรศาสตร์โรคหัวใจ"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">ห้องตรวจ *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น OPD-205"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">เบอร์โทรศัพท์คลินิก</label>
                  <input
                    type="text"
                    placeholder="เช่น 02-888-1008"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Working Days */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">วันออกตรวจ (เลือกได้หลายวัน)</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_LIST.map((day) => {
                    const isSelected = availableDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึกลง Firestore...' : 'บันทึกข้อมูลแพทย์'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmDoctor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-800 shadow-xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                ยืนยันการลบข้อมูลแพทย์?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                คุณกำลังจะลบ <strong>{deleteConfirmDoctor.name}</strong> ออกจากฐานข้อมูล Firestore
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmDoctor(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
