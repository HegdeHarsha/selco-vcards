// SELCO VCards Application
class SELCOVCards {
    constructor() {
        this.employees = [];
        this.currentEmployee = null;
        this.currentQREmployee = null;
        this.init();
    }

    init() {
        this.loadEmployeesFromStorage();
        this.setupEventListeners();
        this.checkUrlParams();
        this.updateUI();
    }

    setupEventListeners() {
        // File upload
        const fileInput = document.getElementById('file-input');
        const fileUploadArea = document.getElementById('file-upload-area');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        
        // Drag and drop
        if (fileUploadArea) {
            fileUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileUploadArea.classList.add('dragover');
            });

            fileUploadArea.addEventListener('dragleave', () => {
                fileUploadArea.classList.remove('dragover');
            });

            fileUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                fileUploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.processFile(files[0]);
                }
            });
        }

        // Directory actions
        const generateAllBtn = document.getElementById('generate-all-qr');
        const uploadNewBtn = document.getElementById('upload-new-file');
        const clearDataBtn = document.getElementById('clear-data-btn');

        if (generateAllBtn) {
            generateAllBtn.addEventListener('click', () => this.generateAllQRCodes());
        }
        if (uploadNewBtn) {
            uploadNewBtn.addEventListener('click', () => this.showUploadSection());
        }
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => this.clearAllData());
        }

        // VCard actions
        const saveContactBtn = document.getElementById('save-contact-btn');
        const backToDirectoryBtn = document.getElementById('back-to-directory-btn');

        if (saveContactBtn) {
            saveContactBtn.addEventListener('click', () => this.downloadVCard());
        }
        if (backToDirectoryBtn) {
            backToDirectoryBtn.addEventListener('click', () => this.showDirectory());
        }

        // Modal actions
        const closeQRModalBtn = document.getElementById('close-qr-modal');
        const downloadQRBtn = document.getElementById('download-qr-btn');
        const copyLinkBtn = document.getElementById('copy-link-btn');

        if (closeQRModalBtn) {
            closeQRModalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeQRModal();
            });
        }
        
        if (downloadQRBtn) {
            downloadQRBtn.addEventListener('click', () => this.downloadQRCode());
        }
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => this.copyShareableLink());
        }

        // Close modal on outside click
        const qrModal = document.getElementById('qr-modal');
        if (qrModal) {
            qrModal.addEventListener('click', (e) => {
                if (e.target === qrModal) {
                    this.closeQRModal();
                }
            });
        }

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeQRModal();
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', () => this.checkUrlParams());
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    async processFile(file) {
        // Validate file type
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv' // .csv
        ];

        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
            this.showError('Please upload a valid Excel (.xlsx, .xls) or CSV file.');
            return;
        }

        this.showProcessing(true);
        this.hideError();

        try {
            const data = await this.readFile(file);
            const employees = this.parseEmployeeData(data);
            
            if (employees.length === 0) {
                throw new Error('No valid employee data found in the file.');
            }

            this.employees = employees;
            this.saveEmployeesToStorage();
            this.showDirectory();
            this.showProcessing(false);
            this.showSuccessMessage(`Successfully processed ${employees.length} employees!`);
            
        } catch (error) {
            this.showProcessing(false);
            this.showError(`Error processing file: ${error.message}`);
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error('Failed to read file content'));
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }

    parseEmployeeData(data) {
        const employees = [];
        const requiredFields = ['Name', 'Designation', 'Phone Number', 'Email Id'];

        data.forEach((row, index) => {
            // Check if row has required fields
            const missingFields = requiredFields.filter(field => !row[field] || row[field].toString().trim() === '');
            
            if (missingFields.length === 0) {
                const employee = {
                    id: Date.now() + index,
                    name: row['Name'].toString().trim(),
                    designation: row['Designation'].toString().trim(),
                    phone: row['Phone Number'].toString().trim(),
                    email: row['Email Id'].toString().trim(),
                    address: (row['Address'] || '').toString().trim(),
                    photo: (row['Photo'] || this.getDefaultPhoto()).toString().trim()
                };

                // Validate email format
                if (this.isValidEmail(employee.email)) {
                    employees.push(employee);
                }
            }
        });

        return employees;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    getDefaultPhoto() {
        const defaultPhotos = [
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
        ];
        return defaultPhotos[Math.floor(Math.random() * defaultPhotos.length)];
    }

    showDirectory() {
        const mainApp = document.getElementById('main-app');
        const uploadSection = document.getElementById('upload-section');
        const employeeDirectory = document.getElementById('employee-directory');
        const employeeVCard = document.getElementById('employee-vcard');
        const clearDataBtn = document.getElementById('clear-data-btn');

        if (mainApp) mainApp.classList.remove('hidden');
        if (uploadSection) uploadSection.classList.add('hidden');
        if (employeeDirectory) employeeDirectory.classList.remove('hidden');
        if (employeeVCard) employeeVCard.classList.add('hidden');
        if (clearDataBtn) clearDataBtn.classList.remove('hidden');
        
        this.renderEmployeeGrid();
        this.updateUrl();
    }

    showUploadSection() {
        const mainApp = document.getElementById('main-app');
        const uploadSection = document.getElementById('upload-section');
        const employeeDirectory = document.getElementById('employee-directory');
        const employeeVCard = document.getElementById('employee-vcard');
        const clearDataBtn = document.getElementById('clear-data-btn');

        if (mainApp) mainApp.classList.remove('hidden');
        if (uploadSection) uploadSection.classList.remove('hidden');
        if (employeeDirectory) employeeDirectory.classList.add('hidden');
        if (employeeVCard) employeeVCard.classList.add('hidden');
        if (clearDataBtn) clearDataBtn.classList.add('hidden');
        
        // Reset file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
        this.hideError();
        this.showProcessing(false);
        this.updateUrl();
    }

    showEmployeeVCard(employeeId) {
        const employee = this.employees.find(emp => emp.id == employeeId);
        if (!employee) return;

        this.currentEmployee = employee;
        
        // Update VCard content
        const vcardPhoto = document.getElementById('vcard-photo');
        const vcardName = document.getElementById('vcard-name');
        const vcardDesignation = document.getElementById('vcard-designation');
        const vcardPhone = document.getElementById('vcard-phone');
        const vcardEmail = document.getElementById('vcard-email');
        const vcardAddress = document.getElementById('vcard-address');

        if (vcardPhoto) {
            vcardPhoto.src = employee.photo;
            vcardPhoto.alt = `${employee.name} - Photo`;
        }
        if (vcardName) vcardName.textContent = employee.name;
        if (vcardDesignation) vcardDesignation.textContent = employee.designation;
        if (vcardPhone) vcardPhone.textContent = employee.phone;
        if (vcardEmail) vcardEmail.textContent = employee.email;
        if (vcardAddress) vcardAddress.textContent = employee.address || 'Not specified';

        // Show VCard page
        const mainApp = document.getElementById('main-app');
        const employeeVCard = document.getElementById('employee-vcard');
        
        if (mainApp) mainApp.classList.add('hidden');
        if (employeeVCard) employeeVCard.classList.remove('hidden');
        
        this.updateUrl(`?employee=${employeeId}`);
    }

    renderEmployeeGrid() {
        const grid = document.getElementById('employee-grid');
        if (!grid) return;
        
        grid.innerHTML = '';

        this.employees.forEach(employee => {
            const card = document.createElement('div');
            card.className = 'employee-card';
            
            // Create image with error handling
            const photoUrl = employee.photo || this.getDefaultPhoto();
            
            card.innerHTML = `
                <img src="${photoUrl}" alt="${employee.name}" class="employee-card-photo" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRkZGRkZGIi8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNjAiIHI9IjI1IiBmaWxsPSIjQ0NDQ0NDIi8+CjxwYXRoIGQ9Ik0zMCAxMjBDMzAgMTA0LjUzNiA0Mi41MzYgOTIgNTggOTJINTJDNjcuNDY0IDkyIDgwIDEwNC41MzYgODAgMTIwVjE1MEgzMFYxMjBaIiBmaWxsPSIjQ0NDQ0NDIi8+Cjwvc3ZnPgo='">
                <h3 class="employee-card-name">${employee.name}</h3>
                <p class="employee-card-designation">${employee.designation}</p>
                <div class="employee-card-actions">
                    <button class="btn btn--primary btn--sm" data-employee-id="${employee.id}" data-action="generate-qr">Generate QR</button>
                    <button class="btn btn--outline btn--sm" data-employee-id="${employee.id}" data-action="view-vcard">View VCard</button>
                </div>
            `;
            
            // Add event listeners to buttons
            const generateQRBtn = card.querySelector('[data-action="generate-qr"]');
            const viewVCardBtn = card.querySelector('[data-action="view-vcard"]');
            
            if (generateQRBtn) {
                generateQRBtn.addEventListener('click', () => this.generateQRCode(employee.id));
            }
            if (viewVCardBtn) {
                viewVCardBtn.addEventListener('click', () => this.showEmployeeVCard(employee.id));
            }
            
            grid.appendChild(card);
        });
    }

    generateQRCode(employeeId) {
        const employee = this.employees.find(emp => emp.id == employeeId);
        if (!employee) return;

        this.currentQREmployee = employee;
        const shareableUrl = `${window.location.origin}${window.location.pathname}?employee=${employeeId}`;
        
        // Clear previous QR code
        const container = document.getElementById('qr-code-container');
        if (!container) return;
        
        container.innerHTML = '';

        // Generate QR code
        QRCode.toCanvas(shareableUrl, {
            width: 256,
            height: 256,
            color: {
                dark: '#1F3343',
                light: '#FFFFFF'
            }
        })
        .then(canvas => {
            container.appendChild(canvas);
            
            // Update modal content
            const modalTitle = document.getElementById('qr-modal-title');
            const shareableLink = document.getElementById('shareable-link');
            
            if (modalTitle) modalTitle.textContent = `${employee.name} - QR Code`;
            if (shareableLink) shareableLink.value = shareableUrl;
            
            // Show modal
            const modal = document.getElementById('qr-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
        })
        .catch(error => {
            console.error('QR Code generation error:', error);
            this.showError('Failed to generate QR code');
        });
    }

    generateAllQRCodes() {
        if (this.employees.length === 0) return;

        this.showLoadingOverlay('Generating QR codes for all employees...');

        // Simulate processing time then show first employee's QR
        setTimeout(() => {
            this.hideLoadingOverlay();
            if (this.employees.length > 0) {
                this.generateQRCode(this.employees[0].id);
                this.showSuccessMessage('QR codes ready! Click on individual employees to generate their QR codes.');
            }
        }, 1500);
    }

    downloadQRCode() {
        const canvas = document.querySelector('#qr-code-container canvas');
        if (!canvas) return;

        const employee = this.currentQREmployee || this.employees[0];
        const link = document.createElement('a');
        link.download = `${employee.name.replace(/\s+/g, '_')}-qr-code.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showSuccessMessage('QR code downloaded successfully!');
    }

    downloadVCard() {
        if (!this.currentEmployee) return;

        const employee = this.currentEmployee;
        const vcard = this.generateVCardContent(employee);
        
        const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${employee.name.replace(/\s+/g, '_')}.vcf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showSuccessMessage('Contact saved successfully!');
    }

    generateVCardContent(employee) {
        return `BEGIN:VCARD
VERSION:3.0
FN:${employee.name}
N:${employee.name.split(' ').reverse().join(';')}
ORG:SELCO Solar Light Private Limited
TITLE:${employee.designation}
TEL:${employee.phone}
EMAIL:${employee.email}
ADR:;;${employee.address};;;;
URL:www.selco-india.com
NOTE:SELCO Solar Light Private Limited - www.selco-india.com - selco@selco-india.com
END:VCARD`;
    }

    copyShareableLink() {
        const linkInput = document.getElementById('shareable-link');
        if (!linkInput) return;
        
        linkInput.select();
        linkInput.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            this.showSuccessMessage('Link copied to clipboard!');
        } catch (err) {
            // Fallback for modern browsers
            if (navigator.clipboard) {
                navigator.clipboard.writeText(linkInput.value).then(() => {
                    this.showSuccessMessage('Link copied to clipboard!');
                }).catch(() => {
                    this.showError('Failed to copy link');
                });
            } else {
                this.showError('Failed to copy link');
            }
        }
    }

    closeQRModal() {
        const modal = document.getElementById('qr-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        
        // Clear QR code container
        const container = document.getElementById('qr-code-container');
        if (container) {
            container.innerHTML = '';
        }
        
        this.currentQREmployee = null;
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all employee data? This action cannot be undone.')) {
            localStorage.removeItem('selco_employees');
            this.employees = [];
            this.showUploadSection();
            this.showSuccessMessage('All data cleared successfully!');
        }
    }

    saveEmployeesToStorage() {
        try {
            localStorage.setItem('selco_employees', JSON.stringify(this.employees));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    loadEmployeesFromStorage() {
        const stored = localStorage.getItem('selco_employees');
        if (stored) {
            try {
                this.employees = JSON.parse(stored);
            } catch (error) {
                console.error('Failed to load employees from storage:', error);
                this.employees = [];
            }
        }
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const employeeId = urlParams.get('employee');
        
        if (employeeId && this.employees.length > 0) {
            this.showEmployeeVCard(employeeId);
        } else if (this.employees.length > 0) {
            this.showDirectory();
        } else {
            this.showUploadSection();
        }
    }

    updateUrl(params = '') {
        const newUrl = `${window.location.pathname}${params}`;
        window.history.pushState({}, '', newUrl);
    }

    updateUI() {
        if (this.employees.length > 0) {
            this.showDirectory();
        } else {
            this.showUploadSection();
        }
    }

    showProcessing(show) {
        const indicator = document.getElementById('processing-indicator');
        if (indicator) {
            if (show) {
                indicator.classList.remove('hidden');
            } else {
                indicator.classList.add('hidden');
            }
        }
    }

    showError(message) {
        const errorDisplay = document.getElementById('error-display');
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) errorMessage.textContent = message;
        if (errorDisplay) errorDisplay.classList.remove('hidden');
    }

    hideError() {
        const errorDisplay = document.getElementById('error-display');
        if (errorDisplay) errorDisplay.classList.add('hidden');
    }

    showSuccessMessage(message) {
        // Create status message element
        const statusDiv = document.createElement('div');
        statusDiv.className = 'status status--success status-message';
        statusDiv.textContent = message;
        
        document.body.appendChild(statusDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.parentNode.removeChild(statusDiv);
            }
        }, 3000);
    }

    showLoadingOverlay(message) {
        // Remove existing overlay if any
        this.hideLoadingOverlay();
        
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

// Initialize the application
let app;

// Add some sample data for demonstration
document.addEventListener('DOMContentLoaded', () => {
    app = new SELCOVCards();
    
    // Only add sample data if no data exists
    if (app.employees.length === 0) {
        const sampleData = [
            {
                "id": 1001,
                "name": "Rajesh Kumar",
                "designation": "Solar Engineer", 
                "phone": "+91-9876543210",
                "email": "rajesh.k@selco-india.com",
                "address": "123 Solar Street, Bangalore",
                "photo": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
            },
            {
                "id": 1002,
                "name": "Priya Sharma",
                "designation": "Project Manager",
                "phone": "+91-9876543211", 
                "email": "priya.s@selco-india.com",
                "address": "456 Sun Avenue, Bangalore",
                "photo": "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face"
            },
            {
                "id": 1003,
                "name": "Arjun Reddy",
                "designation": "Business Development Executive",
                "phone": "+91-9876543212",
                "email": "arjun.r@selco-india.com", 
                "address": "789 Energy Park, Bangalore",
                "photo": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
            },
            {
                "id": 1004,
                "name": "Sneha Patel", 
                "designation": "Financial Analyst",
                "phone": "+91-9876543213",
                "email": "sneha.p@selco-india.com",
                "address": "321 Green Valley, Bangalore", 
                "photo": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
            }
        ];

        // Add sample employees for demonstration
        app.employees = sampleData;
        app.saveEmployeesToStorage();
        app.updateUI();
    }
});