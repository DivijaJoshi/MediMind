# 💊 MediMind - Smart Prescription Analyzer

**Understand your prescriptions with AI-powered insights and smart medication reminders.**

MediMind is a modern web application that helps patients easily understand their medical prescriptions using advanced AI technology. Upload your prescription image and get clear, structured insights about your diagnosis, medications, and personalized treatment plan.

## 🌟 Features

### 📸 Smart Prescription Upload
- **Multi-format support**: Upload JPG, PNG, or PDF prescription files
- **Drag & drop interface**: Easy file upload with visual feedback
- **Image optimization**: Automatic image processing for better OCR results
- **File validation**: Secure file type and size validation

### 🧠 AI-Powered Analysis
- **Gemini 2.0 Flash Integration**: Advanced OCR and medical text understanding
- **Structured Data Extraction**: Automatically extracts doctor info, patient details, diagnosis, and medications
- **Patient-Friendly Explanations**: Converts medical jargon into clear, understandable language
- **Comprehensive Insights**: Detailed breakdown of conditions, treatments, and medication purposes

### 💊 Smart Medication Management
- **Detailed Medication Info**: Dosage, frequency, duration, and purpose for each medicine
- **Important Notes**: Special instructions, food interactions, and precautions
- **Visual Medication Cards**: Clean, organized display of all prescribed medications

### ⏰ Intelligent Reminders
- **Automated Scheduling**: Smart medication reminder system based on prescription details
- **Push Notifications**: Browser-based alerts for medication times
- **Adherence Tracking**: Visual progress tracker to monitor medication compliance
- **Customizable Alerts**: Enable/disable notifications as needed

### 🎨 Modern UI/UX
- **Clean Design**: Minimal, aesthetic interface following modern design principles
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Smooth Animations**: Engaging loading states and transitions
- **Accessibility**: Screen reader friendly and keyboard navigation support

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Gemini API key (provided in the setup)

### Installation

1. **Clone or download the project**
   ```bash
   cd MediMind
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   The `.env` file is already configured with the Gemini API key:
   ```
   GEMINI_API_KEY=key
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📱 How to Use

### 1. Upload Your Prescription
- Click the upload area or drag and drop your prescription image/PDF
- Supported formats: JPG, PNG, PDF (max 10MB)
- Preview your uploaded file before analysis

### 2. AI Analysis Process
Watch the real-time pipeline as MediMind:
- **Extracts & Structures**: OCR processing and medical information extraction
- **AI Analysis**: Generates patient-friendly explanations using Gemini 2.0
- **Smart Reminders**: Creates personalized medication schedules

### 3. Review Your Results
- **Doctor's Summary**: Clear explanation of your diagnosis and treatment plan
- **Medication Details**: Complete breakdown of each prescribed medicine
- **Important Advice**: Key recommendations and precautions
- **Medication Schedule**: Personalized reminder times

### 4. Enable Smart Reminders
- Turn on browser notifications for medication alerts
- Track your adherence with the visual progress tracker
- Mark doses as taken to maintain your medication log

## 🛡️ Privacy & Security

- **Local Processing**: Your prescription images are processed securely
- **No Data Storage**: Images and personal information are not permanently stored
- **Encrypted Transmission**: All API communications are encrypted
- **Privacy First**: Your medical data remains private and secure

## ⚠️ Important Disclaimer

**MediMind is an educational tool designed to help you better understand your prescriptions. It is not a medical device and should not replace professional medical advice.**

- Always verify medication information with your healthcare provider
- Consult your doctor or pharmacist for any medical decisions
- Do not change your medication regimen without professional guidance
- Seek immediate medical attention for any adverse reactions

## 🔧 Technical Stack

### Frontend
- **HTML5 & CSS3**: Modern web standards
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Vanilla JavaScript**: Lightweight, fast, and dependency-free
- **Lucide Icons**: Beautiful, customizable icon library

### Backend
- **Node.js**: JavaScript runtime for server-side development
- **Express.js**: Fast, minimalist web framework
- **Multer**: Middleware for handling file uploads
- **Sharp**: High-performance image processing

### AI & Processing
- **Google Gemini 2.0 Flash**: Advanced multimodal AI for OCR and text understanding
- **Smart Prompting**: Optimized prompts for medical text extraction and explanation
- **JSON Structured Output**: Reliable data parsing and validation

## 📊 API Endpoints

### `POST /api/analyze`
Analyzes uploaded prescription images/PDFs
- **Input**: Multipart form data with prescription file
- **Output**: Structured JSON with extracted data and explanations
- **Processing**: OCR → AI Analysis → Patient-friendly formatting

### `GET /api/health`
Health check endpoint for monitoring server status
- **Output**: Server status and timestamp

## 🎯 Target Audience

MediMind is designed for:
- **Patients** who want to better understand their prescriptions
- **Caregivers** helping family members manage medications
- **Healthcare advocates** promoting medication adherence
- **Anyone** seeking clearer medical information

## 🔮 Future Enhancements

- **Multi-language Support**: Prescription analysis in multiple languages
- **Drug Interaction Checker**: Advanced safety warnings and interactions
- **Pharmacy Integration**: Connect with local pharmacies for prescription fulfillment
- **Health Records**: Secure, encrypted medication history tracking
- **Mobile App**: Native iOS and Android applications
- **Telemedicine Integration**: Connect with healthcare providers

## 🤝 Contributing

We welcome contributions to make MediMind even better! Please ensure all contributions maintain the focus on patient safety and privacy.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support or questions:
- Check the troubleshooting section below
- Review the API documentation
- Contact the development team

## 🔧 Troubleshooting

### Common Issues

**File Upload Problems**
- Ensure file is under 10MB
- Check file format (JPG, PNG, PDF only)
- Try refreshing the page and uploading again

**Analysis Errors**
- Verify internet connection
- Ensure prescription image is clear and readable
- Try uploading a different image format

**Notification Issues**
- Check browser notification permissions
- Ensure notifications are enabled in browser settings
- Try refreshing the page and re-enabling notifications

### Browser Compatibility
- **Chrome**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile browsers**: Responsive design supported

---

**Made with ❤️ for better healthcare understanding**

*Remember: This tool provides educational insights only. Always consult your healthcare provider for medical decisions.*