import React, { useState } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  Edit3,
  XCircle,
  Trash2,
  FileText,
  Clock,
  Calendar,
  User,
  Building2,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  ShieldAlert,
} from 'lucide-react';
import { Appointment, Doctor, Department, AppointmentStatus } from '../types';
import {
  updateAppointment,
  cancelAppointment,
  deleteAppointment,
  checkDoubleBooking,
} from '../services/dbService';

interface AppointmentManagementProps {
  appointments: Appointment[];
  doctors: Doctor[];
  departments: Department[];
  onOpenCreateForm: () => void;
  onViewSlip: (appointment: Appointment) => void;
  onShowToast?: (msg: string) => void;
}

export const AppointmentManagement: React.FC<AppointmentManagementProps> = ({
  appointments,
  doctors,
  departments,
  onOpenCreateForm,
  onViewSlip,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ทั้งหมด');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Modals state
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [cancelTargetAppointment, setCancelTargetAppointment] = useState<Appointment | null>(null);
  const [deleteTargetAppointment, setDeleteTargetAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Edit form states
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDoctorId, setEditDoctorId] = useState('');
  const [editStatus, setEditStatus] = useState<AppointmentStatus>('ยืนยันแล้ว');
  const [editReason, setEditReason] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const openEditModal = (appt: Appointment) => {
    setEditingAppointment(appt);
    setEditDate(appt.appointmentDate);
    setEditTime(appt.appointmentTime);
    setEditDoctorId(appt.doctorId);
    setEditStatus(appt.status);
    setEditReason(appt.reason || '');
    setEditError(null);
    setConflictWarning(null);
  };

  const handleEditDoctorOrTimeChange = async (
    docId: string,
    dDate: string,
    dTime: string
  ) => {
    if (!editingAppointment) return;
    if (docId && dDate && dTime) {
      try {
        const isConflict = await checkDoubleBooking(docId, dDate, dTime, editingAppointment.id);
        if (isConflict) {
          setConflictWarning(
            `แพทย์ท่านนี้มีคิวนัดหมายในช่วงเวลา "${dTime}" ของวันที่ ${dDate} แล้ว กรุณาเลือกช่วงเวลาอื่น`
          );
        } else {
          setConflictWarning(null);
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;
    if (conflictWarning) {
      setEditError('ไม่สามารถบันทึกได้เนื่องจากมีคิวนัดหมายซ้ำซ้อน');
      return;
    }

    setIsSubmittingEdit(true);
    setEditError(null);

    try {
      const selectedDoc = doctors.find((d) => d.id === editDoctorId);
      const selectedDept = departments.find((dept) => dept.id === selectedDoc?.departmentId);

      await updateAppointment(editingAppointment.id, {
        appointmentDate: editDate,
        appointmentTime: editTime,
        doctorId: editDoctorId,
        doctorName: selectedDoc?.name || editingAppointment.doctorName,
        departmentId: selectedDept?.id || editingAppointment.departmentId,
        departmentName: selectedDept?.name || editingAppointment.departmentName,
        status: editStatus,
        reason: editReason.trim(),
      });

      if (onShowToast) onShowToast('แก้ไขข้อมูลการนัดหมายสำเร็จ');
      setEditingAppointment(null);
    } catch (err: any) {
      console.error('Failed to update appointment:', err);
      setEditError(err?.message || 'เกิดข้อผิดพลาดในการแก้ไขนัดหมาย');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await updateAppointment(id, { status: newStatus });
      if (onShowToast) onShowToast(`อัปเดตสถานะเป็น "${newStatus}" แล้ว`);
    } catch (err: any) {
      alert('ไม่สามารถอัปเดตสถานะได้: ' + (err?.message || 'ข้อผิดพลาดเครือข่าย'));
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetAppointment) return;
    try {
      await cancelAppointment(cancelTargetAppointment.id, cancelReason);
      if (onShowToast) onShowToast(`ยกเลิกการนัดหมายของ ${cancelTargetAppointment.patientName} แล้ว`);
      setCancelTargetAppointment(null);
      setCancelReason('');
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการยกเลิกนัดหมาย: ' + (err?.message || 'ข้อผิดพลาดเครือข่าย'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetAppointment) return;
    try {
      await deleteAppointment(deleteTargetAppointment.id);
      if (onShowToast) onShowToast('ลบรายการนัดหมายออกจาก Firestore สำเร็จ');
      setDeleteTargetAppointment(null);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการลบนัดหมาย: ' + (err?.message || 'ข้อผิดพลาดเครือข่าย'));
    }
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter((appt) => {
    const matchesSearch =
      appt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.patientPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appt.reason && appt.reason.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ทั้งหมด' ? true : appt.status === statusFilter;
    const matchesDate = dateFilter ? appt.appointmentDate === dateFilter : true;

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-600" />
            การจัดการการนัดหมาย (Appointment Management)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            สร้าง แก้ไข ยกเลิก และค้นหารายการนัดหมาย พร้อมระบบป้องกันการนัดซ้ำซ้อน
          </p>
        </div>

        <button
          onClick={onOpenCreateForm}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างการนัดหมายใหม่</span>
        </button>
      </div>

      {/* Search & Filters Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="ค้นหาชื่อผู้ป่วย, เบอร์โทร, ชื่อแพทย์, แผนกตรวจ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            >
              <option value="ทั้งหมด">สถานะทั้งหมด</option>
              <option value="รอรับการตรวจ">รอรับการตรวจ</option>
              <option value="ยืนยันแล้ว">ยืนยันแล้ว</option>
              <option value="เสร็จสิ้น">เสร็จสิ้น</option>
              <option value="ยกเลิก">ยกเลิก</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-xs text-slate-400 hover:text-slate-600 px-1.5 py-1"
                title="ล้างตัวกรองวันที่"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Appointments List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">ผู้ป่วย</th>
                <th className="py-3 px-4">แผนกและการตรวจ</th>
                <th className="py-3 px-4">แพทย์ผู้ตรวจ</th>
                <th className="py-3 px-4">วันที่ / เวลา</th>
                <th className="py-3 px-4">เหตุผล / อาการ</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    ไม่พบรายการนัดหมายที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Patient */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{appt.patientName}</div>
                      <div className="text-[11px] text-slate-400">{appt.patientPhone}</div>
                      <div className="text-[10px] text-slate-400">อายุ {appt.patientAge || '-'} ปี</div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        {appt.departmentName}
                      </span>
                      {appt.aiRecommendedDept && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-sm text-[10px] font-medium border border-blue-100">
                          AI แนะนำ
                        </span>
                      )}
                    </td>

                    {/* Doctor */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                        {appt.doctorName}
                      </span>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-700 font-medium">{appt.appointmentDate}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {appt.appointmentTime} น.
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-slate-600 line-clamp-2 text-[11px]">{appt.reason}</p>
                    </td>

                    {/* Status with quick change dropdown */}
                    <td className="py-3 px-4">
                      <select
                        value={appt.status}
                        onChange={(e) =>
                          handleQuickStatusChange(appt.id, e.target.value as AppointmentStatus)
                        }
                        className={`text-[11px] font-semibold rounded-full px-2.5 py-1 border transition-colors cursor-pointer ${
                          appt.status === 'ยืนยันแล้ว'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : appt.status === 'รอรับการตรวจ'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : appt.status === 'เสร็จสิ้น'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <option value="รอรับการตรวจ">รอรับการตรวจ</option>
                        <option value="ยืนยันแล้ว">ยืนยันแล้ว</option>
                        <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                        <option value="ยกเลิก">ยกเลิก</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewSlip(appt)}
                          title="ดูและพิมพ์ใบนัดหมาย"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openEditModal(appt)}
                          title="แก้ไขการนัดหมาย"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {appt.status !== 'ยกเลิก' && (
                          <button
                            onClick={() => setCancelTargetAppointment(appt)}
                            title="ยกเลิกการนัดหมาย"
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setDeleteTargetAppointment(appt)}
                          title="ลบรายการถาวร"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Appointment Modal */}
      {editingAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 to-sky-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base font-sans">แก้ไขรายการนัดหมาย</h3>
              <button
                onClick={() => setEditingAppointment(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs sm:text-sm">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Patient info preview */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between text-xs">
                <div>
                  <span className="text-slate-400 block">ผู้ป่วย:</span>
                  <span className="font-bold text-slate-800">{editingAppointment.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">เบอร์โทร:</span>
                  <span className="font-mono text-slate-700">{editingAppointment.patientPhone}</span>
                </div>
              </div>

              {/* Doctor Select */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">แพทย์ผู้ตรวจ *</label>
                <select
                  value={editDoctorId}
                  onChange={(e) => {
                    const newDoc = e.target.value;
                    setEditDoctorId(newDoc);
                    handleEditDoctorOrTimeChange(newDoc, editDate, editTime);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.departmentName} - {d.roomNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">วันที่นัด *</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setEditDate(newDate);
                      handleEditDoctorOrTimeChange(editDoctorId, newDate, editTime);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">ช่วงเวลานัด *</label>
                  <select
                    value={editTime}
                    onChange={(e) => {
                      const newTime = e.target.value;
                      setEditTime(newTime);
                      handleEditDoctorOrTimeChange(editDoctorId, editDate, newTime);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  >
                    {[
                      '09:00 - 10:00',
                      '10:00 - 11:00',
                      '11:00 - 12:00',
                      '13:00 - 14:00',
                      '14:00 - 15:00',
                      '15:00 - 16:00',
                    ].map((slot) => (
                      <option key={slot} value={slot}>
                        {slot} น.
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conflict warning */}
              {conflictWarning && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{conflictWarning}</span>
                </div>
              )}

              {/* Status */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">สถานะการนัดหมาย</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AppointmentStatus)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                >
                  <option value="รอรับการตรวจ">รอรับการตรวจ</option>
                  <option value="ยืนยันแล้ว">ยืนยันแล้ว</option>
                  <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                  <option value="ยกเลิก">ยกเลิก</option>
                </select>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">เหตุผล / อาการ</label>
                <textarea
                  rows={3}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Modal footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAppointment(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit || !!conflictWarning}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingEdit ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {cancelTargetAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-800 shadow-xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                ยกเลิกการนัดหมาย
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ผู้ป่วย <strong>{cancelTargetAppointment.patientName}</strong> วันที่{' '}
                {cancelTargetAppointment.appointmentDate}
              </p>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-700 block">ระบุเหตุผลการยกเลิก (ถ้ามี)</label>
              <input
                type="text"
                placeholder="เช่น ผู้ป่วยติดธุระด่วน, ขอเลื่อนนัดหมาย..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelTargetAppointment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs cursor-pointer"
              >
                ยืนยันยกเลิกนัด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-800 shadow-xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                ยืนยันการลบการนัดหมายถาวร?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                การลบรายการนัดหมายนี้จะลบออกจากฐานข้อมูล Firestore ถาวร
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetAppointment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
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
