import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  AlertTriangle,
  Building2,
  Stethoscope,
  Clock,
  ArrowRight,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Info,
  CalendarPlus,
} from 'lucide-react';
import { AIRecommendationResult } from '../types';

interface AIRecommendationViewProps {
  onSelectForBooking: (recommendation: AIRecommendationResult) => void;
}

const COMMON_SYMPTOM_PRESETS = [
  { label: 'ปวดท้องรุนแรงด้านขวา', text: 'มีอาการปวดท้องรุนแรงเฉียบพลันบริเวณด้านขวาล่าง มีไข้ต่ำๆ และคลื่นไส้' },
  { label: 'แน่นหน้าอก ใจสั่น', text: 'รู้สึกเจ็บแน่นหน้าอกเหมือนมีอะไรมากดทับ หายใจไม่สะดวก ใจสั่นเวลาเหนื่อย' },
  { label: 'ปวดข้อเข่าตึงขยับยาก', text: 'ปวดข้อเข่าข้างซ้าย มีอาการบวมตึงเวลาลงน้ำหนักหรือก้าวขึ้นบันได' },
  { label: 'มีผื่นคันแดงกระจาย', text: 'มีผื่นแดงคันขึ้นตามแขนและลำตัว เป็นมา 3 วัน ทายาแล้วยังไม่ยุบ' },
  { label: 'ตามัว มองเห็นภาพซ้อน', text: 'ตามัวลงอย่างรวดเร็ว มองเห็นภาพซ้อน แสบเคืองตาเวลาสู้แสง' },
  { label: 'ปวดฟันบวมเสียวฟัน', text: 'ปวดฟันกรามล่างซ้าย เหงือกบวมแดง เสียวฟันเวลารับประทานของเย็น' },
  { label: 'เด็กมีไข้สูง ไอ มีน้ำมูก', text: 'เด็กอายุ 4 ขวบ มีไข้สูง 38.5 องศา ไอมีเสมหะ หายใจครืดคราด ซึมลง' },
  { label: 'เครียด นอนไม่หลับเรื้อรัง', text: 'มีภาวะวิตกกังวลสูง นอนไม่หลับติดต่อกันเกิน 2 สัปดาห์ รู้สึกอ่อนเพลียหมดพลัง' },
];

export const AIRecommendationView: React.FC<AIRecommendationViewProps> = ({
  onSelectForBooking,
}) => {
  const [symptoms, setSymptoms] = useState('');
  const [patientAge, setPatientAge] = useState<number | ''>('');
  const [patientGender, setPatientGender] = useState<string>('ไม่ระบุ');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIRecommendationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRecommend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!symptoms.trim()) {
      setErrorMsg('กรุณาระบุอาการหรือคำอธิบายที่ต้องการปรึกษา');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/recommend-department', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms: symptoms.trim(),
          patientAge: patientAge ? Number(patientAge) : undefined,
          patientGender: patientGender !== 'ไม่ระบุ' ? patientGender : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ AI ได้');
      }

      const data: AIRecommendationResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Error fetching AI recommendation:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการประมวลผลคำแนะนำแผนก กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPreset = (text: string) => {
    setSymptoms(text);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Introduction Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
                  AI แนะนำแผนกตรวจรักษา
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                ระบบปัญญาประดิษฐ์ช่วยวิเคราะห์อาการและแนะนำแผนกที่เหมาะสมในโรงพยาบาล
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>ระบบเพื่อการศึกษา ไม่ใช่วินิจฉัยโรค</span>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleRecommend} className="mt-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Symptoms Chips */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              ตัวอย่างอาการที่พบบ่อย (คลิกเพื่อเลือกทันที):
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOM_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleQuickPreset(preset.text)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 font-medium transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              อธิบายอาการ หรือความต้องการในการรับบริการตรวจ <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="กรุณาพิมพ์อาการของคุณ เช่น ปวดศีรษะข้างเดียวอย่างรุนแรงมา 2 วัน คลื่นไส้ หรือ ปวดบริเวณข้อเท้าหลังเล่นฟุตบอล..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Optional Age & Gender to refine AI Triage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 block">
                อายุผู้ป่วย (ปี - เพื่อช่วยพิจารณาแผนกเด็กหรือผู้สูงอายุ)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="เช่น 8 หรือ 45"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 block">
                เพศผู้ป่วย (เพื่อพิจารณาแผนกสูตินรีเวช ฯลฯ)
              </label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              >
                <option value="ไม่ระบุ">ไม่ระบุ</option>
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={isLoading || !symptoms.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI กำลังวิเคราะห์อาการ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-sky-200" />
                  <span>วิเคราะห์และแนะนำแผนก</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* AI Recommendation Result Card */}
      {result && (
        <div className="bg-white rounded-2xl border-2 border-blue-500 shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Result Banner */}
          <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-blue-600 p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-sky-100 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-200" />
                  ผลการวิเคราะห์แนะนำแผนก
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-sans">
                  {result.recommendedDepartment}
                </h3>
                <p className="text-xs text-sky-100 mt-1">
                  ความเชี่ยวชาญแนะนำ: {result.matchingDoctorsSpecialty}
                </p>
              </div>

              {/* Urgency Badge */}
              <div className="shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold ${
                    result.urgency.includes('ฉุกเฉิน')
                      ? 'bg-rose-500 text-white border border-rose-300'
                      : result.urgency.includes('เร่งด่วน')
                      ? 'bg-amber-400 text-slate-900 border border-amber-200'
                      : 'bg-emerald-500 text-white border border-emerald-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  ระดับความเร่งด่วน: {result.urgency}
                </span>
              </div>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Explanation */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" />
                เหตุผลและคำอธิบายทางการแพทย์เบื้องต้น (Explanation in Thai)
              </h4>
              <p className="text-sm sm:text-base text-slate-800 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                {result.explanation}
              </p>
            </div>

            {/* Preparation Tips */}
            {result.preparationTips && result.preparationTips.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  คำแนะนำในการเตรียมตัวก่อนพบแพทย์ (Preparation Tips)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {result.preparationTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medical Disclaimer Alert */}
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">ข้อควรทราบและคำเตือนทางการแพทย์:</span>
                <p>{result.disclaimer}</p>
              </div>
            </div>

            {/* Billing / Provider Notice if present */}
            {result.notice && (
              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>{result.notice}</span>
              </div>
            )}

            {/* Action to book immediately */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                ประมวลผลโดย: {result.source === 'gemini' ? 'Google Gemini 3.8 Flash' : 'ระบบคัดกรองเบื้องต้น'}
              </span>

              <button
                type="button"
                onClick={() => onSelectForBooking(result)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>ส่งต่อไปยังแบบฟอร์มนัดหมายแพทย์ทันที</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
