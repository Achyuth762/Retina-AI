import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema({
  originalRoi: {
    type: String, // Base64 or URL
    required: true,
  },
  overlayImage: {
    type: String, // Base64 or URL
    required: true,
  },
  classification: {
    grade: Number,
    label: String,
    description: String,
    confidence: mongoose.Schema.Types.Mixed,
  },
  segmentation: {
    lesionStats: mongoose.Schema.Types.Mixed,
    anyLesionsDetected: Boolean,
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED'],
    default: 'SUCCESS',
  },
  errorMessage: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Analysis = mongoose.model('Analysis', analysisSchema);
export default Analysis;
