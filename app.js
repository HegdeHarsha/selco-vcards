// Application State
let employees = [];
let currentEmployee = null;

// Sample data
const sampleEmployees = [
    {
        id: "EMP001",
        name: "Rajesh Kumar",
        designation: "Solar Engineer",
        phone: "+91-9876543210",
        email: "rajesh.kumar@selco-india.com",
        address: "HSR Layout, Bangalore, Karnataka 560102",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    {
        id: "EMP002", 
        name: "Priya Sharma",
        designation: "Project Manager",
        phone: "+91-9876543211",
        email: "priya.sharma@selco-india.com",
        address: "Koramangala, Bangalore, Karnataka 560034",
        photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    {
        id: "EMP003",
        name: "Arjun Reddy",
        designation: "Business Development Executive", 
        phone: "+91-9876543212",
        email: "arjun.reddy@selco-india.com",
        address: "JP Nagar, Bangalore, Karnataka 560078",
        photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    {
        id: "EMP004",
        name: "Sneha Patel",
        designation: "Financial Analyst",
        phone: "+91-9876543213", 
        email: "sneha.patel@selco-india.com",
        address: "Electronic City, Bangalore, Karnataka 560100",
        photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    }
];

// Company Information
const companyInfo = {
    name: "SELCO Solar Light Private Limited",
    website: "www.selco-india.com",
    email: "selco@selco-india.com",
    description: "Leading provider of sustainable solar energy solutions"
};

// DOM Elements
const adminView = document.getElementById('adminView');
const employeeListView = document.getElementById('employeeListView');
const profileView = document.getElementById('profileView');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const qrSection = document.getElementById('qrSection');
const qrDisplaySection = document.getElementById('qrDisplaySection');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorModal = document.getElementById('errorModal');

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    handleRouting();
});

function initializeApp() {
    // Load sample data if no data exists
    const savedEmployees = localStorage.getItem('selco_employees');
    if (!savedEmployees) {
        employees = [...sampleEmployees];
        saveEmployees();
        // Generate QR codes after a short delay to ensure DOM is ready
        setTimeout(() => {
            generateQRCodesForAll();
        }, 100);
    } else {
        employees = JSON.parse(savedEmployees);
        // Regenerate QR codes if they don't exist
        const hasQRCodes = employees.some(emp => emp.qrCode);
        if (!hasQRCodes) {
            setTimeout(() => {
                generateQRCodesForAll();
            }, 100);
        }
    }
    
    updateEmployeeCount();
    renderEmployeeList();
}

function setupEventListeners() {
    // Navigation
    document.getElementById('adminBtn').addEventListener('click', () => showView('admin'));
    document.getElementById('employeeListBtn').addEventListener('click', () => showView('employeeList'));
    
    // File upload
    fileInput.addEventListener('change', handleFileUpload);
    
    // Admin actions
    document.getElementById('generateQRBtn').addEventListener('click', generateQRCodes);
    document.getElementById('clearDataBtn').addEventListener('click', clearData);
    document.getElementById('downloadAllQRBtn').addEventListener('click', downloadAllQRCodes);
    document.getElementById('viewQRCodesBtn').addEventListener('click', toggleQRDisplay);
    
    // Profile actions
    document.getElementById('saveContactBtn').addEventListener('click', saveToContacts);
    document.getElementById('backToListBtn').addEventListener('click', () => showView('employeeList'));
    
    // Modal
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('errorOkBtn').addEventListener('click', closeModal);
    
    // Handle browser back/forward
    window.addEventListener('popstate', handleRouting);
}

function handleRouting() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    if (path.includes('/employee/') || hash.includes('#employee/')) {
        const employeeId = path.split('/employee/')[1] || hash.split('#employee/')[1];
        if (employeeId) {
            showEmployeeProfile(employeeId);
            return;
        }
    }
    
    // Default to admin view
    showView('admin');
}

function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    switch(viewName) {
        case 'admin':
            adminView.classList.add('active');
            updateAdminDashboard();
            break;
        case 'employeeList':
            employeeListView.classList.add('active');
            renderEmployeeList();
            break;
        case 'profile':
            profileView.classList.add('active');
            break;
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    showLoading();
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let data;
            
            if (file.name.endsWith('.csv')) {
                data = parseCSV(e.target.result);
            } else {
                const workbook = XLSX.read(e.target.result, { type: 'binary' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                data = XLSX.utils.sheet_to_json(firstSheet);
            }
            
            processEmployeeData(data);
            hideLoading();
        } catch (error) {
            hideLoading();
            showError('Error reading file: ' + error.message);
        }
    };
    
    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    } else {
        reader.readAsBinaryString(file);
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
    }
    
    return data;
}

function processEmployeeData(data) {
    const processedEmployees = data.map((row, index) => {
        return {
            id: row.ID || row.id || `EMP${String(index + 1).padStart(3, '0')}`,
            name: row.Name || row.name || '',
            designation: row.Designation || row.designation || '',
            phone: row.Phone || row.phone || '',
            email: row.Email || row.email || '',
            address: row.Address || row.address || '',
            photo: row.Photo || row.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        };
    });
    
    employees = processedEmployees;
    saveEmployees();
    displayPreview();
    updateEmployeeCount();
}

function displayPreview() {
    const tbody = document.querySelector('#previewTable tbody');
    tbody.innerHTML = '';
    
    employees.forEach(emp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${emp.name}</td>
            <td>${emp.designation}</td>
            <td>${emp.phone}</td>
            <td>${emp.email}</td>
            <td>${emp.address}</td>
        `;
        tbody.appendChild(row);
    });
    
    previewSection.classList.remove('hidden');
}

function updateEmployeeCount() {
    document.getElementById('employeeCount').textContent = `${employees.length} employees found`;
}

function generateQRCodes() {
    if (employees.length === 0) {
        showError('No employee data to generate QR codes for.');
        return;
    }
    
    showLoading();
    
    setTimeout(() => {
        generateQRCodesForAll();
        qrSection.classList.remove('hidden');
        hideLoading();
        showSuccess('QR codes generated successfully!');
    }, 1000);
}

function generateQRCodesForAll() {
    employees.forEach(emp => {
        const profileUrl = `${window.location.origin}${window.location.pathname}#employee/${emp.id}`;
        emp.qrCode = generateQRCodeDataURL(profileUrl);
    });
    saveEmployees();
}

function generateQRCodeDataURL(text) {
    // Create a temporary container for QR code generation
    const tempContainer = document.createElement('div');
    tempContainer.style.display = 'none';
    document.body.appendChild(tempContainer);
    
    try {
        const qr = new EasyQRCodeJS(tempContainer, {
            text: text,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: EasyQRCodeJS.CorrectLevel.H,
            drawer: 'canvas'
        });
        
        // Get the canvas element and convert to data URL
        const canvas = tempContainer.querySelector('canvas');
        const dataURL = canvas ? canvas.toDataURL() : null;
        
        // Clean up
        document.body.removeChild(tempContainer);
        
        return dataURL;
    } catch (error) {
        console.error('Error generating QR code:', error);
        document.body.removeChild(tempContainer);
        return null;
    }
}

function toggleQRDisplay() {
    if (qrDisplaySection.classList.contains('hidden')) {
        displayQRCodes();
        qrDisplaySection.classList.remove('hidden');
        document.getElementById('viewQRCodesBtn').textContent = 'Hide QR Codes';
    } else {
        qrDisplaySection.classList.add('hidden');
        document.getElementById('viewQRCodesBtn').textContent = 'View Generated QR Codes';
    }
}

function displayQRCodes() {
    const grid = document.getElementById('qrCodesGrid');
    grid.innerHTML = '';
    
    employees.forEach(emp => {
        const qrItem = document.createElement('div');
        qrItem.className = 'qr-item';
        
        const qrCodeHtml = emp.qrCode 
            ? `<img src="${emp.qrCode}" alt="QR Code for ${emp.name}" style="width: 150px; height: 150px; border: 1px solid #ccc;">`
            : '<div style="width: 150px; height: 150px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border: 1px solid #ccc;">QR Code</div>';
        
        qrItem.innerHTML = `
            <h4>${emp.name}</h4>
            <p>${emp.designation}</p>
            <div class="qr-code-display">
                ${qrCodeHtml}
            </div>
            <button class="btn btn--sm qr-download-btn" onclick="downloadQRCode('${emp.id}')">
                Download QR Code
            </button>
        `;
        grid.appendChild(qrItem);
    });
}

function downloadQRCode(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee || !employee.qrCode) {
        showError('QR code not available for download.');
        return;
    }
    
    const link = document.createElement('a');
    link.download = `${employee.name}_QRCode.png`;
    link.href = employee.qrCode;
    link.click();
}

function downloadAllQRCodes() {
    if (employees.length === 0) {
        showError('No QR codes to download.');
        return;
    }
    
    showLoading();
    
    const zip = new JSZip();
    let addedFiles = 0;
    
    employees.forEach(emp => {
        if (emp.qrCode) {
            try {
                const base64Data = emp.qrCode.split(',')[1];
                zip.file(`${emp.name}_QRCode.png`, base64Data, {base64: true});
                addedFiles++;
            } catch (error) {
                console.error('Error adding QR code to zip:', error);
            }
        }
    });
    
    if (addedFiles === 0) {
        hideLoading();
        showError('No valid QR codes found to download.');
        return;
    }
    
    zip.generateAsync({type: "blob"}).then(function(content) {
        const link = document.createElement('a');
        link.download = 'SELCO_Employee_QRCodes.zip';
        link.href = URL.createObjectURL(content);
        link.click();
        hideLoading();
        showSuccess(`Downloaded ${addedFiles} QR codes successfully!`);
    }).catch(function(error) {
        hideLoading();
        showError('Error creating zip file: ' + error.message);
    });
}

function renderEmployeeList() {
    const grid = document.getElementById('employeeGrid');
    grid.innerHTML = '';
    
    if (employees.length === 0) {
        grid.innerHTML = '<p class="color-text-secondary">No employees found. Please upload employee data from the admin dashboard.</p>';
        return;
    }
    
    employees.forEach(emp => {
        const card = document.createElement('div');
        card.className = 'employee-card';
        card.onclick = () => showEmployeeProfile(emp.id);
        
        card.innerHTML = `
            <div class="employee-header">
                <div class="employee-photo">
                    <img src="${emp.photo}" alt="${emp.name}" 
                         onerror="this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'"
                         onload="this.style.opacity='1'" 
                         style="opacity: 0; transition: opacity 0.3s;">
                </div>
                <div class="employee-info">
                    <h3>${emp.name}</h3>
                    <p>${emp.designation}</p>
                </div>
            </div>
            <div class="employee-details">
                <div><strong>Phone:</strong> ${emp.phone}</div>
                <div><strong>Email:</strong> ${emp.email}</div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function showEmployeeProfile(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) {
        showError('Employee not found.');
        return;
    }
    
    currentEmployee = employee;
    
    // Update URL without page reload
    window.history.pushState({}, '', `#employee/${employeeId}`);
    
    // Populate profile data
    const profilePhoto = document.getElementById('profilePhoto');
    profilePhoto.src = employee.photo;
    profilePhoto.alt = employee.name;
    profilePhoto.style.opacity = '0';
    profilePhoto.onload = () => { profilePhoto.style.opacity = '1'; };
    profilePhoto.onerror = () => { 
        profilePhoto.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face';
    };
    
    document.getElementById('profileName').textContent = employee.name;
    document.getElementById('profileDesignation').textContent = employee.designation;
    document.getElementById('profilePhone').textContent = employee.phone;
    document.getElementById('profileEmail').textContent = employee.email;
    document.getElementById('profileAddress').textContent = employee.address;
    
    // Generate QR code for profile
    displayProfileQRCode(employee);
    
    showView('profile');
}

function displayProfileQRCode(employee) {
    const qrContainer = document.getElementById('profileQRCode');
    qrContainer.innerHTML = '';
    
    if (employee.qrCode) {
        const img = document.createElement('img');
        img.src = employee.qrCode;
        img.alt = `QR Code for ${employee.name}`;
        img.style.cssText = 'width: 200px; height: 200px; border: 1px solid #ccc;';
        qrContainer.appendChild(img);
    } else {
        // Generate QR code on the fly
        const profileUrl = `${window.location.origin}${window.location.pathname}#employee/${employee.id}`;
        
        try {
            const qr = new EasyQRCodeJS(qrContainer, {
                text: profileUrl,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: EasyQRCodeJS.CorrectLevel.H,
                drawer: 'canvas'
            });
        } catch (error) {
            console.error('Error generating profile QR code:', error);
            qrContainer.innerHTML = '<div style="width: 200px; height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border: 1px solid #ccc;">QR Code Unavailable</div>';
        }
    }
}

function saveToContacts() {
    if (!currentEmployee) return;
    
    const vCardData = generateVCard(currentEmployee);
    const blob = new Blob([vCardData], { type: 'text/vcard' });
    const link = document.createElement('a');
    link.download = `${currentEmployee.name}.vcf`;
    link.href = URL.createObjectURL(blob);
    link.click();
    
    showSuccess('Contact saved! Check your downloads folder.');
}

function generateVCard(employee) {
    return `BEGIN:VCARD
VERSION:3.0
FN:${employee.name}
ORG:${companyInfo.name}
TITLE:${employee.designation}
TEL:${employee.phone}
EMAIL:${employee.email}
ADR:;;${employee.address};;;
URL:http://${companyInfo.website}
NOTE:${companyInfo.description}
END:VCARD`;
}

function clearData() {
    if (confirm('Are you sure you want to clear all employee data? This action cannot be undone.')) {
        employees = [];
        localStorage.removeItem('selco_employees');
        previewSection.classList.add('hidden');
        qrSection.classList.add('hidden');
        qrDisplaySection.classList.add('hidden');
        updateEmployeeCount();
        renderEmployeeList();
        fileInput.value = '';
        showSuccess('All employee data cleared.');
    }
}

function updateAdminDashboard() {
    if (employees.length > 0) {
        displayPreview();
        qrSection.classList.remove('hidden');
    }
}

function saveEmployees() {
    localStorage.setItem('selco_employees', JSON.stringify(employees));
}

function showLoading() {
    loadingIndicator.classList.remove('hidden');
}

function hideLoading() {
    loadingIndicator.classList.add('hidden');
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    errorModal.classList.remove('hidden');
}

function showSuccess(message) {
    // Create a temporary success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--color-success);
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1002;
        max-width: 300px;
        font-family: var(--font-family-base);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 3000);
}

function closeModal() {
    errorModal.classList.add('hidden');
}