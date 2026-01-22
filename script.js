// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadFormData();
    updateProgress();
});

// Track unsaved changes
let hasUnsavedChanges = false;
let lastExportTime = localStorage.getItem('lastExportTime');

// Generate or retrieve form ID (internal use only)
function getFormId() {
    let formId = localStorage.getItem('currentFormId');
    
    if (!formId) {
        formId = 'sso-' + Date.now();
        localStorage.setItem('currentFormId', formId);
    }
    
    return formId;
}

// Setup all event listeners
function setupEventListeners() {
    const form = document.getElementById('ssoForm');
    
    // Auto-save on input change
    form.addEventListener('input', debounce(function() {
        saveFormData();
        updateProgress();
        hasUnsavedChanges = true;
        updateExportWarning();
    }, 500));
    
    // Dynamic form sections based on selections
    document.getElementById('ssoProtocol').addEventListener('change', handleProtocolChange);
    document.getElementById('appType').addEventListener('change', saveFormData);
    document.querySelector('input[name="rolesRequired"]').parentElement.parentElement.addEventListener('change', handleRolesChange);
    document.querySelector('input[name="provisioningRequired"]').parentElement.parentElement.addEventListener('change', handleProvisioningChange);
    
    // Button actions
    document.getElementById('exportProgressBtn').addEventListener('click', exportProgressToFile);
    document.getElementById('importProgressBtn').addEventListener('click', function() {
        document.getElementById('importFileInput').click();
    });
    document.getElementById('importFileInput').addEventListener('change', importProgressFromFile);
    
    document.getElementById('exportBtn').addEventListener('click', exportToHtml);
    document.getElementById('clearBtn').addEventListener('click', clearForm);
}

// Handle protocol selection change
function handleProtocolChange(e) {
    const protocol = e.target.value;
    const samlSection = document.getElementById('samlSection');
    const oidcSection = document.getElementById('oidcSection');
    const otherProtocolGroup = document.getElementById('otherProtocolGroup');
    
    // Hide all protocol-specific sections
    samlSection.style.display = 'none';
    oidcSection.style.display = 'none';
    otherProtocolGroup.style.display = 'none';
    
    // Show relevant section
    if (protocol === 'saml') {
        samlSection.style.display = 'block';
    } else if (protocol === 'oidc' || protocol === 'oauth') {
        oidcSection.style.display = 'block';
    } else if (protocol === 'other') {
        otherProtocolGroup.style.display = 'block';
    }
    
    saveFormData();
    updateProgress();
}

// Handle roles requirement change
function handleRolesChange(e) {
    if (e.target.name === 'rolesRequired') {
        const rolesGroup = document.getElementById('rolesGroup');
        rolesGroup.style.display = e.target.value === 'yes' ? 'block' : 'none';
        saveFormData();
    }
}

// Handle provisioning requirement change
function handleProvisioningChange(e) {
    if (e.target.name === 'provisioningRequired') {
        const provisioningGroup = document.getElementById('provisioningGroup');
        provisioningGroup.style.display = e.target.value === 'yes' ? 'block' : 'none';
        saveFormData();
    }
}

// Save form data to localStorage
function saveFormData() {
    const formId = getFormId();
    const form = document.getElementById('ssoForm');
    const formData = new FormData(form);
    const data = {
        timestamp: new Date().toISOString(),
        formId: formId
    };
    
    // Text inputs, selects, textareas
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Checkboxes
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        data[checkbox.name] = checkbox.checked;
    });
    
    // Radio buttons
    const radioGroups = {};
    const radios = form.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        if (!radioGroups[radio.name]) {
            radioGroups[radio.name] = radio.checked ? radio.value : null;
        }
    });
    Object.assign(data, radioGroups);
    
    localStorage.setItem(`formData_${formId}`, JSON.stringify(data));
}

// Load form data from localStorage
function loadFormData() {
    const formId = getFormId();
    const savedData = localStorage.getItem(`formData_${formId}`);
    
    if (!savedData) return;
    
    const data = JSON.parse(savedData);
    const form = document.getElementById('ssoForm');
    
    // Load text inputs, selects, textareas
    for (let key in data) {
        const element = form.elements[key];
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = data[key] === true;
            } else if (element.type === 'radio') {
                const radio = form.querySelector(`input[name="${key}"][value="${data[key]}"]`);
                if (radio) radio.checked = true;
            } else {
                element.value = data[key];
            }
        }
    }
    
    // Trigger protocol change to show correct sections
    const protocolSelect = document.getElementById('ssoProtocol');
    if (protocolSelect.value) {
        handleProtocolChange({ target: protocolSelect });
    }
    
    // Trigger roles display
    const rolesRadio = form.querySelector('input[name="rolesRequired"]:checked');
    if (rolesRadio && rolesRadio.value === 'yes') {
        document.getElementById('rolesGroup').style.display = 'block';
    }
    
    // Trigger provisioning display
    const provisioningRadio = form.querySelector('input[name="provisioningRequired"]:checked');
    if (provisioningRadio && provisioningRadio.value === 'yes') {
        document.getElementById('provisioningGroup').style.display = 'block';
    }
}

// Calculate and update progress
function updateProgress() {
    const form = document.getElementById('ssoForm');
    const requiredFields = form.querySelectorAll('[required]');
    
    let filledRequired = 0;
    
    requiredFields.forEach(field => {
        if (field.value.trim() !== '' && field.value !== field.defaultValue) {
            filledRequired++;
        }
    });
    
    const requiredPercent = requiredFields.length > 0 ? (filledRequired / requiredFields.length) * 100 : 0;
    
    // Use required fields percentage for progress bar
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    
    progressFill.style.width = requiredPercent + '%';
    progressPercent.textContent = Math.round(requiredPercent) + '% (' + filledRequired + ' of ' + requiredFields.length + ' required fields)';
}

// Update export warning indicator
function updateExportWarning() {
    let warning = document.getElementById('exportWarning');
    
    if (hasUnsavedChanges) {
        if (!warning) {
            warning = document.createElement('div');
            warning.id = 'exportWarning';
            warning.className = 'export-warning';
            warning.innerHTML = `
                ⚠️ <strong>Reminder:</strong> You have made changes since your last file export.<br>
                <small>Your progress is auto-saved locally in this browser and will persist after closing, 
                but it's <strong>only stored on this device</strong>. To create a backup or share with others, 
                remember to export your progress to file.</small>
            `;
            
            const formActions = document.querySelector('.form-actions');
            formActions.parentNode.insertBefore(warning, formActions);
        }
        warning.style.display = 'block';
    } else if (warning) {
        warning.style.display = 'none';
    }
}

// Export progress to JSON file
function exportProgressToFile() {
    const formId = getFormId();
    const savedData = localStorage.getItem(`formData_${formId}`);
    
    if (!savedData) {
        showNotification('No form data to export', 'error');
        return;
    }
    
    const data = JSON.parse(savedData);
    const jsonString = JSON.stringify(data, null, 2);
    
    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SSO-Form-Progress-${formId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Mark as saved
    hasUnsavedChanges = false;
    localStorage.setItem('lastExportTime', new Date().toISOString());
    updateExportWarning();
    
    showNotification('Progress exported to file successfully! ✓', 'success');
}

// Import progress from JSON file
function importProgressFromFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
        showNotification('Please select a valid JSON file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            
            // Validate it's a form data file
            if (!data.formId || !data.timestamp) {
                showNotification('Invalid form data file', 'error');
                return;
            }
            
            // Save to localStorage with current form ID
            const formId = getFormId();
            data.formId = formId;
            data.timestamp = new Date().toISOString();
            localStorage.setItem(`formData_${formId}`, JSON.stringify(data));
            
            // Reload the form
            loadFormData();
            updateProgress();
            
            // Mark as no unsaved changes since we just imported
            hasUnsavedChanges = false;
            updateExportWarning();
            
            showNotification('Progress imported successfully! ✓', 'success');
        } catch (error) {
            showNotification('Error reading file. Please check the file format.', 'error');
        }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    e.target.value = '';
}

// Export form data to HTML
function exportToHtml() {
    const formId = getFormId();
    const savedData = localStorage.getItem(`formData_${formId}`);
    
    if (!savedData) {
        showNotification('No form data to export', 'error');
        return;
    }
    
    const data = JSON.parse(savedData);
    const html = generateHtmlReport(data);
    
    // Create blob and download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SSO-Application-Onboarding-${formId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Form exported to HTML successfully! ✓', 'success');
}

// Generate HTML report
function generateHtmlReport(data) {
    const date = new Date(data.timestamp).toLocaleString();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SSO Application Intake - ${data.appName || 'Untitled'}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #323130;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
            color: #0078d4;
            border-bottom: 3px solid #0078d4;
            padding-bottom: 10px;
        }
        h2 {
            color: #0078d4;
            margin-top: 30px;
            border-bottom: 2px solid #50e6ff;
            padding-bottom: 5px;
        }
        .info-row {
            display: grid;
            grid-template-columns: 200px 1fr;
            margin: 10px 0;
            padding: 10px 0;
            border-bottom: 1px solid #e1e1e1;
        }
        .label {
            font-weight: 600;
            color: #605e5c;
        }
        .value {
            color: #323130;
            white-space: pre-wrap;
        }
        .header-info {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .empty {
            color: #999;
            font-style: italic;
        }
        @media print {
            body {
                background: white;
            }
            .container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Microsoft Entra ID SSO Application Onboarding Form</h1>
        
        <div class="header-info">
            <div class="info-row" style="border: none;">
                <span class="label">Form ID:</span>
                <span class="value">${data.formId || 'N/A'}</span>
            </div>
            <div class="info-row" style="border: none;">
                <span class="label">Submission Date:</span>
                <span class="value">${date}</span>
            </div>
        </div>

        <h2>1. General Application Information</h2>
        ${createInfoRow('Application Name', data.appName)}
        ${createInfoRow('Application Type', data.appType)}
        ${createInfoRow('Application URL', data.appUrl)}
        ${createInfoRow('Application Description', data.appDescription)}
        ${createInfoRow('Business Owner / Requestor', data.businessOwner)}
        ${createInfoRow('Owner Email', data.ownerEmail)}
        ${createInfoRow('Internal Technical Contact', data.technicalContact)}
        ${createInfoRow('Internal Technical Contact Email', data.technicalEmail)}
        ${createInfoRow('Vendor Technical Contact', data.vendorContact)}
        ${createInfoRow('Vendor Technical Contact Email', data.vendorEmail)}

        <h2>2. SSO Protocol Information</h2>
        ${createInfoRow('Vendor SSO Documentation URL', data.vendorSsoDocUrl)}
        ${createInfoRow('SSO Protocol', data.ssoProtocol)}
        ${data.ssoProtocol === 'other' ? createInfoRow('Other Protocol', data.otherProtocol) : ''}

        ${data.ssoProtocol === 'saml' ? `
        <h2>3. SAML 2.0 Configuration</h2>
        ${createInfoRow('Entity ID / Issuer', data.samlEntityId)}
        ${createInfoRow('Assertion Consumer Service (ACS) URL', data.samlAcsUrl)}
        ${createInfoRow('Sign-On URL', data.samlSignOnUrl)}
        ${createInfoRow('Single Logout URL', data.samlLogoutUrl)}
        ${createInfoRow('Relay State', data.samlRelayState)}
        ${createInfoRow('Sign SAML Response', data.samlSignResponse)}
        ${createInfoRow('Signing Algorithm', data.samlSigningAlgorithm)}
        ${createInfoRow('NameID Format', data.samlNameIdFormat)}
        ${createInfoRow('Required SAML Attributes/Claims', data.samlAttributes)}
        ` : ''}

        ${data.ssoProtocol === 'oidc' || data.ssoProtocol === 'oauth' ? `
        <h2>4. OpenID Connect / OAuth 2.0 Configuration</h2>
        ${createInfoRow('Redirect URI(s)', data.oidcRedirectUri)}
        ${createInfoRow('Post Logout Redirect URI', data.oidcLogoutUri)}
        ${createInfoRow('Application Type', data.oidcAppType)}
        ${createInfoRow('Grant Types', getGrantTypes(data))}
        ${createInfoRow('Required Scopes', data.oidcScopes)}
        ${createInfoRow('Token Configuration', getTokenTypes(data))}
        ${createInfoRow('Required Claims in Token', data.oidcClaims)}
        ` : ''}

        <h2>5. User Assignment & Access Control</h2>
        ${createInfoRow('User Assignment Required', data.userAssignmentRequired)}
        ${createInfoRow('Security Groups to Assign', data.assignedGroups)}
        ${createInfoRow('Specific Users to Assign', data.assignedUsers)}
        ${createInfoRow('Application Roles Required', data.rolesRequired)}
        ${data.rolesRequired === 'yes' ? createInfoRow('Application Roles', data.appRoles) : ''}

        <h2>6. Additional Configuration</h2>
        ${createInfoRow('MyApps Portal Sign-On URL', data.homepageUrl)}
        ${createInfoRow('Application Logo URL', data.logoUrl)}
        ${createInfoRow('Application Support Email', data.supportEmail)}
        ${createInfoRow('Privacy Statement URL', data.privacyUrl)}
        ${createInfoRow('Terms of Service URL', data.termsUrl)}
        ${createInfoRow('Provisioning Required', data.provisioningRequired)}
        ${data.provisioningRequired === 'yes' ? createInfoRow('SCIM Endpoint URL', data.scimEndpoint) : ''}
        ${createInfoRow('Additional Notes / Special Requirements', data.additionalNotes)}
    </div>
</body>
</html>
    `;
}

// Helper function to create info rows in HTML report
function createInfoRow(label, value) {
    const displayValue = value && value.trim() !== '' ? value : '<span class="empty">Not provided</span>';
    return `
        <div class="info-row">
            <span class="label">${label}:</span>
            <span class="value">${displayValue}</span>
        </div>
    `;
}

// Get selected grant types
function getGrantTypes(data) {
    const types = [];
    if (data.grantAuthCode) types.push('Authorization Code');
    if (data.grantImplicit) types.push('Implicit');
    if (data.grantClientCreds) types.push('Client Credentials');
    if (data.grantRefreshToken) types.push('Refresh Token');
    return types.length > 0 ? types.join(', ') : '';
}

// Get selected token types
function getTokenTypes(data) {
    const types = [];
    if (data.tokenIdToken) types.push('ID Token');
    if (data.tokenAccessToken) types.push('Access Token');
    return types.length > 0 ? types.join(', ') : '';
}

// Clear form
function clearForm() {
    if (!confirm('Are you sure you want to clear all form data? This action cannot be undone.')) {
        return;
    }
    
    const formId = getFormId();
    localStorage.removeItem(`formData_${formId}`);
    localStorage.removeItem('currentFormId');
    localStorage.removeItem('lastExportTime');
    
    // Clear unsaved changes flag
    hasUnsavedChanges = false;
    
    // Reload page to reset form
    window.location.reload();
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#13a10e' : type === 'error' ? '#e81123' : '#0078d4'};
        color: white;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Debounce function for auto-save
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
