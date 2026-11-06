import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { NavigationTabs } from './components/NavigationTabs';
import { Dashboard } from './components/Dashboard';
import { AppointmentForm } from './components/AppointmentForm';
import { AIRecommendationView } from './components/AIRecommendationView';
import { DoctorManagement } from './components/DoctorManagement';
import { AppointmentManagement } from './components/AppointmentManagement';
import { ReportsView } from './components/ReportsView';
import { AppointmentSlipModal } from './components/AppointmentSlipModal';

import {
  Department,
  Doctor,
  Patient,
  Appointment,
  AIRecommendationResult,
} from './types';
import {
  seedInitialDataIfEmpty,
  fetchDepartments,
  fetchDoctors,
  fetchPatients,
  fetchAppointments,
  subscribeToDepartments,
  subscribeToDoctors,
  subscribeToPatients,
  subscribeToAppointments,
} from './services/dbService';
import {
  Activity,
  HeartPulse,
  ShieldAlert,
  Building2,
  CheckCircle2,
  Info,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Firestore Data State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Cross-component interaction state
  const [prefilledRecommendation, setPrefilledRecommendation] =
    useState<AIRecommendationResult | null>(null);
  const [selectedSlipAppointment, setSelectedSlipAppointment] =
    useState<Appointment | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial Data Fetching, Seeding, and Real-Time Listeners
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        setIsLoadingData(true);
        // Ensure initial fictional sample collections in Firestore
        await seedInitialDataIfEmpty();

        const [depts, docs, pats, appts] = await Promise.all([
          fetchDepartments(),
          fetchDoctors(),
          fetchPatients(),
          fetchAppointments(),
        ]);

        if (isMounted) {
          if (depts) setDepartments(depts);
          if (docs) setDoctors(docs);
          if (pats) setPatients(pats);
          if (appts) setAppointments(appts);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }

    init();

    // Setup real-time listeners for all 4 Firestore collections
    const unsubAppointments = subscribeToAppointments((updatedList) => {
      if (isMounted) setAppointments(updatedList);
    });

    const unsubDoctors = subscribeToDoctors((updatedDocs) => {
      if (isMounted) setDoctors(updatedDocs);
    });

    const unsubDepartments = subscribeToDepartments((updatedDepts) => {
      if (isMounted) setDepartments(updatedDepts);
    });

    const unsubPatients = subscribeToPatients((updatedPats) => {
      if (isMounted) setPatients(updatedPats);
    });

    return () => {
      isMounted = false;
      unsubAppointments();
      unsubDoctors();
      unsubDepartments();
      unsubPatients();
    };
  }, []);

  // Show auto-dismissing toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Handle handoff from AI recommendation to appointment form
  const handleSelectRecommendationForBooking = (
    recommendation: AIRecommendationResult
  ) => {
    setPrefilledRecommendation(recommendation);
    setActiveTab('appointment-form');
    showToast(`เตรียมข้อมูลจาก AI: แนะนำ "${recommendation.recommendedDepartment}"`);
  };

  // Handle appointment creation success
  const handleAppointmentCreated = (newAppointment: Appointment) => {
    showToast(`บันทึกการนัดหมายสำเร็จ! กำหนดตรวจวันที่ ${newAppointment.appointmentDate}`);
  };

  // Manual refresh doctors if needed
  const handleRefreshDoctors = async () => {
    try {
      const refreshedDocs = await fetchDoctors();
      if (refreshedDocs) setDoctors(refreshedDocs);
    } catch (err) {
      console.warn(err);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(
    (a) => a.appointmentDate === todayStr
  );
  const pendingAppointments = appointments.filter(
    (a) => a.status === 'รอรับการตรวจ'
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-4 border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hospital Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        todayCount={todayAppointments.length}
      />

      {/* 6 Core Tabs Navigation */}
      <NavigationTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingAppointments.length}
        totalAppointments={appointments.length}
        totalDoctors={doctors.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isLoadingData ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-500 gap-3">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">กำลังเชื่อมต่อฐานข้อมูล Cloud Firestore...</p>
          </div>
        ) : (
          <>
            {/* Page 1: Dashboard */}
            {activeTab === 'dashboard' && (
              <Dashboard
                appointments={appointments}
                doctors={doctors}
                departments={departments}
                setActiveTab={setActiveTab}
                onViewSlip={(appt) => setSelectedSlipAppointment(appt)}
              />
            )}

            {/* Page 2: Patient Appointment Form */}
            {activeTab === 'appointment-form' && (
              <AppointmentForm
                departments={departments}
                doctors={doctors}
                patients={patients}
                prefilledRecommendation={prefilledRecommendation}
                onSuccess={handleAppointmentCreated}
                onCancel={() => setActiveTab('dashboard')}
                onGoToAppointments={() => setActiveTab('appointments')}
                onViewSlip={(appt) => setSelectedSlipAppointment(appt)}
              />
            )}

            {/* Page 3: AI Department Recommendation */}
            {activeTab === 'ai-recommend' && (
              <AIRecommendationView
                onSelectForBooking={handleSelectRecommendationForBooking}
              />
            )}

            {/* Page 4: Doctor Management */}
            {activeTab === 'doctors' && (
              <DoctorManagement
                doctors={doctors}
                departments={departments}
                onRefresh={handleRefreshDoctors}
                onShowToast={showToast}
              />
            )}

            {/* Page 5: Appointment Management */}
            {activeTab === 'appointments' && (
              <AppointmentManagement
                appointments={appointments}
                doctors={doctors}
                departments={departments}
                onOpenCreateForm={() => setActiveTab('appointment-form')}
                onViewSlip={(appt) => setSelectedSlipAppointment(appt)}
                onShowToast={showToast}
              />
            )}

            {/* Page 6: Reports */}
            {activeTab === 'reports' && (
              <ReportsView
                appointments={appointments}
                departments={departments}
                doctors={doctors}
              />
            )}
          </>
        )}
      </main>

      {/* Printable / Downloadable Appointment Slip Modal */}
      {selectedSlipAppointment && (
        <AppointmentSlipModal
          appointment={selectedSlipAppointment}
          doctor={doctors.find((d) => d.id === selectedSlipAppointment.doctorId)}
          onClose={() => setSelectedSlipAppointment(null)}
        />
      )}

      {/* Hospital Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              โรงพยาบาลสุขภาวะพัฒน์ (AI Doctor Appointment System)
            </span>
            <span>•</span>
            <span>ระบบฐานข้อมูล Cloud Firestore</span>
            <span>•</span>
            <span>Google Gemini AI Engine</span>
          </div>
          <p className="text-[11px] text-slate-400 max-w-2xl mx-auto">
            คำเตือน: ระบบนี้จัดทำขึ้นเพื่อการสาธิตทางวิชาการและการศึกษาเท่านั้น ข้อมูลผู้ป่วยทั้งหมดเป็นข้อมูลสมมติ
            ห้ามนำคำแนะนำของระบบ AI ไปใช้วินิจฉัยโรคจริงโดยไม่ผ่านการตรวจจากแพทย์ผู้เชี่ยวชาญ
          </p>
          <p className="text-[10px] text-slate-400">
            © {new Date().getFullYear()} AI Doctor Appointment System • All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
