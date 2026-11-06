import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Building2,
  PieChart,
  Download,
  Printer,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  FileSpreadsheet,
} from 'lucide-react';
import { Appointment, Department, Doctor } from '../types';

interface ReportsViewProps {
  appointments: Appointment[];
  departments: Department[];
  doctors: Doctor[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  appointments,
  departments,
  doctors,
}) => {
  const [selectedReportType, setSelectedReportType] = useState<
    'daily' | 'department' | 'status'
  >('daily');
  const [targetDate, setTargetDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ทั้งหมด');

  // Stats
  const total = appointments.length;
  const confirmed = appointments.filter((a) => a.status === 'ยืนยันแล้ว').length;
  const pending = appointments.filter((a) => a.status === 'รอรับการตรวจ').length;
  const completed = appointments.filter((a) => a.status === 'เสร็จสิ้น').length;
  const cancelled = appointments.filter((a) => a.status === 'ยกเลิก').length;

  const confirmedRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  // Daily report appointments
  const dailyAppointments = appointments.filter(
    (a) => a.appointmentDate === targetDate
  );

  // Department report aggregations
  const deptAggregation: Record<
    string,
    { count: number; confirmed: number; cancelled: number; doctorsCount: number }
  > = {};

  departments.forEach((dept) => {
    const docsInDept = doctors.filter((d) => d.departmentId === dept.id).length;
    deptAggregation[dept.name] = {
      count: 0,
      confirmed: 0,
      cancelled: 0,
      doctorsCount: docsInDept,
    };
  });

  appointments.forEach((appt) => {
    const deptName = appt.departmentName || 'ไม่ระบุ';
    if (!deptAggregation[deptName]) {
      deptAggregation[deptName] = {
        count: 0,
        confirmed: 0,
        cancelled: 0,
        doctorsCount: 0,
      };
    }
    deptAggregation[deptName].count += 1;
    if (appt.status === 'ยืนยันแล้ว' || appt.status === 'เสร็จสิ้น') {
      deptAggregation[deptName].confirmed += 1;
    }
    if (appt.status === 'ยกเลิก') {
      deptAggregation[deptName].cancelled += 1;
    }
  });

  const deptReportList = Object.entries(deptAggregation)
    .map(([name, data]) => ({
      name,
      ...data,
      pct: total > 0 ? Math.round((data.count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'รหัสการนัดหมาย',
      'ชื่อผู้ป่วย',
      'เบอร์โทรศัพท์',
      'อายุ',
      'แผนกตรวจ',
      'แพทย์ผู้ตรวจ',
      'วันที่นัดหมาย',
      'เวลา',
      'สถานะ',
      'เหตุผลการนัดหมาย',
    ];

    const rows = appointments.map((a) => [
      a.id,
      `"${a.patientName}"`,
      `"${a.patientPhone}"`,
      a.patientAge || '',
      `"${a.departmentName}"`,
      `"${a.doctorName}"`,
      a.appointmentDate,
      `"${a.appointmentTime}"`,
      `"${a.status}"`,
      `"${(a.reason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Hospital_Appointments_Report_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            รายงานและสถิติข้อมูลการนัดหมาย (Hospital Reports)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            สรุปข้อมูลสถิติจากฐานข้อมูล Firestore แบบเรียลไทม์ พร้อมการดาวน์โหลดและพิมพ์รายงาน
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* Report Types Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSelectedReportType('daily')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            selectedReportType === 'daily'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>รายงานนัดหมายประจำวัน (Daily)</span>
        </button>

        <button
          onClick={() => setSelectedReportType('department')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            selectedReportType === 'department'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>รายงานแยกตามแผนก (Department)</span>
        </button>

        <button
          onClick={() => setSelectedReportType('status')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            selectedReportType === 'status'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>รายงานสถานะการนัดหมาย (Status)</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">รวมการนัดหมายทั้งหมด</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{total} คิว</span>
          <span className="text-[11px] text-blue-600 mt-1 block">บันทึกใน Firestore</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">อัตราการยืนยันนัดตรวจ</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">{confirmedRate}%</span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {confirmed + completed} จาก {total} คิว
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">รอดำเนินการตรวจ</span>
          <span className="text-2xl font-bold text-amber-700 mt-1 block">{pending} ราย</span>
          <span className="text-[11px] text-slate-500 mt-1 block">รอเจ้าหน้าที่ยืนยัน</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">อัตราการยกเลิกนัด</span>
          <span className="text-2xl font-bold text-rose-700 mt-1 block">{cancellationRate}%</span>
          <span className="text-[11px] text-slate-500 mt-1 block">ยกเลิก {cancelled} ราย</span>
        </div>
      </div>

      {/* 1. Daily Report Tab */}
      {selectedReportType === 'daily' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  เลือกวันที่ต้องการตรวจสอบรายงาน
                </h3>
                <p className="text-xs text-slate-500">
                  แสดงรายการคิวตรวจและแพทย์ผู้ออกตรวจในวันดังกล่าว
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-medium focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                onClick={() => setTargetDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                วันนี้
              </button>
            </div>
          </div>

          {/* Daily Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs sm:text-sm text-slate-800">
                รายการนัดหมายประจำวันที่ {targetDate} ({dailyAppointments.length} คิว)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                    <th className="py-3 px-4">เวลาตรวจ</th>
                    <th className="py-3 px-4">ผู้ป่วย</th>
                    <th className="py-3 px-4">เบอร์โทรศัพท์</th>
                    <th className="py-3 px-4">แผนก</th>
                    <th className="py-3 px-4">แพทย์ผู้ตรวจ</th>
                    <th className="py-3 px-4">อาการ / เหตุผล</th>
                    <th className="py-3 px-4">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dailyAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        ไม่มีการนัดหมายในวันที่ {targetDate}
                      </td>
                    </tr>
                  ) : (
                    dailyAppointments.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-blue-700">
                          {item.appointmentTime} น.
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.patientName}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{item.patientPhone}</td>
                        <td className="py-3 px-4">{item.departmentName}</td>
                        <td className="py-3 px-4">{item.doctorName}</td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600">{item.reason}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.status === 'ยืนยันแล้ว'
                                ? 'bg-emerald-50 text-emerald-700'
                                : item.status === 'รอรับการตรวจ'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Department Report Tab */}
      {selectedReportType === 'department' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              สรุปสถิติและภาระงานแยกตามแผนกการรักษา
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deptReportList.map((d) => (
                <div
                  key={d.name}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900">{d.name}</span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                        {d.count} คิว ({d.pct}%)
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${Math.max(d.pct, 3)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-slate-400 block">แพทย์ประจำ:</span>
                      <span className="font-semibold text-slate-800">{d.doctorsCount} ท่าน</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">ตรวจแล้ว/ยืนยัน:</span>
                      <span className="font-semibold text-emerald-700">{d.confirmed} คิว</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">ยกเลิก:</span>
                      <span className="font-semibold text-rose-700">{d.cancelled} คิว</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Status Report Tab */}
      {selectedReportType === 'status' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              รายงานสถานะการดำเนินการนัดหมาย
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-2" />
                <span className="text-xs font-bold text-emerald-800 uppercase">ยืนยันแล้ว</span>
                <span className="text-3xl font-bold text-emerald-950 block mt-1">{confirmed} คิว</span>
                <p className="text-[11px] text-emerald-700 mt-2">
                  พร้อมเข้ารับการตรวจตามเวลานัดหมาย
                </p>
              </div>

              <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200">
                <Clock className="w-6 h-6 text-amber-600 mb-2" />
                <span className="text-xs font-bold text-amber-800 uppercase">รอรับการตรวจ</span>
                <span className="text-3xl font-bold text-amber-950 block mt-1">{pending} คิว</span>
                <p className="text-[11px] text-amber-700 mt-2">
                  รอยืนยันสิทธิ์หรือคัดกรองเบื้องต้น
                </p>
              </div>

              <div className="p-5 bg-blue-50 rounded-2xl border border-blue-200">
                <TrendingUp className="w-6 h-6 text-blue-600 mb-2" />
                <span className="text-xs font-bold text-blue-800 uppercase">เสร็จสิ้นแล้ว</span>
                <span className="text-3xl font-bold text-blue-950 block mt-1">{completed} คิว</span>
                <p className="text-[11px] text-blue-700 mt-2">
                  ตรวจรักษาและรับยากลับบ้านเรียบร้อย
                </p>
              </div>

              <div className="p-5 bg-rose-50 rounded-2xl border border-rose-200">
                <XCircle className="w-6 h-6 text-rose-600 mb-2" />
                <span className="text-xs font-bold text-rose-800 uppercase">ยกเลิกนัดหมาย</span>
                <span className="text-3xl font-bold text-rose-950 block mt-1">{cancelled} คิว</span>
                <p className="text-[11px] text-rose-700 mt-2">
                  ผู้ป่วยขอเลื่อนหรือยกเลิกการนัดตรวจ
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
