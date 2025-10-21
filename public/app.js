// MediMind - Smart Prescription Analyzer
// Frontend JavaScript Application

class MediMind {
    constructor() {
        this.currentAnalysis = null;
        this.notificationsEnabled = false;
        this.adherenceData = {};
        this.init();
    }

    init() {
        this.initializeElements();
        this.bindEvents();
        this.initializeLucideIcons();
        this.checkNotificationPermission();
    }

    initializeElements() {
        // File upload elements
        this.fileInput = document.getElementById('fileInput');
        this.dropzone = document.getElementById('dropzone');
        this.previewWrap = document.getElementById('previewWrap');
        this.previewImg = document.getElementById('previewImg');
        this.clearBtn = document.getElementById('clearBtn');
        this.analyzeBtn = document.getElementById('analyzeBtn');

        // Pipeline elements
        this.step1Status = document.getElementById('step1Status');
        this.step2Status = document.getElementById('step2Status');
        this.step3Status = document.getElementById('step3Status');
        this.step1Icon = document.getElementById('step1Icon');
        this.step2Icon = document.getElementById('step2Icon');
        this.step3Icon = document.getElementById('step3Icon');
        this.pipelineProgress = document.getElementById('pipelineProgress');
        this.progressBar = document.getElementById('progressBar');
        this.progressLabel = document.getElementById('progressLabel');
        this.progressPct = document.getElementById('progressPct');

        // Results elements
        this.skeletonInsights = document.getElementById('skeletonInsights');
        this.doctorSaidCard = document.getElementById('doctorSaidCard');
        this.doctorSummary = document.getElementById('doctorSummary');
        this.conditionExplanation = document.getElementById('conditionExplanation');
        this.medListCard = document.getElementById('medListCard');
        this.medList = document.getElementById('medList');
        this.courseDuration = document.getElementById('courseDuration');
        this.adviceCard = document.getElementById('adviceCard');
        this.adviceList = document.getElementById('adviceList');

        // Reminder elements
        this.reminderCard = document.getElementById('reminderCard');
        this.todaySchedule = document.getElementById('todaySchedule');
        this.adherenceCard = document.getElementById('adherenceCard');
        this.adherenceScore = document.getElementById('adherenceScore');
        this.adherenceCalendar = document.getElementById('adherenceCalendar');
        this.notifToggle = document.getElementById('notifToggle');
        this.enableNotificationsBtn = document.getElementById('enableNotificationsBtn');

        // Other elements
        this.newSessionBtn = document.getElementById('newSessionBtn');
        this.copySummaryBtn = document.getElementById('copySummaryBtn');
        this.sampleBtn = document.getElementById('sampleBtn');
    }

    bindEvents() {
        // File upload events
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.dropzone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropzone.addEventListener('drop', (e) => this.handleDrop(e));
        this.clearBtn.addEventListener('click', () => this.clearFile());
        this.analyzeBtn.addEventListener('click', () => this.analyzePresciption());

        // Other events
        this.newSessionBtn.addEventListener('click', () => this.newSession());
        this.copySummaryBtn.addEventListener('click', () => this.copySummary());
        this.notifToggle.addEventListener('click', () => this.toggleNotifications());
        this.enableNotificationsBtn.addEventListener('click', () => this.requestNotificationPermission());
        this.sampleBtn.addEventListener('click', () => this.analyzeSample());
    }

    initializeLucideIcons() {
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        this.dropzone.classList.add('border-blue-400', 'bg-blue-50');
    }

    handleDrop(event) {
        event.preventDefault();
        this.dropzone.classList.remove('border-blue-400', 'bg-blue-50');
        
        const file = event.dataTransfer.files[0];
        if (file) {
            this.fileInput.files = event.dataTransfer.files;
            this.processFile(file);
        }
    }

    processFile(file) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            this.showError('Please upload a valid image (JPG, PNG) or PDF file.');
            return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            this.showError('File size must be less than 10MB.');
            return;
        }

        // Show preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.previewImg.src = e.target.result;
                this.previewWrap.classList.remove('hidden');
                this.analyzeBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        } else {
            // For PDFs, show a placeholder
            this.previewImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjFGNUY5Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY0NzQ4QiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRGIEZpbGU8L3RleHQ+Cjwvc3ZnPgo=';
            this.previewWrap.classList.remove('hidden');
            this.analyzeBtn.disabled = false;
        }
    }

    clearFile() {
        this.fileInput.value = '';
        this.previewWrap.classList.add('hidden');
        this.analyzeBtn.disabled = true;
        this.resetUI();
    }

    analyzePresciption() {
        if (!this.fileInput.files[0]) {
            this.showError('Please select a file first.');
            return;
        }

        this.resetUI();
        this.currentAnalysis = null;
        this.clearNotifications();
        this.startAnalysis();
        
        const formData = new FormData();
        formData.append('prescription', this.fileInput.files[0]);

        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        fetch('/api/analyze', {
            method: 'POST',
            headers: headers,
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            this.currentAnalysis = result;
            this.displayResults(result);
            this.completeAnalysis();
            this.showSuccess('Analysis completed!');
        })
        .catch(error => {
            console.error('Analysis error:', error);
            this.showError('Analysis failed');
            this.resetPipeline();
        });
    }

    analyzeSample() {
        this.resetUI();
        this.currentAnalysis = null;
        this.clearNotifications();
        this.startAnalysis();
        
        this.previewImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNFMkU4RjAiLz4KPHRleHQgeD0iMjAwIiB5PSI0MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzFGMjkzNyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q2l0eSBNZWRpY2FsIENlbnRlcjwvdGV4dD4KPHRleHQgeD0iMjAiIHk9IjcwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM0NzQ3NDciPkRyLiBTYXJhaCBKb2huc29uLCBNRDwvdGV4dD4KPHRleHQgeD0iMjAiIHk9IjkwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM2QTZBNkEiPkdlbmVyYWwgUHJhY3RpdGlvbmVyPC90ZXh0Pgo8dGV4dCB4PSIyMCIgeT0iMTMwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiMxRjI5MzciPkRpYWdub3NpczogVXBwZXIgUmVzcGlyYXRvcnkgVHJhY3QgSW5mZWN0aW9uPC90ZXh0Pgo8dGV4dCB4PSIyMCIgeT0iMTYwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTEiIGZpbGw9IiMxRjI5MzciPjEuIEFtb3hpY2lsbGluIDUwMG1nIC0gVHdpY2UgZGFpbHkgZm9yIDcgZGF5czwvdGV4dD4KPHRleHQgeD0iMjAiIHk9IjE4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjExIiBmaWxsPSIjMUYyOTM3Ij4yLiBQYXJhY2V0YW1vbCA2NTBtZyAtIEV2ZXJ5IDggaG91cnMgYXMgbmVlZGVkPC90ZXh0Pgo8dGV4dCB4PSIyMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTEiIGZpbGw9IiMxRjI5MzciPjMuIENldGlyaXppbmUgMTBtZyAtIE9uY2UgZGFpbHkgZm9yIDUgZGF5czwvdGV4dD4KPHRleHQgeD0iMjAiIHk9IjI0MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNkE2QTZBIj5SZXN0IHdlbGwsIGRyaW5rIHBsZW50eSBvZiBmbHVpZHM8L3RleHQ+Cjx0ZXh0IHg9IjIwIiB5PSIyNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzZBNkE2QSI+UmV0dXJuIGlmIHN5bXB0b21zIHdvcnNlbjwvdGV4dD4KPC9zdmc+';
        this.previewWrap.classList.remove('hidden');
        
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        fetch('/api/sample', { 
            method: 'POST',
            headers: headers
        })
            .then(response => response.json())
            .then(result => {
                this.currentAnalysis = result;
                this.displayResults(result);
                this.completeAnalysis();
                this.showSuccess('Sample analysis completed!');
            })
            .catch(error => {
                this.showError('Sample analysis failed');
                this.resetPipeline();
            });
    }

    startAnalysis() {
        if (this.analyzeBtn) {
            this.analyzeBtn.disabled = true;
            this.analyzeBtn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 animate-spin"></i> Analyzing...';
        }
        if (this.sampleBtn) {
            this.sampleBtn.disabled = true;
            this.sampleBtn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 animate-spin"></i> Loading...';
        }
        if (this.pipelineProgress) this.pipelineProgress.classList.remove('hidden');
        if (this.skeletonInsights) this.skeletonInsights.classList.remove('hidden');
        
        // Start pipeline steps
        this.updatePipelineStep(1, 'Processing...', 'bg-blue-100', 'text-blue-600');
        this.updateProgress(20, 'Extracting text from image...');
        
        setTimeout(() => {
            this.updatePipelineStep(1, 'Completed', 'bg-green-100', 'text-green-600');
            this.updatePipelineStep(2, 'Analyzing...', 'bg-blue-100', 'text-blue-600');
            this.updateProgress(60, 'AI analyzing medical data...');
        }, 1000);
        
        setTimeout(() => {
            this.updatePipelineStep(2, 'Completed', 'bg-green-100', 'text-green-600');
            this.updatePipelineStep(3, 'Creating...', 'bg-blue-100', 'text-blue-600');
            this.updateProgress(90, 'Generating medication schedule...');
        }, 2000);
        
        if (window.lucide) lucide.createIcons();
    }

    updatePipelineStep(step, status, bgClass, textClass) {
        const statusEl = document.getElementById(`step${step}Status`);
        const iconEl = document.getElementById(`step${step}Icon`);
        
        if (statusEl) statusEl.textContent = status;
        if (iconEl) {
            iconEl.className = `mt-0.5 h-8 w-8 rounded-lg ${bgClass} flex items-center justify-center`;
            const iconChild = iconEl.querySelector('i');
            if (iconChild) iconChild.className = `h-4 w-4 ${textClass}`;
        }
    }

    updateProgress(percent, label) {
        if (this.progressBar) this.progressBar.style.width = `${percent}%`;
        if (this.progressPct) this.progressPct.textContent = `${percent}%`;
        if (this.progressLabel) this.progressLabel.textContent = label;
    }

    completeAnalysis() {
        this.updatePipelineStep(3, 'Completed', 'bg-green-100', 'text-green-600');
        this.updateProgress(100, 'Analysis Complete!');
        
        setTimeout(() => {
            if (this.pipelineProgress) this.pipelineProgress.classList.add('hidden');
            if (this.analyzeBtn) {
                this.analyzeBtn.disabled = false;
                this.analyzeBtn.innerHTML = '<i data-lucide="sparkles" class="h-4 w-4"></i> Analyze with AI';
            }
            if (this.sampleBtn) {
                this.sampleBtn.disabled = false;
                this.sampleBtn.innerHTML = '<i data-lucide="file-text" class="h-4 w-4"></i> Try Sample';
            }
            if (this.skeletonInsights) this.skeletonInsights.classList.add('hidden');
        }, 1000);
        
        if (window.lucide) lucide.createIcons();
    }

    displayResults(result) {
        console.log('Displaying results:', result);
        const { explanation, extractedData } = result;

        // Display doctor summary
        if (explanation && explanation.summary) {
            this.doctorSummary.textContent = explanation.summary;
            this.doctorSaidCard.classList.remove('hidden');
        }

        // Display condition explanation
        if (explanation && explanation.conditionExplanation) {
            this.conditionExplanation.textContent = explanation.conditionExplanation;
        }

        // Display medications - show even if empty to provide feedback
        if (explanation && explanation.medicationExplanations) {
            this.displayMedications(explanation.medicationExplanations, extractedData ? extractedData.medications || [] : []);
            this.medListCard.classList.remove('hidden');
        } else if (extractedData && extractedData.medications && extractedData.medications.length > 0) {
            // Fallback: show extracted medications even without explanations
            this.displayMedications([], extractedData.medications);
            this.medListCard.classList.remove('hidden');
        }

        // Display advice
        if (explanation && explanation.importantAdvice && explanation.importantAdvice.length > 0) {
            this.displayAdvice(explanation.importantAdvice);
            this.adviceCard.classList.remove('hidden');
        }

        // Display reminders - always show if we have any analysis
        if (explanation && explanation.reminders && explanation.reminders.length > 0) {
            this.displayReminders(explanation.reminders);
            this.reminderCard.classList.remove('hidden');
            this.adherenceCard.classList.remove('hidden');
        } else if (extractedData && extractedData.medications && extractedData.medications.length > 0) {
            // Generate basic reminders from medications if no specific reminders
            const basicReminders = extractedData.medications.map(med => ({
                medicine: med.name,
                times: med.frequency?.includes('twice') ? ['08:00', '20:00'] : 
                       med.frequency?.includes('three') ? ['08:00', '14:00', '20:00'] : ['08:00'],
                withFood: med.instructions?.toLowerCase().includes('food') || false,
                duration: med.duration?.match(/\d+/)?.[0] || '7'
            }));
            this.displayReminders(basicReminders);
            this.reminderCard.classList.remove('hidden');
            this.adherenceCard.classList.remove('hidden');
        }

        // Show diagnosis info if available
        if (extractedData && extractedData.diagnosis) {
            console.log('Diagnosis found:', extractedData.diagnosis);
        }
    }

    displayMedications(medicationExplanations, extractedMeds) {
        this.medList.innerHTML = '';
        
        // Handle case where we have explanations
        if (medicationExplanations && medicationExplanations.length > 0) {
            medicationExplanations.forEach((med, index) => {
                const extractedMed = extractedMeds[index] || {};
                
                const medItem = document.createElement('div');
                medItem.className = 'p-4 rounded-lg border border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50';
                
                medItem.innerHTML = `
                    <div class="flex items-start justify-between mb-2">
                        <div>
                            <h4 class="font-semibold text-slate-900">${med.name || 'Medication'}</h4>
                            <div class="text-sm text-slate-600">
                                ${extractedMed.dosage || 'As prescribed'} • ${extractedMed.frequency || 'As directed'} • ${extractedMed.duration || 'Complete course'}
                            </div>
                        </div>
                        <div class="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs">
                            <i data-lucide="pill" class="h-3 w-3"></i>
                            Medicine
                        </div>
                    </div>
                    <div class="text-sm text-slate-700 mb-2">
                        <strong>Purpose:</strong> ${med.purpose || 'As prescribed by your doctor'}
                    </div>
                    <div class="text-xs text-slate-600 bg-white/50 p-2 rounded">
                        <strong>Important:</strong> ${med.importantNotes || 'Follow your doctor\'s instructions'}
                    </div>
                `;
                
                this.medList.appendChild(medItem);
            });
        } 
        // Handle case where we only have extracted medications
        else if (extractedMeds && extractedMeds.length > 0) {
            extractedMeds.forEach((med) => {
                const medItem = document.createElement('div');
                medItem.className = 'p-4 rounded-lg border border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50';
                
                medItem.innerHTML = `
                    <div class="flex items-start justify-between mb-2">
                        <div>
                            <h4 class="font-semibold text-slate-900">${med.name || 'Medication'}</h4>
                            <div class="text-sm text-slate-600">
                                ${med.dosage || 'As prescribed'} • ${med.frequency || 'As directed'} • ${med.duration || 'Complete course'}
                            </div>
                        </div>
                        <div class="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs">
                            <i data-lucide="pill" class="h-3 w-3"></i>
                            Medicine
                        </div>
                    </div>
                    <div class="text-sm text-slate-700 mb-2">
                        <strong>Instructions:</strong> ${med.instructions || 'Take as directed by your healthcare provider'}
                    </div>
                `;
                
                this.medList.appendChild(medItem);
            });
        }
        // Show message if no medications found
        else {
            const noMedsItem = document.createElement('div');
            noMedsItem.className = 'p-4 rounded-lg border border-slate-200 bg-slate-50 text-center';
            noMedsItem.innerHTML = `
                <div class="text-slate-600">
                    <i data-lucide="info" class="h-5 w-5 mx-auto mb-2 text-slate-400"></i>
                    <p class="text-sm">No medications clearly identified in the prescription.</p>
                    <p class="text-xs mt-1">Please verify with your healthcare provider.</p>
                </div>
            `;
            this.medList.appendChild(noMedsItem);
        }

        // Set course duration
        const maxDuration = extractedMeds ? extractedMeds.reduce((max, med) => {
            const duration = parseInt((med.duration || '0').replace(/\D/g, '')) || 0;
            return Math.max(max, duration);
        }, 0) : 0;
        
        if (maxDuration > 0) {
            this.courseDuration.textContent = `Course: ~${maxDuration} day${maxDuration > 1 ? 's' : ''}`;
        } else {
            this.courseDuration.textContent = 'Duration: As prescribed';
        }
        
        // Refresh icons
        lucide.createIcons();
    }

    displayAdvice(advice) {
        this.adviceList.innerHTML = '';
        
        advice.forEach(item => {
            const li = document.createElement('li');
            li.className = 'flex items-start gap-2 text-sm text-slate-700';
            li.innerHTML = `
                <i data-lucide="check-circle" class="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0"></i>
                <span>${item}</span>
            `;
            this.adviceList.appendChild(li);
        });
    }

    displayReminders(reminders) {
        if (!this.todaySchedule) return;
        
        this.todaySchedule.innerHTML = '';
        
        // Add calendar export and test notification buttons
        const exportBtn = document.createElement('div');
        exportBtn.className = 'mb-4 text-center space-x-2';
        exportBtn.innerHTML = `
            <button id="exportCalendarBtn" class="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white text-xs hover:bg-indigo-700">
                <i data-lucide="calendar-plus" class="h-4 w-4"></i>
                Add to Calendar
            </button>
            <button id="testNotificationBtn" class="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-green-600 text-white text-xs hover:bg-green-700">
                <i data-lucide="bell" class="h-4 w-4"></i>
                Test Notification
            </button>
        `;
        this.todaySchedule.appendChild(exportBtn);
        
        console.log('Displaying reminders:', reminders);
        
        reminders.forEach(reminder => {
            console.log('Processing reminder:', reminder);
            if (reminder.times && Array.isArray(reminder.times) && reminder.times.length > 0) {
                reminder.times.forEach(time => {
                    console.log('Processing time:', time);
                    const scheduleItem = document.createElement('div');
                    scheduleItem.className = 'flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100';
                    scheduleItem.id = `schedule-${reminder.medicine}-${time}`;
                    
                    const formattedTime = this.formatTime(time);
                    console.log('Formatted time:', formattedTime);
                    
                    scheduleItem.innerHTML = `
                        <div class="flex items-center gap-3">
                            <div class="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <i data-lucide="clock" class="h-5 w-5 text-indigo-600"></i>
                            </div>
                            <div>
                                <div class="font-medium text-slate-900">${formattedTime}</div>
                                <div class="text-sm text-slate-600">${reminder.medicine || 'Unknown Medicine'}</div>
                            </div>
                        </div>
                        <button onclick="markTaken('${reminder.medicine}', '${time}', '${this.currentAnalysis?.prescriptionId || ''}', this)" class="px-3 py-1 rounded-md bg-white border border-indigo-200 text-indigo-700 text-xs hover:bg-indigo-50">
                            Mark Taken
                        </button>
                    `;
                    
                    this.todaySchedule.appendChild(scheduleItem);
                    console.log('Added schedule item for:', reminder.medicine, 'at', formattedTime);
                    
                    // Schedule real notification
                    this.scheduleNotification(reminder.medicine, this.convertToTimeFormat(time));
                });
            } else {
                console.log('No valid times for reminder:', reminder);
            }
        });

        // Add export calendar event listener
        const exportCalendarBtn = document.getElementById('exportCalendarBtn');
        if (exportCalendarBtn) {
            exportCalendarBtn.addEventListener('click', () => {
                if (this.currentAnalysis?.prescriptionId) {
                    window.open(`/api/calendar/${this.currentAnalysis.prescriptionId}/download`, '_blank');
                }
            });
        }

        // Add test notification event listener
        const testNotificationBtn = document.getElementById('testNotificationBtn');
        if (testNotificationBtn) {
            testNotificationBtn.addEventListener('click', () => {
                this.testNotification();
            });
        }

        this.loadAdherenceData();
        if (window.lucide) lucide.createIcons();
    }

    convertToTimeFormat(time) {
        if (!time) return '08:00';
        if (time.includes(':')) return time;
        const timeMap = {
            'morning': '08:00',
            'afternoon': '14:00', 
            'evening': '18:00',
            'night': '20:00'
        };
        return timeMap[time.toLowerCase()] || time;
    }

    formatTime(time24) {
        if (!time24) return '8:00 AM';
        
        // Convert text times to HH:MM format first
        const convertedTime = this.convertToTimeFormat(time24);
        
        const [hours, minutes] = String(convertedTime).split(':');
        if (!hours || !minutes) return '8:00 AM';
        
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }

    async loadAdherenceData() {
        if (!this.currentAnalysis?.prescriptionId) return;
        
        try {
            const token = localStorage.getItem('token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`/api/adherence/${this.currentAnalysis.prescriptionId}`, {
                headers: headers
            });
            const adherenceData = await response.json();
            
            this.updateAdherenceTracker(adherenceData);
        } catch (error) {
            console.error('Failed to load adherence data:', error);
            this.updateAdherenceTracker([]);
        }
    }
    
    updateAdherenceTracker(adherenceData) {
        const calendar = this.adherenceCalendar;
        calendar.innerHTML = '';
        
        const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        
        // Add day headers
        days.forEach((day) => {
            const dayEl = document.createElement('div');
            dayEl.className = 'text-xs text-center text-slate-500 mb-1';
            dayEl.textContent = day;
            calendar.appendChild(dayEl);
        });
        
        // Calculate expected doses per day
        const dailyExpectedDoses = this.getDailyExpectedDoses();
        const prescriptionDate = new Date(this.currentAnalysis?.timestamp || Date.now());
        prescriptionDate.setHours(0, 0, 0, 0);
        
        // Get current date for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let totalTaken = 0;
        let totalExpected = 0;
        let validDaysCount = 0;
        
        console.log('Adherence Debug - Prescription Date:', prescriptionDate.toDateString());
        console.log('Adherence Debug - Today:', today.toDateString());
        console.log('Adherence Debug - Daily Expected Doses:', dailyExpectedDoses);
        console.log('Adherence Debug - Adherence Data:', adherenceData);
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const dateStr = date.toDateString();
            
            // A day is valid if it's on or after prescription date AND not in the future
            const isValidDay = date >= prescriptionDate && date <= today;
            
            const dayTakenCount = adherenceData.filter(entry => 
                new Date(entry.takenAt).toDateString() === dateStr
            ).length;
            
            if (isValidDay) {
                validDaysCount++;
                totalExpected += dailyExpectedDoses;
                totalTaken += dayTakenCount;
                console.log(`Adherence Debug - Day ${dateStr}: taken=${dayTakenCount}, expected=${dailyExpectedDoses}`);
            }
            
            const dayTaken = dayTakenCount > 0;
            
            const dot = document.createElement('div');
            dot.className = `h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                !isValidDay ? 'bg-gray-50 border-gray-200 text-gray-300' :
                dayTaken ? 'bg-green-100 border-green-300 text-green-600' 
                    : 'bg-slate-100 border-slate-300 text-slate-400'
            }`;
            dot.innerHTML = dayTaken && isValidDay ? '<i data-lucide="check" class="h-3 w-3"></i>' : '';
            
            let tooltipText;
            if (!isValidDay && date > today) {
                tooltipText = 'Future date';
            } else if (!isValidDay && date < prescriptionDate) {
                tooltipText = 'Before prescription';
            } else {
                tooltipText = `${dateStr}: ${dayTaken ? `${dayTakenCount} medication(s) taken` : 'No medication recorded'}`;
            }
            dot.title = tooltipText;
            
            calendar.appendChild(dot);
        }
        
        console.log(`Adherence calc: taken=${totalTaken}, expected=${totalExpected}, days=${validDaysCount}`);
        
        // Calculate adherence rate with better logic
        let adherenceRate = 0;
        if (totalExpected > 0) {
            adherenceRate = Math.round((totalTaken / totalExpected) * 100);
        } else if (validDaysCount === 0) {
            // No valid days yet (prescription is for future or just created)
            adherenceRate = 0;
        } else {
            // Valid days exist but no expected doses (shouldn't happen, but handle gracefully)
            adherenceRate = 0;
        }
        
        // Ensure adherence rate doesn't exceed 100%
        adherenceRate = Math.min(adherenceRate, 100);
        
        console.log(`Final adherence rate: ${adherenceRate}%`);
        
        if (this.adherenceScore) {
            this.adherenceScore.textContent = `${adherenceRate}%`;
        }
        
        lucide.createIcons();
    }

    getMaxPrescriptionDuration() {
        if (!this.currentAnalysis?.explanation?.reminders) return 7;
        
        const maxDuration = this.currentAnalysis.explanation.reminders.reduce((max, reminder) => {
            const duration = parseInt(reminder.duration) || 0;
            return Math.max(max, duration);
        }, 0);
        
        return maxDuration || 7;
    }

    scheduleNotification(medicine, time) {
        if (!this.notificationsEnabled || !('Notification' in window)) return;
        
        const [hours, minutes] = time.split(':');
        const now = new Date();
        const notificationTime = new Date();
        notificationTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (notificationTime <= now) {
            notificationTime.setDate(notificationTime.getDate() + 1);
        }
        
        const timeUntilNotification = notificationTime.getTime() - now.getTime();
        
        setTimeout(() => {
            if (Notification.permission === 'granted') {
                new Notification('💊 MediMind Reminder', {
                    body: `Time to take ${medicine}`,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico'
                });
            }
        }, timeUntilNotification);
    }

    testNotification() {
        console.log('Test notification clicked, permission:', Notification.permission);
        if (Notification.permission === 'granted') {
            new Notification('💊 MediMind Test', {
                body: 'Notifications are working! You will receive medication reminders.',
                icon: '/favicon.ico'
            });
            this.showSuccess('Test notification sent!');
        } else if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('💊 MediMind Test', {
                        body: 'Notifications are working! You will receive medication reminders.',
                        icon: '/favicon.ico'
                    });
                    this.notificationsEnabled = true;
                    this.updateNotificationToggle(true);
                    this.showSuccess('Notifications enabled and test sent!');
                } else {
                    this.showError('Please allow notifications in your browser');
                }
            });
        } else {
            this.showError('Notifications are blocked. Please enable them in browser settings.');
        }
    }

    getDailyExpectedDoses() {
        if (!this.currentAnalysis?.explanation?.reminders) return 1;
        
        const total = this.currentAnalysis.explanation.reminders.reduce((sum, reminder) => {
            return sum + (reminder.times ? reminder.times.length : 1);
        }, 0);
        
        return Math.max(total, 1);
    }
    


    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.notificationsEnabled = true;
                this.updateNotificationToggle(true);
                this.showSuccess('Notifications enabled! You\'ll receive medication reminders.');
            }
        } else {
            this.showError('Notifications are not supported in this browser.');
        }
    }

    checkNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'granted') {
            this.notificationsEnabled = true;
            this.updateNotificationToggle(true);
        }
    }

    toggleNotifications() {
        if (this.notificationsEnabled) {
            this.notificationsEnabled = false;
            this.updateNotificationToggle(false);
        } else {
            this.requestNotificationPermission();
        }
    }

    updateNotificationToggle(enabled) {
        const toggle = this.notifToggle;
        const span = toggle.querySelector('span');
        
        if (enabled) {
            toggle.classList.add('bg-indigo-600');
            toggle.classList.remove('bg-slate-200');
            span.classList.add('translate-x-5');
            toggle.setAttribute('aria-checked', 'true');
        } else {
            toggle.classList.remove('bg-indigo-600');
            toggle.classList.add('bg-slate-200');
            span.classList.remove('translate-x-5');
            toggle.setAttribute('aria-checked', 'false');
        }
    }

    copySummary() {
        if (this.currentAnalysis && this.currentAnalysis.explanation.summary) {
            navigator.clipboard.writeText(this.currentAnalysis.explanation.summary)
                .then(() => this.showSuccess('Summary copied to clipboard!'))
                .catch(() => this.showError('Failed to copy summary.'));
        }
    }

    newSession() {
        this.clearFile();
        this.currentAnalysis = null;
        this.resetUI();
        this.clearNotifications();
    }

    clearNotifications() {
        // Clear any existing notification timeouts
        if (this.notificationTimeouts) {
            this.notificationTimeouts.forEach(timeout => clearTimeout(timeout));
        }
        this.notificationTimeouts = [];
    }

    resetUI() {
        // Hide all result cards
        if (this.doctorSaidCard) this.doctorSaidCard.classList.add('hidden');
        if (this.medListCard) this.medListCard.classList.add('hidden');
        if (this.adviceCard) this.adviceCard.classList.add('hidden');
        if (this.reminderCard) this.reminderCard.classList.add('hidden');
        if (this.adherenceCard) this.adherenceCard.classList.add('hidden');
        if (this.skeletonInsights) this.skeletonInsights.classList.add('hidden');
        
        this.resetPipeline();
    }

    resetPipeline() {
        if (this.step1Status) this.step1Status.textContent = 'Waiting';
        if (this.step2Status) this.step2Status.textContent = 'Waiting';
        if (this.step3Status) this.step3Status.textContent = 'Waiting';
        
        // Reset step icons
        [1, 2, 3].forEach(step => {
            const iconEl = document.getElementById(`step${step}Icon`);
            if (iconEl) {
                iconEl.className = 'mt-0.5 h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center';
                const iconChild = iconEl.querySelector('i');
                if (iconChild) iconChild.className = 'h-4 w-4 text-slate-600';
            }
        });
        
        if (this.pipelineProgress) this.pipelineProgress.classList.add('hidden');
        if (this.progressBar) this.progressBar.style.width = '0%';
        if (this.progressPct) this.progressPct.textContent = '0%';
        if (this.progressLabel) this.progressLabel.textContent = 'Starting analysis...';
        
        // Re-enable buttons
        if (this.analyzeBtn) {
            this.analyzeBtn.disabled = false;
            this.analyzeBtn.innerHTML = '<i data-lucide="sparkles" class="h-4 w-4"></i> Analyze with AI';
        }
        if (this.sampleBtn) {
            this.sampleBtn.disabled = false;
            this.sampleBtn.innerHTML = '<i data-lucide="file-text" class="h-4 w-4"></i> Try Sample';
        }
        
        if (window.lucide) lucide.createIcons();
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full ${
            type === 'success' ? 'bg-green-100 border border-green-200 text-green-800' :
            type === 'error' ? 'bg-red-100 border border-red-200 text-red-800' :
            'bg-blue-100 border border-blue-200 text-blue-800'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info'}" class="h-5 w-5"></i>
                <span class="text-sm font-medium">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        lucide.createIcons();
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Global function for marking medication as taken
window.markTaken = function(medicine, time, prescriptionId, buttonElement) {
    console.log('markTaken called:', { medicine, time, prescriptionId });
    
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    fetch('/api/mark-taken', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ medicine, time, prescriptionId })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Mark taken response:', data);
        if (data.success) {
            buttonElement.textContent = 'Taken ✓';
            buttonElement.disabled = true;
            buttonElement.className = 'px-3 py-1 rounded-md bg-green-100 border border-green-200 text-green-700 text-xs';
            
            // Refresh adherence data
            if (window.mediMindApp) {
                window.mediMindApp.loadAdherenceData();
            }
        }
    })
    .catch(error => {
        console.error('Failed to mark medication as taken:', error);
    });
}

// Auth functions
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const loginBtn = document.getElementById('loginBtn');
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    
    if (token && user.email) {
        // User is logged in
        if (loginBtn) loginBtn.classList.add('hidden');
        if (userProfile) userProfile.classList.remove('hidden');
        if (userName) userName.textContent = user.name || user.email;
    } else {
        // Not authenticated
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (userProfile) userProfile.classList.add('hidden');
    }
}

function showPastPrescriptions() {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    fetch('/api/prescriptions', { headers })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(prescriptions => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">Past Prescriptions</h3>
                        <div class="flex gap-2">
                            <button onclick="exportPrescriptionsPDF()" class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                                Export PDF
                            </button>
                            <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                                <i data-lucide="x" class="h-5 w-5"></i>
                            </button>
                        </div>
                    </div>
                    <div class="space-y-3">
                        ${prescriptions.length === 0 ? '<p class="text-gray-500 text-center py-8">No prescriptions found. Create your first prescription analysis!</p>' : prescriptions.map(p => `
                            <div class="p-4 border rounded-lg cursor-pointer hover:bg-gray-50" onclick="showPrescriptionDetails('${p._id}')">
                                <div class="flex justify-between items-start">
                                    <div class="flex-1">
                                        <div class="font-medium text-lg">${p.diagnosis || 'Prescription Analysis'}</div>
                                        <div class="text-sm text-gray-600 mt-1">${new Date(p.createdAt).toLocaleDateString()}</div>
                                        <div class="text-xs text-gray-500 mt-2">${p.medications?.length || 0} medications prescribed</div>
                                        ${p.medications ? `
                                            <div class="mt-2 flex flex-wrap gap-1">
                                                ${p.medications.slice(0, 3).map(med => `
                                                    <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">${med.name}</span>
                                                `).join('')}
                                                ${p.medications.length > 3 ? `<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">+${p.medications.length - 3} more</span>` : ''}
                                            </div>
                                        ` : ''}
                                    </div>
                                    <i data-lucide="chevron-right" class="h-5 w-5 text-gray-400"></i>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            lucide.createIcons();
        })
        .catch(error => {
            console.error('Failed to load prescriptions:', error);
            alert('Failed to load prescriptions. Please try again.');
        });
}

function exportUserData() {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    fetch('/api/export-data', { headers })
        .then(response => response.text())
        .then(html => {
            const newWindow = window.open();
            newWindow.document.write(html);
            newWindow.document.close();
        })
        .catch(error => {
            console.error('Export failed:', error);
        });
}

function showPrescriptionDetails(prescriptionId) {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    fetch(`/api/prescriptions/${prescriptionId}`, { headers })
        .then(response => response.json())
        .then(prescription => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">Prescription Details</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                            <i data-lucide="x" class="h-5 w-5"></i>
                        </button>
                    </div>
                    <div class="space-y-4">
                        <div class="p-4 bg-blue-50 rounded-lg">
                            <h4 class="font-semibold text-blue-900">Diagnosis</h4>
                            <p class="text-blue-800">${prescription.diagnosis || 'Not specified'}</p>
                        </div>
                        <div class="p-4 bg-purple-50 rounded-lg">
                            <h4 class="font-semibold text-purple-900 mb-3">Medications (${prescription.medications?.length || 0})</h4>
                            <div class="space-y-3">
                                ${prescription.medications?.map(med => `
                                    <div class="p-3 bg-white rounded border">
                                        <div class="font-medium">${med.name}</div>
                                        <div class="text-sm text-gray-600 mt-1">
                                            <span class="inline-block mr-4"><strong>Dosage:</strong> ${med.dosage || 'As prescribed'}</span>
                                            <span class="inline-block mr-4"><strong>Frequency:</strong> ${med.frequency || 'As directed'}</span>
                                            <span class="inline-block"><strong>Duration:</strong> ${med.duration || 'Complete course'}</span>
                                        </div>
                                        ${med.instructions ? `<div class="text-sm text-gray-700 mt-2"><strong>Instructions:</strong> ${med.instructions}</div>` : ''}
                                    </div>
                                `).join('') || '<p class="text-gray-500">No medications recorded</p>'}
                            </div>
                        </div>
                        <div class="p-4 bg-green-50 rounded-lg">
                            <h4 class="font-semibold text-green-900">Analysis Date</h4>
                            <p class="text-green-800">${new Date(prescription.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            lucide.createIcons();
        })
        .catch(error => {
            console.error('Failed to load prescription details:', error);
        });
}

function exportPrescriptionsPDF() {
    window.print();
}

function showSettings() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">Settings</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                    <i data-lucide="x" class="h-5 w-5"></i>
                </button>
            </div>
            <div class="space-y-4">
                <div class="p-3 border rounded-lg">
                    <div class="font-medium">Account</div>
                    <div class="text-sm text-gray-600">${user.email || 'Unknown User'}</div>
                    <div class="text-xs text-gray-500">Full Account</div>
                </div>
                <div class="p-3 border rounded-lg">
                    <div class="font-medium">Notifications</div>
                    <div class="text-sm text-gray-600">Browser notifications for medication reminders</div>
                    <button onclick="requestNotificationPermission()" class="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                        Enable Notifications
                    </button>
                </div>
                <div class="p-3 border rounded-lg">
                    <div class="font-medium">Data Privacy</div>
                    <div class="text-sm text-gray-600">Your prescription data is processed securely and not shared</div>
                </div>
                <div class="p-3 border rounded-lg">
                    <div class="font-medium">Version</div>
                    <div class="text-sm text-gray-600">MediMind v1.0.0</div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    lucide.createIcons();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Only redirect if on dashboard page and not authenticated
    if (window.location.pathname === '/dashboard') {
        const token = localStorage.getItem('token');
        
        if (!token) {
            window.location.href = '/';
            return;
        }
    }
    
    checkAuth();
    
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = '/';
        });
    }
    
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            const dropdown = document.getElementById('dropdownMenu');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            // Update menu user info
            const menuUserName = document.getElementById('menuUserName');
            const menuUserEmail = document.getElementById('menuUserEmail');
            
            if (user.email) {
                if (menuUserName) menuUserName.textContent = user.name || 'User';
                if (menuUserEmail) menuUserEmail.textContent = user.email;
            }
            
            dropdown.classList.toggle('hidden');
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('dropdownMenu');
        const menuBtn = document.getElementById('menuBtn');
        if (dropdown && !dropdown.contains(e.target) && !menuBtn.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        });
    }
    
    const viewPrescriptions = document.getElementById('viewPrescriptions');
    if (viewPrescriptions) {
        viewPrescriptions.addEventListener('click', (e) => {
            e.preventDefault();
            showPastPrescriptions();
        });
    }
    
    const exportData = document.getElementById('exportData');
    if (exportData) {
        exportData.addEventListener('click', (e) => {
            e.preventDefault();
            exportUserData();
        });
    }
    
    const settings = document.getElementById('settings');
    if (settings) {
        settings.addEventListener('click', (e) => {
            e.preventDefault();
            showSettings();
        });
    }
    
    // Only initialize MediMind on dashboard page
    if (window.location.pathname === '/dashboard') {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';
            return;
        }
        window.mediMindApp = new MediMind();
    }
});