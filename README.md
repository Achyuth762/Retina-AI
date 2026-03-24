# 👁️ RetinaAI

**Deep Learning-Powered Diabetic Retinopathy Classification & Lesion Segmentation**

RetinaAI is a medical-grade full-stack application designed to analyze retinal fundus images. By uploading a single image, the application categorizes the severity of Diabetic Retinopathy (DR) across 5 different grades and precisely segments three critical types of lesions: Haemorrhages, Hard Exudates, and Soft Exudates.

---

## 🏗️ Architecture

The project has been scaled into a robust **MERN Stack + Python Microservice** architecture to handle intensive deep-learning workloads efficiently:

1. **Frontend (Vite + React)**: A highly interactive, dark-themed, glassmorphic web UI. Built with Tailwind CSS and React Router.
2. **Backend API (Node.js + Express)**: A fast serverless proxy that handles file multipart-uploads, stores application data, and bridges the gap between the client and the AI models.
3. **Database (MongoDB Atlas)**: Stores a permanent ledger of past inferences, patient histories, and lesion analytics.
4. **AI Microservice (Python / Flask)**: A dedicated instance hosting the heavy PyTorch neural networks. By decoupling this from Node.js, the models stay loaded in memory (averting massive cold-start times) and execute Python-native OpenCV operations instantly.

---

## 🧠 Deep Learning Models

Our AI inference pipeline leverages state-of-the-art vision architectures trained on clinical datasets:

- **Classification Model**: Uses an `EfficientNet-B4` backbone, trained on the **APTOS 2019 Blindness Detection** dataset to classify the image into 5 standard ascending grades (No DR → Proliferative DR).
- **Segmentation Model**: Uses a `U-Net` architecture coupled with an `EfficientNet-B3` encoder. Trained on the **IDRiD** dataset specifically to calculate the precise pixel footprints of clinical microscopic abnormalities.
- **Pipeline**: Automated fundus border cropping → CLAHE (Contrast Limited Adaptive Histogram Equalization) Green Channel enhancement → Sliding Window Patched Inference.

---

## 🚀 Local Development Setup

To run RetinaAI entirely on your local machine, you will need to boot up its three independent servers.

### Prerequisites
- Node.js (v18+)
- Python 3.9+
- MongoDB Local Server or Atlas connection string

### 1. The Python AI Engine
Boot the PyTorch microservice (Port 5001).
```bash
cd Retina-AI
pip install -r requirements.txt
python app.py
```
*(Note: It may take several seconds to map the two ~100MB model `.pth` files into memory during startup).*

### 2. The Node.js Express Backend
Boot the API handler (Port 5000).
```bash
cd backend
npm install
# Ensure you copy your MongoDB connection string to backend/.env 
npm run dev
```

### 3. The React Vite Frontend
Boot the User Interface (Port 5173).
```bash
cd frontend
npm install
npm run dev
```

Finally, open your browser to `http://localhost:5173`. Make sure all three servers are running simultaneously so they can communicate!

---

## ☁️ Deployment Guidelines

Since Vercel Serverless Functions have strict payload/timeout constraints (10s max execution and <50MB size), **you cannot host heavy PyTorch models on Vercel directly**. We utilize a powerful, entirely free 3-tier cloud architecture:

1. **Python AI Engine (Hugging Face Spaces)**: The root directory contains a `Dockerfile` specifically tuned for Hugging Face Spaces. It provisions a 16GB RAM container to elegantly load both `EfficientNet` models into memory. 
2. **Node.js Backend (Vercel)**: Deployed as Serverless proxy functions. Set the `MONGODB_URI` environment variable, and uniquely link your Hugging Face Space URL as your `AI_SERVICE_URL`.
3. **React Frontend (Vercel)**: Deployed as a blazing-fast SPA. Add the newly generated Vercel Backend URL as your `VITE_API_URL`.

---

### Disclaimer
*⚠️ This tool was constructed for research and educational demonstrations only. It is absolutely not a substitute for professional medical diagnosis or clinical ophthalmology screening.*
