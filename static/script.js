/**
 * RetinaAI — Frontend Logic
 * Handles file upload, API communication, and results rendering
 */

// ============================================================
// DOM Elements
// ============================================================
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewArea = document.getElementById('previewArea');
const previewImage = document.getElementById('previewImage');
const removeBtn = document.getElementById('removeBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const uploadCard = document.getElementById('uploadCard');
const uploadSection = document.querySelector('.upload-section');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');

let selectedFile = null;

// ============================================================
// File Upload Handling
// ============================================================

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
});

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showError('Please upload a valid image file (JPG, PNG, TIFF).');
        return;
    }

    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        uploadArea.style.display = 'none';
        previewArea.style.display = 'block';
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
    };
    reader.readAsDataURL(file);
}

removeBtn.addEventListener('click', () => {
    resetUpload();
});

function resetUpload() {
    selectedFile = null;
    fileInput.value = '';
    previewImage.src = '';
    uploadArea.style.display = 'block';
    previewArea.style.display = 'none';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ============================================================
// Analysis
// ============================================================

analyzeBtn.addEventListener('click', () => {
    if (!selectedFile) return;
    runAnalysis();
});

async function runAnalysis() {
    // Show loading
    uploadSection.style.display = 'none';
    resultsSection.style.display = 'none';
    loadingSection.style.display = 'block';
    loadingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Animate loading steps
    animateLoadingSteps();

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || 'Analysis failed');
        }

        // Complete loading animation
        completeLoadingSteps();

        // Short delay for visual effect
        await sleep(800);

        // Show results
        displayResults(data);

    } catch (error) {
        console.error('Analysis error:', error);
        loadingSection.style.display = 'none';
        uploadSection.style.display = 'block';
        showErrorCard(error.message);
    }
}

function animateLoadingSteps() {
    const steps = document.querySelectorAll('.loading-step');
    steps.forEach(s => s.classList.remove('active', 'done'));

    const delays = [0, 2000, 5000, 8000];
    steps.forEach((step, i) => {
        setTimeout(() => {
            steps.forEach(s => s.classList.remove('active'));
            step.classList.add('active');
            for (let j = 0; j < i; j++) {
                steps[j].classList.add('done');
            }
        }, delays[i]);
    });
}

function completeLoadingSteps() {
    const steps = document.querySelectorAll('.loading-step');
    steps.forEach(s => {
        s.classList.remove('active');
        s.classList.add('done');
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// Results Display
// ============================================================

function displayResults(data) {
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const { classification, segmentation } = data;

    // === Classification ===
    const grade = classification.grade;
    const gradeCard = document.getElementById('gradeCard');

    // Remove old grade classes, add new one
    gradeCard.className = `result-card grade-card grade-${grade}`;

    document.getElementById('gradeNumber').textContent = grade;
    document.getElementById('gradeBadge').textContent = `Grade ${grade}`;
    document.getElementById('gradeLabel').textContent = classification.label;
    document.getElementById('gradeDescription').textContent = classification.description;

    // Confidence bars
    const confidenceBars = document.getElementById('confidenceBars');
    confidenceBars.innerHTML = '';

    const gradeColors = ['#06d6a0', '#ffd166', '#f59e0b', '#ef6c00', '#ef4444'];

    Object.entries(classification.confidence).forEach(([label, value], i) => {
        const item = document.createElement('div');
        item.className = 'confidence-bar-item';
        item.innerHTML = `
            <div class="confidence-bar-header">
                <span class="confidence-bar-label">${label}</span>
                <span class="confidence-bar-value">${value.toFixed(1)}%</span>
            </div>
            <div class="confidence-bar-track">
                <div class="confidence-bar-fill" style="background: ${gradeColors[i]};"></div>
            </div>
        `;
        confidenceBars.appendChild(item);

        // Animate the bar fill
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                item.querySelector('.confidence-bar-fill').style.width = `${value}%`;
            });
        });
    });

    // === Segmentation ===
    const overlayImg = document.getElementById('segOverlayImage');
    const originalImg = document.getElementById('segOriginalImage');

    overlayImg.src = `data:image/png;base64,${segmentation.overlay_image}`;
    originalImg.src = `data:image/png;base64,${segmentation.original_roi}`;

    // Reset toggle
    document.getElementById('toggleOverlay').classList.add('active');
    document.getElementById('toggleOriginal').classList.remove('active');
    overlayImg.style.display = 'block';
    originalImg.style.display = 'none';

    // === Lesion Stats ===
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = '';

    const lesionConfig = {
        'Haemorrhages (HE)': { icon: '🔴', css: 'he', short: 'HE' },
        'Hard Exudates (EX)': { icon: '🟢', css: 'ex', short: 'EX' },
        'Soft Exudates (SE)': { icon: '🔵', css: 'se', short: 'SE' }
    };

    Object.entries(segmentation.lesion_stats).forEach(([name, stats]) => {
        const config = lesionConfig[name] || { icon: '⚪', css: '', short: name };
        const item = document.createElement('div');
        item.className = 'stat-item';
        item.innerHTML = `
            <div class="stat-item-icon ${config.css}">${config.icon}</div>
            <div class="stat-item-name">${name}</div>
            <div class="stat-item-value">${stats.percentage.toFixed(2)}%</div>
            <div class="stat-item-label">${stats.pixel_count.toLocaleString()} pixels</div>
            <div class="stat-detected ${stats.detected ? 'yes' : 'no'}">
                ${stats.detected ? '⚠ Detected' : '✓ Not Detected'}
            </div>
        `;
        statsGrid.appendChild(item);
    });
}

// ============================================================
// View Toggle (Overlay / Original)
// ============================================================

document.getElementById('toggleOverlay').addEventListener('click', () => {
    document.getElementById('segOverlayImage').style.display = 'block';
    document.getElementById('segOriginalImage').style.display = 'none';
    document.getElementById('toggleOverlay').classList.add('active');
    document.getElementById('toggleOriginal').classList.remove('active');
});

document.getElementById('toggleOriginal').addEventListener('click', () => {
    document.getElementById('segOverlayImage').style.display = 'none';
    document.getElementById('segOriginalImage').style.display = 'block';
    document.getElementById('toggleOriginal').classList.add('active');
    document.getElementById('toggleOverlay').classList.remove('active');
});

// ============================================================
// New Analysis
// ============================================================

newAnalysisBtn.addEventListener('click', () => {
    resultsSection.style.display = 'none';
    uploadSection.style.display = 'block';
    resetUpload();
    uploadSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

// ============================================================
// Error Handling
// ============================================================

function showError(message) {
    alert(message);
}

function showErrorCard(message) {
    // Remove existing error cards
    document.querySelectorAll('.error-card').forEach(el => el.remove());

    const card = document.createElement('div');
    card.className = 'error-card';
    card.innerHTML = `
        <h3>⚠️ Analysis Error</h3>
        <p>${message}</p>
        <button class="hero-cta" style="margin-top: 20px;" onclick="this.parentElement.remove()">
            <span>Try Again</span>
        </button>
    `;

    const container = uploadSection.querySelector('.section-container');
    container.appendChild(card);
}

// ============================================================
// Smooth Scroll for Nav Links
// ============================================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ============================================================
// Navbar scroll effect
// ============================================================

window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.style.padding = '10px 0';
        navbar.style.borderBottomColor = 'rgba(255,255,255,0.08)';
    } else {
        navbar.style.padding = '16px 0';
        navbar.style.borderBottomColor = 'rgba(255,255,255,0.06)';
    }
});
