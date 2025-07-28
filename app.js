document.addEventListener('DOMContentLoaded', () => {
    const adminView = document.getElementById('admin-view');
    const vcardView = document.getElementById('vcard-view');
    const fileInput = document.getElementById('excel-file');
    const employeeListDiv = document.getElementById('employee-list');
    const downloadSection = document.getElementById('download-data-section');
    const downloadBtn = document.getElementById('download-data-btn');

    const urlParams = new URLSearchParams(window.location.search);
    const employeeId = urlParams.get('id');

    if (employeeId) {
        // --- Visitor View ---
        // 'employeeData' is now globally available from `employees-data.js`
        if (typeof employeeData !== 'undefined' && employeeData[employeeId - 1]) {
            const employee = employeeData[employeeId - 1];
            renderVCard(employee);
            vcardView.classList.add('active');
        } else {
            showError("Employee not found or data file is missing. The administrator needs to update the system.");
        }
    } else {
        // --- Admin View ---
        adminView.classList.add('active');
        fileInput.addEventListener('change', handleFile);
    }

    function handleFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const employees = XLSX.utils.sheet_to_json(worksheet);

            renderEmployeeList(employees);
            prepareDataFile(employees);
        };
        reader.readAsArrayBuffer(file);
    }
    
    function prepareDataFile(employees) {
        // Prepare the content for the employees-data.js file
        const fileContent = `const employeeData = ${JSON.stringify(employees, null, 2)};`;
        
        const blob = new Blob([fileContent], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        
        downloadBtn.href = url;
        downloadBtn.download = 'employees-data.js';
        downloadSection.style.display = 'block';
    }

    function renderEmployeeList(employees) {
        if (!employees || employees.length === 0) {
            employeeListDiv.innerHTML = '<p>No employees found in the file.</p>';
            return;
        }

        employeeListDiv.innerHTML = ''; // Clear list
        employees.forEach((emp, index) => {
            const empId = index + 1; // Simple ID based on row number
            const item = document.createElement('div');
            item.className = 'employee-item';
            item.innerHTML = `
                <div class="employee-info">
                    <img src="${emp.Photo || 'https://via.placeholder.com/50'}" alt="${emp.Name}">
                    <div>
                        <strong>${emp.Name}</strong><br>
                        <small>${emp.Designation}</small>
                    </div>
                </div>
                <div class="actions">
                    <button class="qr-btn" data-id="${empId}">Generate QR</button>
                    <button class="link-btn" data-id="${empId}">Get Link</button>
                </div>
                <div id="qr-container-${empId}" class="qr-code-container" style="display:none;"></div>
            `;
            employeeListDiv.appendChild(item);
        });

        document.querySelectorAll('.qr-btn').forEach(btn => btn.addEventListener('click', generateQRCode));
        document.querySelectorAll('.link-btn').forEach(btn => btn.addEventListener('click', showShareLink));
    }

    function getShareableLink(empId) {
        const url = new URL(window.location.origin + window.location.pathname);
        url.search = `?id=${empId}`;
        return url.href;
    }

    function generateQRCode(event) {
        const empId = event.target.dataset.id;
        const link = getShareableLink(empId);
        const qrContainer = document.getElementById(`qr-container-${empId}`);
        
        qrContainer.innerHTML = '';
        qrContainer.style.display = 'block';

        new EasyQRCodeJS(qrContainer, {
            text: link,
            width: 128,
            height: 128,
        });

        qrContainer.innerHTML += `<div class="share-link">Shareable Link: ${link}</div>`;
    }

    function showShareLink(event) {
        const empId = event.target.dataset.id;
        const link = getShareableLink(empId);
        window.prompt("Copy this link to share:", link);
    }
    
    function renderVCard(emp) {
        const empId = employeeData.findIndex(e => e.Name === emp.Name) + 1;
        vcardView.innerHTML = `
            <div class="vcard">
                <img src="${emp.Photo || 'https://via.placeholder.com/150'}" alt="${emp.Name}" class="profile-photo">
                <div class="name">${emp.Name}</div>
                <div class="designation">${emp.Designation}</div>
                <div class="company-details">
                    <div class="company-name">SELCO Solar Light Private Limited</div>
                    <div class="company-contact">
                        <a href="https://www.selco-india.com" target="_blank">www.selco-india.com</a>
                        <span>&bull;</span>
                        <a href="mailto:selco@selco-india.com">selco@selco-india.com</a>
                    </div>
                </div>
                <div class="contact-info">
                    <div class="contact-item">
                        <svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"></path></svg>
                        <a href="tel:${emp['Phone Number']}">${emp['Phone Number']}</a>
                    </div>
                    <div class="contact-item">
                        <svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"></path></svg>
                        <a href="mailto:${emp['Email Id']}">${emp['Email Id']}</a>
                    </div>
                    <div class="contact-item">
                        <svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path></svg>
                        <span>${emp.Address}</span>
                    </div>
                </div>
                <a href="#" id="save-contact-btn" class="save-contact-btn">Save to Contacts</a>
            </div>
        `;
        
        document.getElementById('save-contact-btn').addEventListener('click', (e) => {
            e.preventDefault();
            downloadVcf(emp, empId);
        });
    }

    function downloadVcf(emp, empId) {
        const vcfString = `BEGIN:VCARD
