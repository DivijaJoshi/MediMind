const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/medimind');

// Prescription schema
const prescriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  patientName: String,
  diagnosis: String,
  medications: Array,
  reminders: Array,
  createdAt: { type: Date, default: Date.now }
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);

// Adherence schema
const adherenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
  medicine: String,
  scheduledTime: String,
  takenAt: { type: Date, default: Date.now },
  taken: { type: Boolean, default: true }
});

const Adherence = mongoose.model('Adherence', adherenceSchema);

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(cors());
app.use(express.json());

// Serve specific static files
app.get('/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app.js'));
});

app.get('/auth.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth.css'));
});

// Serve other static assets
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
    }
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// JWT middleware for protected routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    req.user = null;
    return next();
  }
  
  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

// Apply auth middleware to all API routes
app.use('/api', authenticateToken);

// Analyze prescription endpoint
app.post('/api/analyze', upload.single('prescription'), async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    console.log('📋 Processing prescription image...');
    
    const imageBuffer = await sharp(req.file.buffer)
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .sharpen()
      .normalize()
      .jpeg({ quality: 95 })
      .toBuffer();

    const base64Image = imageBuffer.toString('base64');
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash"
    });

    const prompt = `You are an expert medical prescription analyzer. Carefully examine this prescription image and extract ALL visible medical information.

Look for:
- Doctor's name, clinic, specialization
- Patient information
- Diagnosis or medical condition
- ALL medications with exact names, dosages, frequencies, durations
- Any special instructions or notes

Provide a comprehensive analysis in this EXACT JSON format:

{
  "extractedData": {
    "doctorInfo": {
      "name": "[Doctor's full name if visible]",
      "clinic": "[Clinic/hospital name if visible]",
      "specialization": "[Medical specialization if mentioned]"
    },
    "patientInfo": {
      "name": "[Patient name if visible]",
      "age": "[Age if mentioned]"
    },
    "diagnosis": "[Primary medical condition/diagnosis]",
    "medications": [
      {
        "name": "[Exact medication name]",
        "dosage": "[Exact dosage amount]",
        "frequency": "[How often to take]",
        "duration": "[How long to take]",
        "instructions": "[Special instructions]"
      }
    ],
    "additionalNotes": "[Any other important medical notes]"
  },
  "explanation": {
    "summary": "[2-3 sentence patient-friendly explanation]",
    "conditionExplanation": "[Simple explanation of the condition]",
    "medicationExplanations": [
      {
        "name": "[Medication name]",
        "purpose": "[What this medication does]",
        "importantNotes": "[Key safety information]"
      }
    ],
    "importantAdvice": [
      "[Important medical advice]",
      "[Lifestyle recommendations]",
      "[When to contact doctor]"
    ],
    "reminders": [
      {
        "medicine": "[Medication name]",
        "times": ["08:00", "20:00"],
        "withFood": true,
        "duration": "[Number of days]"
      }
    ]
  }
}

Extract REAL data from the prescription image. Return ONLY the JSON object.`;

    console.log('🤖 Sending to Gemini 2.5 Flash...');
    
    const result = await model.generateContent([{
      inlineData: { mimeType: 'image/jpeg', data: base64Image }
    }, { text: prompt }]);

    const responseText = result.response.text();
    console.log('📝 AI Response length:', responseText.length);
    
    let cleanedResponse = responseText.trim();
    cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    const jsonStart = cleanedResponse.indexOf('{');
    const jsonEnd = cleanedResponse.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No valid JSON found in AI response');
    }
    
    const jsonStr = cleanedResponse.substring(jsonStart, jsonEnd + 1);
    const analysisData = JSON.parse(jsonStr);
    
    console.log('✅ Successfully parsed prescription data');
    console.log('Medications found:', analysisData.extractedData?.medications?.length || 0);
    
    // Save to MongoDB
    const prescription = new Prescription({
      userId: req.user.id,
      patientName: analysisData.extractedData?.patientInfo?.name || 'Unknown',
      diagnosis: analysisData.extractedData?.diagnosis,
      medications: analysisData.extractedData?.medications,
      reminders: analysisData.explanation?.reminders
    });
    await prescription.save();

    res.json({
      success: true,
      extractedData: analysisData.extractedData || {},
      explanation: analysisData.explanation || {},
      prescriptionId: prescription._id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to analyze prescription',
      message: 'Please ensure the image is clear and try again.',
      details: error.message
    });
  }
});

// Mark medication as taken endpoint
app.post('/api/mark-taken', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const { medicine, time, prescriptionId } = req.body;
    
    if (!prescriptionId || prescriptionId === 'undefined') {
      return res.status(400).json({ success: false, error: 'Invalid prescription ID' });
    }
    
    const adherence = new Adherence({
      userId: req.user.id,
      prescriptionId,
      medicine,
      scheduledTime: time,
      takenAt: new Date(),
      taken: true
    });
    
    await adherence.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Mark taken error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sample prescription endpoint
app.post('/api/sample', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const sampleData = {
      doctorInfo: {
        name: "Dr. Sarah Johnson, MD",
        clinic: "City Medical Center",
        specialization: "General Practice"
      },
      patientInfo: {
        name: "John Smith",
        age: "35 years"
      },
      diagnosis: "Upper Respiratory Tract Infection with Acute Bronchitis",
      medications: [
        {
          name: "Paracetamol",
          dosage: "500mg",
          frequency: "Twice daily",
          duration: "5 days",
          instructions: "Take with food"
        },
        {
          name: "Ibuprofen",
          dosage: "400mg",
          frequency: "Twice daily",
          duration: "3 days",
          instructions: "Take after meals"
        },
        {
          name: "Oral Rehydration Solutions (ORS)",
          dosage: "1 sachet",
          frequency: "Twice daily",
          duration: "3 days",
          instructions: "Mix with water"
        }
      ],
      additionalNotes: "Rest well, increase fluid intake, return if symptoms worsen"
    };

    const reminders = [
      {
        medicine: "Paracetamol",
        times: ["08:00", "20:00"],
        withFood: true,
        duration: "5"
      },
      {
        medicine: "Ibuprofen",
        times: ["09:00", "21:00"],
        withFood: true,
        duration: "3"
      },
      {
        medicine: "Oral Rehydration Solutions (ORS)",
        times: ["10:00", "18:00"],
        withFood: false,
        duration: "3"
      }
    ];

    // Save sample prescription
    const prescription = new Prescription({
      userId: req.user.id,
      patientName: sampleData.patientInfo.name,
      diagnosis: sampleData.diagnosis,
      medications: sampleData.medications,
      reminders: reminders
    });
    await prescription.save();

    res.json({
      success: true,
      extractedData: sampleData,
      explanation: {
        summary: "You have an upper respiratory tract infection with bronchitis. The prescribed medications will help reduce symptoms and aid recovery.",
        conditionExplanation: "Upper respiratory tract infection affects your breathing passages and is commonly treated with pain relievers and supportive care.",
        medicationExplanations: [
          {
            name: "Paracetamol",
            purpose: "Reduces fever and relieves pain",
            importantNotes: "Take with food to prevent stomach upset"
          },
          {
            name: "Ibuprofen",
            purpose: "Anti-inflammatory medication that reduces pain and swelling",
            importantNotes: "Take after meals to avoid stomach irritation"
          },
          {
            name: "Oral Rehydration Solutions (ORS)",
            purpose: "Helps maintain hydration and electrolyte balance",
            importantNotes: "Mix with clean water as directed"
          }
        ],
        importantAdvice: [
          "Get plenty of rest",
          "Drink lots of fluids",
          "Return if symptoms worsen"
        ],
        reminders: reminders
      },
      prescriptionId: prescription._id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});





// Get adherence data
app.get('/api/adherence/:prescriptionId', async (req, res) => {
  try {
    const adherence = await Adherence.find({ 
      prescriptionId: req.params.prescriptionId,
      userId: req.user?.id 
    });
    res.json(adherence);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export user data
app.get('/api/export-data', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.id;
    const prescriptions = await Prescription.find({ userId }).sort({ createdAt: -1 });
    const adherence = await Adherence.find({ userId }).sort({ takenAt: -1 });
    

    
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>MediMind Medical Report</title><style>body{font-family:Arial,sans-serif;margin:20px;color:#333}.header{text-align:center;border-bottom:2px solid #4F46E5;padding-bottom:20px;margin-bottom:30px}.logo{font-size:24px;font-weight:bold;color:#4F46E5}.prescription{border:1px solid #E5E7EB;border-radius:8px;padding:20px;margin-bottom:20px}.diagnosis{font-weight:bold;color:#1F2937;margin-bottom:10px}.medication{background:#FAFAFA;padding:15px;border-left:4px solid #10B981;margin-bottom:10px}.med-name{font-weight:bold;color:#059669}.med-details{color:#6B7280;font-size:14px;margin-top:5px}</style></head><body><div class="header"><div class="logo">💊 MediMind</div><div>Medical Report - Generated on ${new Date().toLocaleDateString()}</div></div><h2>Summary</h2><p><strong>Total Prescriptions:</strong> ${prescriptions.length}</p><p><strong>Total Medications Taken:</strong> ${adherence.length}</p>`;
    
    prescriptions.forEach((prescription, index) => {
      html += `<div class="prescription"><h3>Prescription #${index + 1}</h3><p><strong>Patient:</strong> ${prescription.patientName || 'Unknown'} | <strong>Date:</strong> ${new Date(prescription.createdAt).toLocaleDateString()}</p><div class="diagnosis"><strong>Diagnosis:</strong> ${prescription.diagnosis || 'Not specified'}</div><h4>Medications (${prescription.medications?.length || 0})</h4>`;
      
      if (prescription.medications && prescription.medications.length > 0) {
        prescription.medications.forEach(med => {
          html += `<div class="medication"><div class="med-name">${med.name || 'Unknown'}</div><div class="med-details"><strong>Dosage:</strong> ${med.dosage || 'As prescribed'} | <strong>Frequency:</strong> ${med.frequency || 'As directed'} | <strong>Duration:</strong> ${med.duration || 'Complete course'}</div>${med.instructions ? `<div class="med-details"><strong>Instructions:</strong> ${med.instructions}</div>` : ''}</div>`;
        });
      }
      
      const prescriptionAdherence = adherence.filter(a => a.prescriptionId?.toString() === prescription._id.toString());
      html += `<p><strong>Medications Taken:</strong> ${prescriptionAdherence.length}</p></div>`;
    });
    
    html += `<div style="text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #E5E7EB;color:#6B7280;font-size:12px"><p>Generated by MediMind - Smart Prescription Analyzer</p></div></body></html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
});

// Generate calendar file
app.get('/api/calendar/:prescriptionId/download', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.prescriptionId);
    if (!prescription) return res.status(404).json({ error: 'Not found' });
    
    if (!prescription.reminders || prescription.reminders.length === 0) {
      return res.status(400).json({ error: 'No reminders found' });
    }
    
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    let icsContent = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//MediMind//Medication Reminders//EN\r\nCALSCALE:GREGORIAN\r\n`;
    
    prescription.reminders.forEach((reminder, reminderIndex) => {
      if (reminder.times && Array.isArray(reminder.times)) {
        reminder.times.forEach((time, timeIndex) => {
          const duration = parseInt(reminder.duration) || 7;
          
          for (let i = 0; i < duration; i++) {
            const eventDate = new Date();
            eventDate.setDate(eventDate.getDate() + i);
            
            const [hours, minutes] = time.split(':');
            eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            const startTime = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            const endDate = new Date(eventDate.getTime() + 15 * 60000);
            const endTime = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            
            const uid = `${prescription._id}-${reminderIndex}-${timeIndex}-${i}@medimind.com`;
            
            icsContent += `BEGIN:VEVENT\r\n`;
            icsContent += `UID:${uid}\r\n`;
            icsContent += `DTSTAMP:${timestamp}\r\n`;
            icsContent += `DTSTART:${startTime}\r\n`;
            icsContent += `DTEND:${endTime}\r\n`;
            icsContent += `SUMMARY:💊 Take ${reminder.medicine}\r\n`;
            icsContent += `DESCRIPTION:Medication: ${reminder.medicine}\nDosage: Take as prescribed\nWith food: ${reminder.withFood ? 'Yes' : 'No'}\nDay ${i + 1} of ${duration}\r\n`;
            icsContent += `LOCATION:Home\r\n`;
            icsContent += `STATUS:CONFIRMED\r\n`;
            icsContent += `TRANSP:OPAQUE\r\n`;
            icsContent += `BEGIN:VALARM\r\n`;
            icsContent += `TRIGGER:-PT15M\r\n`;
            icsContent += `ACTION:DISPLAY\r\n`;
            icsContent += `DESCRIPTION:Time to take ${reminder.medicine}\r\n`;
            icsContent += `END:VALARM\r\n`;
            icsContent += `END:VEVENT\r\n`;
          }
        });
      }
    });
    
    icsContent += `END:VCALENDAR\r\n`;
    
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="medimind-medication-schedule.ics"');
    res.send(icsContent);
  } catch (error) {
    console.error('Calendar generation error:', error);
    res.status(500).json({ error: 'Failed to generate calendar' });
  }
});



// Register
app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashedPassword, name });
  await user.save();
  const token = jwt.sign({ id: user._id }, 'your-secret-key');
  res.json({ token, user: { id: user._id, email, name } });
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user._id }, 'your-secret-key');
  res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
});

// Get past prescriptions
app.get('/api/prescriptions', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  console.log('User ID:', req.user.id);
  const prescriptions = await Prescription.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(10);
  console.log('Found prescriptions:', prescriptions.map(p => ({ id: p._id, userId: p.userId, patient: p.patientName })));
  res.json(prescriptions);
});

// Get single prescription details
app.get('/api/prescriptions/:id', async (req, res) => {
  const prescription = await Prescription.findById(req.params.id);
  if (!prescription) return res.status(404).json({ error: 'Prescription not found' });
  
  // Check if user owns this prescription
  if (req.user && prescription.userId && prescription.userId.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.json(prescription);
});

// Generate calendar events (JSON format for web display)
app.get('/api/calendar/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ error: 'Not found' });
    
    const events = [];
    if (prescription.reminders && Array.isArray(prescription.reminders)) {
      prescription.reminders.forEach(reminder => {
        if (reminder.times && Array.isArray(reminder.times)) {
          reminder.times.forEach(time => {
            const duration = parseInt(reminder.duration) || 7;
            for (let i = 0; i < duration; i++) {
              const date = new Date();
              date.setDate(date.getDate() + i);
              const [hours, minutes] = time.split(':');
              date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
              
              events.push({
                title: `💊 Take ${reminder.medicine}`,
                start: date.toISOString(),
                description: `Medication: ${reminder.medicine}\nWith food: ${reminder.withFood ? 'Yes' : 'No'}\nDay ${i + 1} of ${duration}`
              });
            }
          });
        }
      });
    }
    
    res.json({ events });
  } catch (error) {
    console.error('Calendar events error:', error);
    res.status(500).json({ error: 'Failed to generate events' });
  }
});

// Clean up database - remove all prescriptions (admin only)
app.post('/api/cleanup-all', async (req, res) => {
  try {
    const result = await Prescription.deleteMany({});
    const adherenceResult = await Adherence.deleteMany({});
    res.json({ 
      success: true, 
      deletedPrescriptions: result.deletedCount,
      deletedAdherence: adherenceResult.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString() 
  });
});

// Catch-all route (must be last)
app.get('*', (req, res) => {
  res.redirect('/');
});

// Start server
app.listen(PORT, () => {
  console.log(`🏥 MediMind server running on http://localhost:${PORT}`);
  console.log(`📊 Ready to analyze prescriptions!`);
});