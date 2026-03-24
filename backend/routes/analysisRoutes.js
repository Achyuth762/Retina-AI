import express from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import Analysis from '../models/Analysis.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // 1. Forward the image to the Python AI microservice
    const formData = new FormData();
    formData.append('image', req.file.buffer, req.file.originalname);

    const aiMicroserviceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5001/api/analyze';
    
    console.log(`Sending request to AI Microservice: ${aiMicroserviceUrl}`);
    const aiResponse = await axios.post(aiMicroserviceUrl, formData, {
      headers: { ...formData.getHeaders() },
    });

    const aiData = aiResponse.data;

    // 2. Save the successful result to MongoDB
    if (aiData.success) {
      const newAnalysis = new Analysis({
        originalRoi: aiData.segmentation.original_roi,
        overlayImage: aiData.segmentation.overlay_image,
        classification: {
          grade: aiData.classification.grade,
          label: aiData.classification.label,
          description: aiData.classification.description,
          confidence: aiData.classification.confidence,
        },
        segmentation: {
          lesionStats: aiData.segmentation.lesion_stats,
          anyLesionsDetected: aiData.segmentation.any_lesions_detected,
        },
        status: 'SUCCESS',
      });

      await newAnalysis.save();

      // Return ID and data to frontend
      return res.status(200).json({
        ...aiData,
        analysisId: newAnalysis._id,
      });
    } else {
      throw new Error(aiData.error || 'Unknown error from AI service');
    }

  } catch (error) {
    console.error("Analysis Error:", error.message);
    
    // Attempt to log failure to DB (optional, but good practice)
    res.status(500).json({ error: error.response?.data?.error || error.message || 'Server error during analysis' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const history = await Analysis.find().sort({ createdAt: -1 }).select('-originalRoi -overlayImage'); // Exclude large base64 images from list view for performance
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.get('/history/:id', async (req, res) => {
    try {
        const item = await Analysis.findById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history item' });
    }
});

export default router;
