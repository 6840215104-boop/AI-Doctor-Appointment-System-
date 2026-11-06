import React from 'react';
import {
  X,
  Printer,
  Calendar,
  Clock,
  User,
  Building2,
  Stethoscope,
  Phone,
  FileCheck2,
  QrCode,
  AlertCircle,
} from 'lucide-react';
import { Appointment, Doctor } from '../types';

interface AppointmentSlipModalProps {
  appointment: Appointment | null;
  doctor?: Doctor;
  onClose: () => void;
}

export const AppointmentSlipModal: React.FC<AppointmentSlipModalProps> = ({
  appointment,
  doctor,
  onClose,
}) => {
  if (!appointment) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatThaiDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return d.toLocaleDateString('th-TH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:p-0">
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-blue-700 to-sky-600 px-6 py-4 text-white flex items-center justify-between print:bg-blue-800">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-sky-200" />
            <h3 className="font-bold text-base tracking-tight font-sans">
              ใบนัดหมายแพทย์ตรวจรักษา (Hospital Appointment Slip)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors print:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Body */}
        <div className="p-6 space-y-5 text-slate-800">
          {/* Hospital Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                โรงพยาบาลสุขภาวะพัฒน์
              </h2>
              <p className="text-xs text-slate-500">
                Sukhawaphat Memorial Teaching Hospital
              </p>
              <p className="text-xs text-slate-500 mt-1">
                999 ถนนวิทยุ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330 • โทร 02-888-1000
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                สถานะ: {appointment.status}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                เลขอ้างอิง: {appointment.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Patient Details */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              ข้อมูลผู้ป่วย (Patient Information)
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">ชื่อ-นามสกุล:</span>
                <span className="font-semibold text-slate-900">{appointment.patientName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">เบอร์โทรศัพท์:</span>
                <span className="font-semibold text-slate-900">{appointment.patientPhone}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">อายุ:</span>
                <span className="font-medium text-slate-800">{appointment.patientAge || '-'} ปี</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">รหัสผู้ป่วย (HN):</span>
                <span className="font-medium text-slate-800">HN-{appointment.patientPhone.slice(-4) || '9999'}</span>
              </div>
            </div>
          </div>

          {/* Appointment Schedule */}
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200">
            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              กำหนดการนัดตรวจ (Appointment Schedule)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">วันที่นัดหมาย:</span>
                <span className="font-bold text-blue-900 text-sm">
                  {formatThaiDate(appointment.appointmentDate)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">ช่วงเวลานัดตรวจ:</span>
                <span className="font-bold text-blue-900 text-sm flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  {appointment.appointmentTime} น.
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">แผนกตรวจ:</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  {appointment.departmentName}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">แพทย์ผู้ตรวจ:</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                  {appointment.doctorName}
                </span>
              </div>
              {doctor && (
                <>
                  <div>
                    <span className="text-xs text-slate-500 block">ห้องตรวจ:</span>
                    <span className="font-medium text-slate-800">{doctor.roomNumber}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">ความเชี่ยวชาญ:</span>
                    <span className="font-medium text-slate-800 text-xs">{doctor.specialization}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Reason / Symptoms */}
          <div>
            <span className="text-xs font-medium text-slate-500 block mb-1">
              เหตุผลการนัดหมาย / อาการเบื้องต้น:
            </span>
            <p className="text-sm bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800">
              {appointment.reason || 'ตรวจสุขภาพและติดตามการรักษา'}
            </p>
          </div>

          {/* Hospital Instructions & Simulated QR */}
          <div className="flex items-start justify-between gap-4 pt-3 border-t border-slate-200 text-xs text-slate-500">
            <div className="space-y-1">
              <p className="font-semibold text-slate-700 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                ข้อปฏิบัติสำหรับผู้ป่วย:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                <li>กรุณามาถึงก่อนเวลานัดหมายอย่างน้อย 15-30 นาที เพื่อวัดความดันและคัดกรองเบื้องต้น</li>
                <li>นำบัตรประจำตัวประชาชนและใบนัดหมายนี้มาแสดงที่เคาน์เตอร์เวชระเบียน</li>
                <li>กรณีไม่สามารถมาตามนัดหมายได้ กรุณาติดต่อยกเลิกหรือเลื่อนนัดล่วงหน้า 1 วัน</li>
              </ul>
            </div>

            {/* QR Code Sim */}
            <div className="text-center shrink-0">
              <div className="w-18 h-18 bg-white border border-slate-300 rounded-lg p-1.5 flex flex-col items-center justify-center shadow-xs">
                <QrCode className="w-11 h-11 text-slate-800" />
                <span className="text-[9px] font-mono font-bold text-slate-500 mt-0.5">CHECK-IN</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">สแกนจุดคัดกรอง</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-500">
            สามารถพิมพ์เอกสารนี้หรือบันทึกภาพหน้าจอเพื่อเป็นหลักฐาน
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              พิมพ์ใบนัดหมาย
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
