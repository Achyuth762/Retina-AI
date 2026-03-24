import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [appState, setAppState] = useState('upload'); // 'upload', 'loading', 'results'
  const [uploadError, setUploadError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [resultData, setResultData] = useState(null);
  const [activeView, setActiveView] = useState('overlay');
  const [isScrolled, setIsScrolled] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload a valid image file (JPG, PNG, TIFF).');
      return;
    }
    setUploadError('');
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploadError('');
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const runAnalysis = async () => {
    if (!selectedFile) return;
    setAppState('loading');
    setUploadError('');
    
    // Animate loading steps
    setLoadingStep(1);
    setTimeout(() => setLoadingStep(2), 2000);
    setTimeout(() => setLoadingStep(3), 5000);
    setTimeout(() => setLoadingStep(4), 8000);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/analysis/analyze`, formData);
      
      const data = response.data;
      if (data.error) throw new Error(data.error);
      
      setResultData(data);
      setTimeout(() => {
        setAppState('results');
        setTimeout(() => scrollTo('resultsSection'), 100);
      }, 8800); // Ensure minimal display time for animation
      
    } catch (error) {
      console.error('Analysis error:', error);
      setAppState('upload');
      setUploadError(error.response?.data?.error || error.message || 'Analysis failed');
    }
  };

  const resetAnalysis = () => {
    setAppState('upload');
    resetUpload();
    setTimeout(() => scrollTo('upload'), 100);
  };

  // Grade colors mapping based on script.js
  const gradeColors = ['#06d6a0', '#ffd166', '#f59e0b', '#ef6c00', '#ef4444'];
  const lesionConfig = {
    'Haemorrhages (HE)': { icon: '🔴', css: 'he' },
    'Hard Exudates (EX)': { icon: '🟢', css: 'ex' },
    'Soft Exudates (SE)': { icon: '🔵', css: 'se' }
  };

  return (
    <>
      <div className="bg-gradient"></div>
      <div className="bg-grid"></div>

      <nav className="navbar" id="navbar" style={isScrolled ? { padding: '10px 0', borderBottomColor: 'rgba(255,255,255,0.08)' } : {}}>
        <div className="nav-container">
          <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); scrollTo('hero'); }}>
            <span className="logo-icon">👁️</span>
            <span className="logo-text">Retina<span className="accent">AI</span></span>
          </a>
          <div className="nav-links">
            <a href="#hero" onClick={(e) => { e.preventDefault(); scrollTo('hero'); }}>Home</a>
            <a href="#upload" onClick={(e) => { e.preventDefault(); scrollTo('upload'); }}>Analyze</a>
            <a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('about'); }}>About</a>
            <a href="#grades" onClick={(e) => { e.preventDefault(); scrollTo('grades'); }}>DR Grades</a>
          </div>
        </div>
      </nav>

      <section className="hero" id="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            AI-Powered Retinal Analysis
          </div>
          <h1 className="hero-title">
            Diabetic Retinopathy
            <span className="gradient-text">Detection & Segmentation</span>
          </h1>
          <p className="hero-subtitle">
            Advanced deep learning models analyze retinal fundus images to classify 
            diabetic retinopathy severity and segment lesion regions with clinical-grade accuracy.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-value">5</span>
              <span className="stat-label">DR Grades</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-value">3</span>
              <span className="stat-label">Lesion Types</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-value">EfficientNet</span>
              <span className="stat-label">Architecture</span>
            </div>
          </div>
          <a href="#upload" className="hero-cta" onClick={(e) => { e.preventDefault(); scrollTo('upload'); }}>
            <span>Start Analysis</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
        <div className="hero-visual">
          <div className="orbit-ring ring-1"></div>
          <div className="orbit-ring ring-2"></div>
          <div className="orbit-ring ring-3"></div>
          <div className="eye-icon">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="url(#eyeGrad)" strokeWidth="1.5">
              <defs><linearGradient id="eyeGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor:'#06d6a0'}}/><stop offset="100%" style={{stopColor:'#118ab2'}}/></linearGradient></defs>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
        </div>
      </section>

      {appState === 'upload' && (
        <section className="upload-section" id="upload">
          <div className="section-container">
            <div className="section-header">
              <h2 className="section-title">Analyze Retinal Image</h2>
              <p className="section-subtitle">Upload a fundus photograph to get instant AI-powered DR classification and lesion segmentation</p>
            </div>

            {uploadError && (
              <div className="error-card" style={{ maxWidth: '680px', margin: '0 auto 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '20px', borderRadius: '16px' }}>
                <h3 style={{ color: '#ef4444', marginBottom: '8px' }}>⚠️ Analysis Error</h3>
                <p>{uploadError}</p>
                <button className="toggle-btn" style={{ marginTop: '10px', background: 'rgba(239,68,68,0.2)', color: '#fff' }} onClick={() => setUploadError('')}>Dismiss</button>
              </div>
            )}

            <div className="upload-card" id="uploadCard">
              {!selectedFile ? (
                <div 
                  className={`upload-area ${isDragOver ? 'dragover' : ''}`} 
                  id="uploadArea"
                  onClick={() => fileInputRef.current.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="upload-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <h3 className="upload-title">Drop your retinal image here</h3>
                  <p className="upload-hint">or click to browse • Supports JPG, PNG, TIFF</p>
                  <input type="file" id="fileInput" accept="image/*" hidden ref={fileInputRef} onChange={handleFileSelect} />
                </div>
              ) : (
                <div className="preview-area" id="previewArea">
                  <div className="preview-image-container">
                    <img id="previewImage" src={previewUrl} alt="Preview" />
                    <button className="remove-btn" id="removeBtn" title="Remove image" onClick={resetUpload}>✕</button>
                  </div>
                  <div className="preview-info">
                    <span id="fileName">{selectedFile.name}</span>
                    <span id="fileSize">{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <button className="analyze-btn" id="analyzeBtn" onClick={runAnalysis}>
                    <span className="btn-text">Analyze Image</span>
                    <span className="btn-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {appState === 'loading' && (
        <section className="loading-section" id="loadingSection">
          <div className="section-container">
            <div className="loading-card">
              <div className="loading-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
              </div>
              <h3 className="loading-title">Analyzing Retinal Image</h3>
              <div className="loading-steps">
                <div className={`loading-step ${loadingStep >= 1 ? (loadingStep > 1 ? 'done' : 'active') : ''}`}>
                  <span className="step-icon">🔬</span>
                  <span className="step-text">Preprocessing image...</span>
                </div>
                <div className={`loading-step ${loadingStep >= 2 ? (loadingStep > 2 ? 'done' : 'active') : ''}`}>
                  <span className="step-icon">🧠</span>
                  <span className="step-text">Running classification model...</span>
                </div>
                <div className={`loading-step ${loadingStep >= 3 ? (loadingStep > 3 ? 'done' : 'active') : ''}`}>
                  <span className="step-icon">🎯</span>
                  <span className="step-text">Segmenting lesion regions...</span>
                </div>
                <div className={`loading-step ${loadingStep >= 4 ? (loadingStep > 4 ? 'done' : 'active') : ''}`}>
                  <span className="step-icon">📊</span>
                  <span className="step-text">Generating results...</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {appState === 'results' && resultData && (
        <section className="results-section" id="resultsSection">
          <div className="section-container">
            <div className="section-header">
              <h2 className="section-title">Analysis Results</h2>
              <p className="section-subtitle">Classification grade and lesion segmentation for the uploaded image</p>
            </div>

            <div className="results-grid">
              <div className={`result-card grade-card grade-${resultData.classification.grade}`} id="gradeCard">
                <div className="card-header">
                  <h3>DR Classification</h3>
                  <span className="grade-badge">Grade {resultData.classification.grade}</span>
                </div>
                <div className="grade-display">
                  <div className="grade-circle">
                    <span className="grade-number">{resultData.classification.grade}</span>
                  </div>
                  <div className="grade-info">
                    <h4>{resultData.classification.label}</h4>
                    <p>{resultData.classification.description}</p>
                  </div>
                </div>
                
                <div className="confidence-section">
                  <h4 className="confidence-title">Confidence Scores</h4>
                  <div>
                    {Object.entries(resultData.classification.confidence).map(([label, value], i) => (
                      <div className="confidence-bar-item" key={label}>
                        <div className="confidence-bar-header">
                          <span className="confidence-bar-label">{label}</span>
                          <span className="confidence-bar-value">{value.toFixed(1)}%</span>
                        </div>
                        <div className="confidence-bar-track">
                          <div className="confidence-bar-fill" style={{ width: `${value}%`, background: gradeColors[i] }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="result-card segmentation-card">
                <div className="card-header">
                  <h3>Lesion Segmentation</h3>
                  <div className="view-toggle">
                    <button className={`toggle-btn ${activeView === 'overlay' ? 'active' : ''}`} onClick={() => setActiveView('overlay')}>Overlay</button>
                    <button className={`toggle-btn ${activeView === 'original' ? 'active' : ''}`} onClick={() => setActiveView('original')}>Original</button>
                  </div>
                </div>
                <div className="segmentation-display">
                  <div className="seg-image-container">
                    {activeView === 'overlay' && <img src={`data:image/png;base64,${resultData.segmentation.overlay_image}`} alt="Segmentation Overlay" />}
                    {activeView === 'original' && <img src={`data:image/png;base64,${resultData.segmentation.original_roi}`} alt="Original ROI" />}
                  </div>
                  <div className="legend">
                    <div className="legend-item"><span className="legend-color" style={{background: '#FF0000'}}></span><span>Haemorrhages (HE)</span></div>
                    <div className="legend-item"><span className="legend-color" style={{background: '#00FF00'}}></span><span>Hard Exudates (EX)</span></div>
                    <div className="legend-item"><span className="legend-color" style={{background: '#0000FF'}}></span><span>Soft Exudates (SE)</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="result-card stats-card">
              <div className="card-header">
                <h3>Lesion Statistics</h3>
              </div>
              <div className="stats-grid">
                {Object.entries(resultData.segmentation.lesion_stats).map(([name, stats]) => {
                  const config = lesionConfig[name] || { icon: '⚪', css: '' };
                  return (
                    <div className="stat-item" key={name}>
                      <div className={`stat-item-icon ${config.css}`}>{config.icon}</div>
                      <div className="stat-item-name">{name}</div>
                      <div className="stat-item-value">{stats.percentage.toFixed(2)}%</div>
                      <div className="stat-item-label">{stats.pixel_count.toLocaleString()} pixels</div>
                      <div className={`stat-detected ${stats.detected ? 'yes' : 'no'}`}>
                        {stats.detected ? '⚠ Detected' : '✓ Not Detected'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="new-analysis">
              <button className="hero-cta" onClick={resetAnalysis}>
                <span>Analyze Another Image</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="about-section" id="about">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">About the Models</h2>
            <p className="section-subtitle">Technical details of the deep learning pipeline</p>
          </div>
          <div className="about-grid">
            <div className="about-card">
              <div className="about-icon">🔍</div>
              <h3>Classification Model</h3>
              <p>EfficientNet-B4 backbone trained on the APTOS 2019 Blindness Detection dataset with balanced class sampling. 5-class output for DR grading (Grade 0-4).</p>
              <div className="tech-tags">
                <span className="tech-tag">EfficientNet-B4</span>
                <span className="tech-tag">384×384 input</span>
                <span className="tech-tag">5 Classes</span>
              </div>
            </div>
            <div className="about-card">
              <div className="about-icon">🎯</div>
              <h3>Segmentation Model</h3>
              <p>U-Net architecture with EfficientNet-B3 encoder trained on the IDRiD dataset. Segments 3 lesion types: Haemorrhages (HE), Hard Exudates (EX), and Soft Exudates (SE).</p>
              <div className="tech-tags">
                <span className="tech-tag">U-Net</span>
                <span className="tech-tag">EfficientNet-B3</span>
                <span className="tech-tag">512×512 input</span>
              </div>
            </div>
            <div className="about-card">
              <div className="about-icon">⚙️</div>
              <h3>Pipeline</h3>
              <p>Fundus cropping → CLAHE green channel enhancement → Sliding window inference (256×256 patches, stride 128) → Average prediction aggregation.</p>
              <div className="tech-tags">
                <span className="tech-tag">CLAHE</span>
                <span className="tech-tag">Sliding Window</span>
                <span className="tech-tag">PyTorch</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grades-section" id="grades">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">DR Severity Grades</h2>
            <p className="section-subtitle">Understanding diabetic retinopathy classification</p>
          </div>
          <div className="grades-timeline">
            {[ 
              { grade: 0, title: 'No DR', desc: 'No visible signs of diabetic retinopathy. Retina appears healthy.' },
              { grade: 1, title: 'Mild NPDR', desc: 'Minor microaneurysms present. Early stage with minimal damage.' },
              { grade: 2, title: 'Moderate NPDR', desc: 'Microaneurysms, hemorrhages, and hard exudates visible.' },
              { grade: 3, title: 'Severe NPDR', desc: 'Extensive hemorrhages, venous beading, and IRMA present.' },
              { grade: 4, title: 'Proliferative DR', desc: 'Neovascularization detected. Urgent clinical referral needed.' }
            ].map((item) => (
              <div className="grade-item" data-grade={item.grade} key={item.grade}>
                <div className="grade-marker">{item.grade}</div>
                <div className="grade-content">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="section-container">
          <div className="footer-content">
            <div className="footer-logo">
              <span className="logo-icon">👁️</span>
              <span className="logo-text">Retina<span className="accent">AI</span></span>
            </div>
            <p className="footer-note">
              ⚠️ This tool is for research and educational purposes only. 
              It is not a substitute for professional medical diagnosis.
            </p>
            <p className="footer-copyright">&copy; 2026 RetinaAI. Built with PyTorch & EfficientNet.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
