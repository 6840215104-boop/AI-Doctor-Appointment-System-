/**
 * Production / Full-stack Express server for AI Doctor Appointment System
 */
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { recommendDepartmentWithGemini } from './src/server/aiRecommendation.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API route for Gemini AI department recommendation
app.post('/api/recommend-department', async (req, res) => {
  try {
    const { symptoms, patientAge, patientGender } = req.body;
    if (!symptoms || typeof symptoms !== 'string') {
      res.status(400).json({ error: 'กรุณาระบุอาการของผู้ป่วย' });
      return;
    }
    const result = await recommendDepartmentWithGemini({
      symptoms,
      patientAge: patientAge ? Number(patientAge) : undefined,
      patientGender: patientGender || undefined,
    });
    res.json(result);
  } catch (error) {
    console.error('Error handling AI recommendation:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการประมวลผลคำแนะนำแผนก' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve static frontend build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI Doctor Appointment System running on port ${PORT}`);
});
