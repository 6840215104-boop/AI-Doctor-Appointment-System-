/**
 * Server-side AI Department Recommendation Service
 * Uses Google Gemini API (@google/genai) securely on the backend
 */
import { GoogleGenAI, Type } from '@google/genai';

export interface AIRecommendationRequest {
  symptoms: string;
  patientAge?: number;
  patientGender?: string;
}

export interface AIRecommendationResponse {
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

const DISCLAIMER_TEXT =
  'คำเตือนทางการแพทย์: ระบบนี้เป็นระบบ AI แนะนำแผนกเพื่อการศึกษาและการจัดคิวเท่านั้น ไม่ใช่การวินิจฉัยโรคหรือการจ่ายยา หากผู้ป่วยมีภาวะวิกฤต เจ็บแน่นหน้าอกรุนแรง หายใจไม่ออก หรือหมดสติ กรุณาติดต่อแผนกฉุกเฉิน (ER) หรือโทร 1669 ทันที';

/**
 * Fallback rule engine when API key is not provided or network is offline
 */
export function getRuleBasedRecommendation(
  req: AIRecommendationRequest
): AIRecommendationResponse {
  const text = (req.symptoms || '').toLowerCase();
  const age = Number(req.patientAge) || 30;

  if (age <= 14 && !text.includes('ฟัน') && !text.includes('กระดูกหัก')) {
    return {
      recommendedDepartment: 'แผนกกุมารเวชกรรม (Pediatrics)',
      departmentCode: 'PEDIATRICS',
      urgency: text.includes('ชัก') || text.includes('ไข้สูง') ? 'เร่งด่วน (Urgent)' : 'ปกติ (Routine)',
      explanation:
        'เนื่องจากผู้ป่วยมีอายุน้อยกว่า 15 ปี แนะนำให้พบกุมารแพทย์ผู้เชี่ยวชาญด้านสุขภาพและการเจริญเติบโตของเด็กโดยเฉพาะ เพื่อการตรวจรักษาที่เหมาะสมกับสรีรวิทยาของเด็ก',
      matchingDoctorsSpecialty: 'กุมารแพทย์ทั่วไปและกุมารเวชศาสตร์เฉพาะทาง',
      preparationTips: [
        'นำสมุดบันทึกการรับวัคซีนของเด็กมาด้วย',
        'บันทึกประวัติการแพ้ยาหรือนมของเด็ก',
        'เตรียมของเล่นหรือนมขวดที่เด็กคุ้นเคย',
      ],
      disclaimer: DISCLAIMER_TEXT,
      source: 'rule_engine',
    };
  }

  if (text.includes('ฟัน') || text.includes('เหงือก') || text.includes('ขูดหินปูน') || text.includes('อุดฟัน')) {
    return {
      recommendedDepartment: 'แผนกทันตกรรม (Dentistry)',
      departmentCode: 'DENTAL',
      urgency: 'ปกติ (Routine)',
      explanation:
        'อาการเกี่ยวกับช่องปาก ฟัน และเหงือก เหมาะสำหรับการตรวจสุขภาพช่องปากและรักษาโดยทันตแพทย์',
      matchingDoctorsSpecialty: 'ทันตแพทย์ทั่วไปและทันตกรรมเฉพาะทาง',
      preparationTips: [
        'แปรงฟันและทำความสะอาดช่องปากก่อนเข้ารับบริการ',
        'แจ้งประวัติโรคประจำตัวและการรับประทานยาละลายลิ่มเลือด',
      ],
      disclaimer: DISCLAIMER_TEXT,
      source: 'rule_engine',
    };
  }

  if (text.includes('ตา') || text.includes('มองไม่ชัด') || text.includes('ตามัว') || text.includes('เคืองตา') || text.includes('ต้อ')) {
    return {
      recommendedDepartment: 'แผนกจักษุวิทยา (Ophthalmology)',
      departmentCode: 'OPHTHALMOLOGY',
      urgency: text.includes('ตาบอด') || text.includes('สารเคมี') ? 'ฉุกเฉิน (Emergency)' : 'ปกติ (Routine)',
      explanation:
        'อาการมองเห็นภาพซ้อน ตามัว เคืองตา หรือปัญหาการมองเห็น แนะนำตรวจวินิจฉัยด้วยอุปกรณ์ตรวจตาเฉพาะทางโดยจักษุแพทย์',
      matchingDoctorsSpecialty: 'จักษุแพทย์ผู้เชี่ยวชาญด้านกระจกตาและจอประสาทตา',
      preparationTips: [
        'หลีกเลี่ยงการใส่คอนแทคเลนส์ในวันตรวจ',
        'เตรียมแว่นกันแดดและมีผู้ติดตาม กรณีแพทย์ต้องหยอดยาขยายม่านตา',
      ],
      disclaimer: DISCLAIMER_TEXT,
      source: 'rule_engine',
    };
  }

  if (text.includes('กระดูก') || text.includes('ข้อ') || text.includes('เข่า') || text.includes('เอ็น') || text.includes('หลัง') || text.includes('เคล็ด')) {
    return {
      recommendedDepartment: 'แผนกออร์โธปิดิกส์ (Orthopedics - กระดูกและข้อ)',
      departmentCode: 'ORTHOPEDICS',
      urgency: text.includes('หัก') || text.includes('อุบัติเหตุ') ? 'เร่งด่วน (Urgent)' : 'ปกติ (Routine)',
      explanation:
        'อาการปวดข้อ ปวดหลัง เอ็นอักเสบ หรือปัญหาเกี่ยวกับระบบกล้ามเนื้อและโครงสร้างกระดูก เหมาะสำหรับการตรวจวินิจฉัยโดยแพทย์ออร์โธปิดิกส์',
      matchingDoctorsSpecialty: 'ศัลยแพทย์กระดูกและข้อ (Orthopedic Surgeon)',
      preparationTips: [
        'สวมใส่เสื้อผ้าที่สบายและขยับข้อต่อได้สะดวกในการตรวจ',
        'นำฟิล์มเอกซเรย์หรือผล MRI เดิมมาด้วยหากมี',
      ],
      disclaimer: DISCLAIMER_TEXT,
      source: 'rule_engine',
    };
  }

  if (text.includes('ผื่น') || text.includes('ผิว') || text.includes('คัน') || text.includes('สิว') || text.includes('ตุ่ม')) {
    return {
      recommendedDepartment: 'แผนกผิวหนัง (Dermatology)',
      departmentCode: 'DERMATOLOGY',
      urgency: 'ปกติ (Routine)',
      explanation:
        'อาการผื่นคัน ตุ่มน้ำ การแพ้ทางผิวหนัง หรือโรคผิวหนังทั่วไป แนะนำพบแพทย์ผิวหนังเพื่อตรวจลักษณะรอยโรคและระบุสาเหตุ',
      matchingDoctorsSpecialty: 'แพทย์ผู้เชี่ยวชาญด้านตจวิทยา (ผิวหนัง)',
      preparationTips: [
        'หลีกเลี่ยงการทายาสเตียรอยด์หรือเครื่องสำอางก่อนเข้าพบแพทย์',
        'ถ่ายรูปลักษณะผื่นในช่วงที่เห่อชัดเจนไว้ประกอบการตรวจ',
      ],
      disclaimer: DISCLAIMER_TEXT,
      source: 'rule_engine',
    };
  }

  if (text.includes('หู') || text.includes('คอ') || text.includes('จมูก') || text.includes('เสียงแหบ') || text.includes('เวียนหัว') || text.includes('ไซนัส')) {
    return {
      recommendedDepartment: 'แผนกโสต ศอ นาสิก (ENT - หู คอ จมูก)',
      departmentCode: 'ENT',
      urgency: 'ปกติ (Routine)',
      explanation:
        'อาการแน่นจมูก หูอื้อ มีเสียงในหู เจ็บคอเรื้อรัง หรือต่อมทอนซิลอักเสบ เหมาะกับการส่องกล้องตรวจเฉพาะทางโดยแพทย์ ENT',
      matchingDoctorsSpecialty: 'โสต ศอ นาสิกแพทย์ (ENT Specialist)',
      preparationTips: [
        'งดการแคะหูหรือใช้น้ำยาล้างจมูกก่อนเข้าตรวจ 2 ชั่วโมง',
        'จดบันทึกระยะเวลาที่เป็นและสิ่งกระตุ้นอาการแพ้',
      ],
      disclaimer: DISCLAIMER_TEXT,
      source: 'rule_engine',
    };
  }

  if (text.includes('แน่นหน้าอก') || text.includes('ใจสั่น') || text.includes('เหนื่อยง่าย') || text.includes('หัวใจ')) {
    return {
      recommendedDepartment: 'แผนกหัวใจและหลอดเลือด (Cardiology)',
      departmentCode: 'CARDIOLOGY',
      urgency: text.includes('แน่นหน้าอก') ? 'เร่งด่วน (Urgent)' : 'ปกติ (Routine)',
      explanation:
        'อาการใจสั่น หอบเหนื่อยง่าย หรือแน่นหน้าอก ควรได้รับการประเมินการทำงานของหัวใจ เช่น การตรวจคลื่นไฟฟ้าหัวใจ (EKG) โดยอายุรแพทย์โรคหัวใจ',
      matchingDoctorsSpecialty: 'อายุรแพทย์โรคหัวใจและหลอดเลือด (Cardiologist)',
      preparationTips: [
        'สวมเสื้อผ้าที่ถอดและใส่แผ่นวัดคลื่นไฟฟ้าหัวใจได้สะดวก',
        'นำยาโรคประจำตัวทุกชนิดมาให้แพทย์ตรวจดู',
      ],
      disclaimer: DISCLAIMER_TEXT,
      source: 'rule_engine',
    };
  }

  if (text.includes('เครียด') || text.includes('นอนไม่หลับ') || text.includes('วิตกกังวล') || text.includes('ซึมเศร้า')) {
    return {
      recommendedDepartment: 'แผนกจิตเวช (Psychiatry)',
      departmentCode: 'PSYCHIATRY',
      urgency: 'ปกติ (Routine)',
      explanation:
        'ภาวะความเครียด วิตกกังวล นอนไม่หลับเรื้อรัง หรืออารมณ์ซึมเศร้า แนะนำรับคำปรึกษาและประเมินสุขภาพใจโดยจิตแพทย์อย่างเป็นกันเองและปลอดภัย',
      matchingDoctorsSpecialty: 'จิตแพทย์และนักจิตวิทยาคลินิก',
      preparationTips: [
        'จดบันทึกอาการที่ส่งผลกระทบต่อชีวิตประจำวันและการนอนหลับ',
        'สามารถพาคนใกล้ชิดที่ไว้วางใจมาร่วมรับฟังและให้ข้อมูลได้',
      ],
      disclaimer: DISCLAIMER_TEXT,
      source: 'rule_engine',
    };
  }

  if (text.includes('แผล') || text.includes('ผ่าตัด') || text.includes('ก้อน') || text.includes('ไส้ติ่ง') || text.includes('ปวดท้องรุนแรง')) {
    return {
      recommendedDepartment: 'แผนกศัลยกรรม (General Surgery)',
      departmentCode: 'SURGERY',
      urgency: text.includes('ปวดท้องรุนแรง') ? 'เร่งด่วน (Urgent)' : 'ปกติ (Routine)',
      explanation:
        'อาการที่อาจต้องได้รับการวินิจฉัยว่ามีความจำเป็นต้องทำหัตถการหรือผ่าตัด เช่น ก้อนเนื้อ แผลเรื้อรัง หรือปวดท้องสงสัยไส้ติ่งอักเสบ แนะนำพบศัลยแพทย์',
      matchingDoctorsSpecialty: 'ศัลยแพทย์ทั่วไป (General Surgeon)',
      preparationTips: [
        'งดน้ำและอาหารล่วงหน้าอย่างน้อย 6-8 ชั่วโมง เผื่อกรณีจำเป็นต้องส่งตรวจอัลตราซาวด์หรือตรวจเลือด',
        'มีญาติหรือผู้ดูแลร่วมเดินทางมาด้วย',
      ],
      disclaimer: DISCLAIMER_TEXT,
      source: 'rule_engine',
    };
  }

  // Default to Internal Medicine
  return {
    recommendedDepartment: 'แผนกอายุรกรรม (Internal Medicine)',
    departmentCode: 'INTERNAL_MEDICINE',
    urgency: text.includes('ไข้สูง') || text.includes('หายใจเหนื่อย') ? 'เร่งด่วน (Urgent)' : 'ปกติ (Routine)',
    explanation:
      'อาการทั่วไป เช่น ไข้ ไอ อ่อนเพลีย ปวดท้อง จุกเสียด หรือโรคเรื้อรัง (เบาหวาน ความดัน) เหมาะสำหรับการตรวจวินิจฉัยและดูแลรักษาแบบองค์รวมโดยอายุรแพทย์',
    matchingDoctorsSpecialty: 'อายุรแพทย์ทั่วไป (Internal Medicine Physician)',
    preparationTips: [
      'นำซองยาเดิมหรือรายการยาทุกชนิดที่รับประทานอยู่มาด้วย',
      'หากมีนัดตรวจเลือดประจำปี ควรงดน้ำและอาหารหลัง 20:00 น. ก่อนวันตรวจ',
    ],
    disclaimer: DISCLAIMER_TEXT,
    source: 'rule_engine',
  };
}

/**
 * Handle recommendation via Gemini API (@google/genai)
 */
export async function recommendDepartmentWithGemini(
  req: AIRecommendationRequest
): Promise<AIRecommendationResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return getRuleBasedRecommendation(req);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `
คุณคือระบบ AI ผู้ช่วยคัดกรองและแนะนำแผนกตรวจของโรงพยาบาล (AI Hospital Department Triage Assistant)
สำหรับระบบนัดหมายแพทย์เพื่อการศึกษาและการสาธิต

หน้าที่ของคุณ:
1. วิเคราะห์อาการหรือคำอธิบายที่ผู้ป่วยระบุเป็นภาษาไทยอย่างละเอียด สุภาพ และรอบคอบ
2. แนะนำ "แผนกตรวจที่เหมาะสมที่สุด" ในโรงพยาบาล ได้แก่:
   - แผนกอายุรกรรม (Internal Medicine)
   - แผนกศัลยกรรม (General Surgery)
   - แผนกกุมารเวชกรรม (Pediatrics - หากอายุ < 15 ปีให้พิจารณาแผนกนี้เป็นพิเศษ)
   - แผนกสูตินรีเวชกรรม (Obstetrics & Gynecology - สำหรับสตรี การตั้งครรภ์ หรือโรคเฉพาะสตรี)
   - แผนกออร์โธปิดิกส์ (Orthopedics - ปัญหากระดูก ข้อ กล้ามเนื้อ เอ็น)
   - แผนกจักษุวิทยา (Ophthalmology - โรคตา ปัญหาการมองเห็น)
   - แผนกโสต ศอ นาสิก (ENT - หู คอ จมูก เสียงแหบ ไซนัส)
   - แผนกผิวหนัง (Dermatology - ผื่น คัน สิว รอยโรคผิวหนัง)
   - แผนกทันตกรรม (Dentistry - ช่องปาก ฟัน เหงือก)
   - แผนกจิตเวช (Psychiatry - สุขภาพจิต ความเครียด การนอนไม่หลับ)
   - แผนกเวชศาสตร์ฟื้นฟู (Physical Therapy & Rehabilitation)
   - แผนกหัวใจและหลอดเลือด (Cardiology - แน่นหน้าอก ใจสั่น เหนื่อยง่าย)

กฎข้อบังคับสำคัญ:
- ห้ามวินิจฉัยโรคเด็ดขาด (Do NOT diagnose specific disease names as a definitive verdict).
- ห้ามสั่งจ่ายยาหรือระบุชื่อยารักษาเด็ดขาด (Do NOT prescribe medicines).
- มุ่งเน้นการอธิบายว่าทำไมอาการนี้จึงควรพบแพทย์สาขาใด และอธิบายขั้นตอนเตรียมตัวพบแพทย์ที่เป็นประโยชน์
- ให้ข้อมูลเป็นภาษาไทยที่สุภาพ เข้าใจง่าย และสร้างความอุ่นใจ
- ระดับความเร่งด่วน: เลือกระหว่าง "ปกติ (Routine)", "เร่งด่วน (Urgent)", หรือ "ฉุกเฉิน (Emergency)"
`;

    const prompt = `
ข้อมูลผู้ป่วย:
- อาการ/เหตุผลการมาโรงพยาบาล: "${req.symptoms}"
- อายุ: ${req.patientAge ? `${req.patientAge} ปี` : 'ไม่ระบุ'}
- เพศ: ${req.patientGender || 'ไม่ระบุ'}

กรุณาวิเคราะห์และส่งกลับผลลัพธ์ในรูปแบบ JSON ตาม Schema ที่กำหนด
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedDepartment: {
              type: Type.STRING,
              description: 'ชื่อแผนกภาษาไทย เช่น แผนกอายุรกรรม (Internal Medicine)',
            },
            departmentCode: {
              type: Type.STRING,
              description:
                'รหัสแผนก เช่น INTERNAL_MEDICINE, SURGERY, PEDIATRICS, OBGYN, ORTHOPEDICS, OPHTHALMOLOGY, ENT, DERMATOLOGY, DENTAL, PSYCHIATRY, REHABILITATION, CARDIOLOGY',
            },
            urgency: {
              type: Type.STRING,
              description: 'ปกติ (Routine) หรือ เร่งด่วน (Urgent) หรือ ฉุกเฉิน (Emergency)',
            },
            explanation: {
              type: Type.STRING,
              description: 'คำอธิบายเหตุผลภาษาไทยที่แนะนำแผนกนี้อย่างสุภาพและชัดเจน โดยไม่อ้างว่าเป็นการวินิจฉัยโรค',
            },
            matchingDoctorsSpecialty: {
              type: Type.STRING,
              description: 'ความเชี่ยวชาญของแพทย์ในแผนกนี้ที่ตรงกับอาการ เช่น อายุรแพทย์โรคข้อ หรือ ศัลยแพทย์ทั่วไป',
            },
            preparationTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'คำแนะนำการเตรียมตัวก่อนพบแพทย์ 2-4 ข้อ',
            },
          },
          required: [
            'recommendedDepartment',
            'departmentCode',
            'urgency',
            'explanation',
            'matchingDoctorsSpecialty',
            'preparationTips',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      recommendedDepartment: parsed.recommendedDepartment || 'แผนกอายุรกรรม (Internal Medicine)',
      departmentCode: parsed.departmentCode || 'INTERNAL_MEDICINE',
      urgency: parsed.urgency || 'ปกติ (Routine)',
      explanation: parsed.explanation || 'แนะนำพบแพทย์เพื่อตรวจประเมินร่างกายอย่างละเอียด',
      matchingDoctorsSpecialty: parsed.matchingDoctorsSpecialty || 'แพทย์ผู้เชี่ยวชาญประจำแผนก',
      preparationTips: Array.isArray(parsed.preparationTips) && parsed.preparationTips.length > 0
        ? parsed.preparationTips
        : ['นำประวัติยาประจำตัวมาด้วย', 'พักผ่อนให้เพียงพอก่อนมาตรวจ'],
      disclaimer: DISCLAIMER_TEXT,
      source: 'gemini',
    };
  } catch (error: any) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const isFreeTierUnavailable =
      errMsg.includes('free tier is not available') ||
      errMsg.includes('PERMISSION_DENIED') ||
      errMsg.includes('billing');

    console.info(
      'Gemini API status note:',
      isFreeTierUnavailable
        ? 'Free tier unavailable for this Cloud project. Switched seamlessly to Thai Medical Triage Engine.'
        : errMsg
    );

    const fallback = getRuleBasedRecommendation(req);
    return {
      ...fallback,
      notice: isFreeTierUnavailable
        ? 'คำแนะนำจากระบบ AI คัดกรองทางการแพทย์ภาษาไทย (หากต้องการเปิดใช้ Gemini 3.8 Flash แบบออนไลน์สด สามารถตั้งค่า Billing หรือเลือก API Key ได้ที่เมนู Settings > Secrets)'
        : undefined,
    };
  }
}
