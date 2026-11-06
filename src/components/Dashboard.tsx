import React from 'react';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Clock3,
  XCircle,
  TrendingUp,
  Stethoscope,
  Sparkles,
  ArrowRight,
  CalendarCheck,
  Building2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Appointment, Department, Doctor } from '../types';

interface DashboardProps {
  appointments: Appointment[];
  doctors: Doctor[];
  departments: Department[];
  setActiveTab: (tab: string) => void;
  onViewSlip: (appointment: Appointment) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  appointments,
  doctors,
  departments,
  setActiveTab,
  onViewSlip,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Stats calculation
  const totalAppointments = appointments.length;
  const todayAppointments = appointments.filter((a) => a.appointmentDate === todayStr);
  const pendingCount = appointments.filter((a) => a.status === 'รอรับการตรวจ').length;
  const confirmedCount = appointments.filter((a) => a.status === 'ยืนยันแล้ว').length;
  const completedCount = appointments.filter((a) => a.status === 'เสร็จสิ้น').length;
  const cancelledCount = appointments.filter((a) => a.status === 'ยกเลิก').length;

  // Department statistics
  const deptCounts: Record<string, number> = {};
  appointments.forEach((a) => {
    const dept = a.departmentName || 'ไม่ระบุแผนก';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });

  const deptStatsList = Object.entries(deptCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalAppointments > 0 ? Math.round((count / totalAppointments) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Status breakdown for chart
  const statusConfig = [
    {
      label: 'ยืนยันแล้ว',
      count: confirmedCount,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      bgLight: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    {
      label: 'รอรับการตรวจ',
      count: pendingCount,
      color: 'bg-amber-500',
      textColor: 'text-amber-700',
      bgLight: 'bg-amber-50',
      border: 'border-amber-200',
    },
    {
      label: 'เสร็จสิ้น',
      count: completedCount,
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgLight: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      label: 'ยกเลิก',
      count: cancelledCount,
      color: 'bg-rose-500',
      textColor: 'text-rose-700',
      bgLight: 'bg-rose-50',
      border: 'border-rose-200',
    },
  ];

  // Today's or recent appointments list
  const recentAppointments = [...appointments]
    .sort((a, b) => {
      // Sort by date desc, then time
      return b.appointmentDate.localeCompare(a.appointmentDate);
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 p-6 sm:p-8 text-white shadow-lg shadow-blue-500/15">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-sm text-sky-100 mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              Smart Hospital Management System
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              ระบบนัดหมายแพทย์และบริหารคลินิกโรงพยาบาล
            </h1>
            <p className="mt-2 text-sm text-sky-100 leading-relaxed">
              ยินดีต้อนรับสู่ระบบบริหารจัดการคิวนัดหมายผู้ป่วย พร้อมระบบปัญญาประดิษฐ์ (Gemini AI)
              ที่ช่วยคัดกรองอาการและแนะนำแผนกตรวจได้อย่างรวดเร็ว แม่นยำ และปลอดภัย
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('appointment-form')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm shadow-md hover:bg-sky-50 transition-all cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 text-blue-600" />
              จองนัดหมายใหม่
            </button>
            <button
              onClick={() => setActiveTab('ai-recommend')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sky-500/30 hover:bg-sky-500/40 text-white font-semibold text-sm border border-white/25 backdrop-blur-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-sky-200" />
              AI แนะนำแผนก
            </button>
          </div>
        </div>

        {/* Ambient background blur elements */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/3 -top-10 w-48 h-48 bg-sky-300/20 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Appointments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              นัดหมายทั้งหมด
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-slate-900 font-sans tracking-tight">
              {totalAppointments}
            </span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">รายการ</span>
          </div>
          <div className="mt-2 text-xs text-blue-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            ข้อมูลจริงจากระบบ Firestore
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              นัดหมายวันนี้
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-emerald-700 font-sans tracking-tight">
              {todayAppointments.length}
            </span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">คิวตรวจวันนี้</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            วันที่ {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
          </div>
        </div>

        {/* Confirmed / Ready */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ยืนยันแล้ว
            </span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-sky-700 font-sans tracking-tight">
              {confirmedCount}
            </span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">ราย</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            รอดำเนินการ: {pendingCount} ราย
          </div>
        </div>

        {/* Total Doctors */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              แพทย์ผู้ตรวจ
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-indigo-700 font-sans tracking-tight">
              {doctors.length}
            </span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">ท่าน</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            ครอบคลุม {departments.length} แผนก
          </div>
        </div>
      </div>

      {/* Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Statistics (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                สถิติการนัดหมายจำแนกตามแผนก (Department Statistics)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                สัดส่วนผู้ป่วยที่นัดหมายตรวจในแต่ละแผนกของโรงพยาบาล
              </p>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              ดูรายงานเต็ม <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {deptStatsList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              ยังไม่มีข้อมูลการนัดหมายในระบบ
            </div>
          ) : (
            <div className="space-y-4">
              {deptStatsList.slice(0, 6).map((dept, index) => (
                <div key={dept.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 inline-flex items-center justify-center text-[10px] font-bold">
                        {index + 1}
                      </span>
                      {dept.name}
                    </span>
                    <span className="text-slate-900 font-semibold">
                      {dept.count} คิว ({dept.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-600 to-sky-400"
                      style={{ width: `${Math.max(dept.percentage, 5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appointment Status Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                สถานะการนัดหมาย (Appointment Status)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              การกระจายตัวของสถานะคิวตรวจทั้งหมดในระบบ
            </p>

            {/* Visual Progress Bar representation */}
            {totalAppointments > 0 ? (
              <div className="space-y-4">
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  {statusConfig.map((item) => {
                    const pct = totalAppointments > 0 ? (item.count / totalAppointments) * 100 : 0;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={item.label}
                        className={`${item.color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                        title={`${item.label}: ${item.count} ราย`}
                      />
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {statusConfig.map((item) => {
                    const pct =
                      totalAppointments > 0 ? Math.round((item.count / totalAppointments) * 100) : 0;
                    return (
                      <div
                        key={item.label}
                        className={`p-3 rounded-xl border ${item.border} ${item.bgLight} flex flex-col justify-between`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                          <span className={`text-xs font-semibold ${item.textColor}`}>
                            {item.label}
                          </span>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-lg font-bold text-slate-900">{item.count}</span>
                          <span className="text-xs font-medium text-slate-500">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                ไม่มีข้อมูลสถานะ
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>อัปเดตแบบเรียลไทม์จาก Firestore</span>
            <span className="font-semibold text-slate-700">ทั้งหมด {totalAppointments} รายการ</span>
          </div>
        </div>
      </div>

      {/* Recent Appointments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-blue-600" />
              รายการนัดหมายล่าสุด (Recent Appointments)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              คิวนัดหมายที่เพิ่มเข้ามาหรือใกล้ถึงกำหนดตรวจ
            </p>
          </div>
          <button
            onClick={() => setActiveTab('appointments')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            จัดการทั้งหมด ({totalAppointments}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">ผู้ป่วย</th>
                <th className="py-3 px-4">แผนกตรวจ</th>
                <th className="py-3 px-4">แพทย์ผู้ตรวจ</th>
                <th className="py-3 px-4">วันที่นัด</th>
                <th className="py-3 px-4">เวลา</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
              {recentAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    ยังไม่มีรายการนัดหมายในระบบ คลิก "จองนัดหมายใหม่" เพื่อเริ่มต้น
                  </td>
                </tr>
              ) : (
                recentAppointments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.patientName}</div>
                      <div className="text-[11px] text-slate-400">{item.patientPhone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{item.departmentName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{item.doctorName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-600">{item.appointmentDate}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{item.appointmentTime} น.</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          item.status === 'ยืนยันแล้ว'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'รอรับการตรวจ'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : item.status === 'เสร็จสิ้น'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onViewSlip(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        title="ดูใบนัดหมาย"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        ใบนัด
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
