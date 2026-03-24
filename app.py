"""
Diabetic Retinopathy Classification & Segmentation — Flask Backend
Models and preprocessing are exact replicas from the training notebooks.
"""

import os
import io
import base64
import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms, models
from PIL import Image
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

try:
    import segmentation_models_pytorch as smp
except ImportError:
    print("ERROR: segmentation_models_pytorch not installed. Run: pip install segmentation-models-pytorch")
    raise

# ============================================================
# CONFIGURATION
# ============================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)

CL_WEIGHTS = os.path.join(BASE_DIR, "EfficientNetB4_model.pth")
SEG_WEIGHTS = os.path.join(BASE_DIR, "best_effnet_unet.pth")

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CL_IMG_SIZE = 384
SEG_IMG_SIZE = 512
SEG_CLASSES = ["Background", "Haemorrhages (HE)", "Hard Exudates (EX)", "Soft Exudates (SE)"]

DR_GRADE_LABELS = {
    0: "No DR",
    1: "Mild NPDR",
    2: "Moderate NPDR",
    3: "Severe NPDR",
    4: "Proliferative DR"
}

DR_GRADE_DESCRIPTIONS = {
    0: "No signs of diabetic retinopathy detected. The retina appears healthy with no visible abnormalities.",
    1: "Mild non-proliferative diabetic retinopathy. Minor microaneurysms may be present.",
    2: "Moderate non-proliferative diabetic retinopathy. Microaneurysms, dot/blot hemorrhages, and hard exudates may be visible.",
    3: "Severe non-proliferative diabetic retinopathy. Extensive hemorrhages, venous beading, and intraretinal microvascular abnormalities present.",
    4: "Proliferative diabetic retinopathy. Neovascularization and/or vitreous/preretinal hemorrhage detected. Urgent referral recommended."
}

# ============================================================
# MODEL DEFINITIONS — EXACT COPIES FROM NOTEBOOKS
# ============================================================

class APTOSModel(nn.Module):
    """Classification model — exact architecture from efficientnet-b4.ipynb"""
    def __init__(self, num_classes=5):
        super().__init__()
        self.backbone = models.efficientnet_b4(weights=None)
        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(in_features, num_classes)
        )

    def forward(self, x):
        return self.backbone(x)


def get_classification_model(path, device):
    """Load classification model — exact from pipeline notebook"""
    model = APTOSModel()
    model.load_state_dict(torch.load(path, map_location=device))
    return model.to(device).eval()


def get_segmentation_model(path, device):
    """Load segmentation model — exact from pipeline notebook"""
    model = smp.Unet(
        encoder_name="efficientnet-b3",
        encoder_weights=None,
        in_channels=3,
        classes=4
    )
    model.load_state_dict(torch.load(path, map_location=device))
    return model.to(device).eval()


# ============================================================
# PREPROCESSING FUNCTIONS — EXACT COPIES FROM NOTEBOOKS
# ============================================================

def crop_fundus(image, threshold=10):
    """Crop black borders from fundus image — exact from pipeline notebook"""
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    _, thresh = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)
    coords = cv2.findNonZero(thresh)
    if coords is not None:
        x, y, w, h = cv2.boundingRect(coords)
        return image[y:y+h, x:x+w], (x, y, w, h)
    return image, (0, 0, image.shape[1], image.shape[0])


def apply_clahe_green(image):
    """CLAHE on green channel — exact from pipeline notebook"""
    green = image[:, :, 1]
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    g = clahe.apply(green)
    return np.stack([g, g, g], axis=-1)


def overlay_mask(image, mask, alpha=0.5):
    """Overlay colored segmentation mask — exact from pipeline notebook"""
    overlay = image.copy().astype(np.float64)
    colors = {1: [255, 0, 0], 2: [0, 255, 0], 3: [0, 0, 255]}
    for cls, color in colors.items():
        mask_region = mask == cls
        if mask_region.any():
            overlay[mask_region] = (1 - alpha) * overlay[mask_region] + alpha * np.array(color)
    return overlay.astype(np.uint8)


# ============================================================
# INFERENCE PIPELINE — EXACT FROM PIPELINE NOTEBOOK
# ============================================================

@torch.no_grad()
def run_classification(model, image_rgb):
    """Run classification — exact preprocessing from pipeline notebook"""
    cl_trans = transforms.Compose([
        transforms.Resize((CL_IMG_SIZE, CL_IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    cl_inp = cl_trans(Image.fromarray(image_rgb)).unsqueeze(0).to(DEVICE)
    logits = model(cl_inp)
    probabilities = F.softmax(logits, dim=1).cpu().numpy()[0]
    grade = int(np.argmax(probabilities))
    return grade, probabilities


@torch.no_grad()
def run_segmentation(model, image_rgb):
    """Run segmentation — exact preprocessing from pipeline notebook"""
    cropped, coords = crop_fundus(image_rgb)
    roi = cv2.resize(cropped, (SEG_IMG_SIZE, SEG_IMG_SIZE))
    seg_inp = torch.tensor(
        np.transpose(apply_clahe_green(roi).astype(np.float32) / 255.0, (2, 0, 1))
    ).to(DEVICE)

    # Sliding window inference — exact from pipeline notebook
    out_map = torch.zeros((4, 512, 512), device=DEVICE)
    cnt_map = torch.zeros((512, 512), device=DEVICE)
    for y in range(0, 512 - 256 + 1, 128):
        for x in range(0, 512 - 256 + 1, 128):
            patch = seg_inp[:, y:y+256, x:x+256].unsqueeze(0)
            out_map[:, y:y+256, x:x+256] += model(patch)[0]
            cnt_map[y:y+256, x:x+256] += 1

    pred_mask = torch.argmax(out_map / cnt_map.unsqueeze(0), dim=0).cpu().numpy().astype(np.uint8)

    return roi, pred_mask


def numpy_to_base64(img_array):
    """Convert numpy RGB image to base64 PNG string"""
    img = Image.fromarray(img_array)
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode('utf-8')


def calculate_lesion_stats(mask):
    """Calculate pixel-level statistics for each lesion type"""
    total_pixels = mask.size
    stats = {}
    for i in range(1, 4):
        count = int(np.sum(mask == i))
        stats[SEG_CLASSES[i]] = {
            "pixel_count": count,
            "percentage": round(count / total_pixels * 100, 4),
            "detected": count > 0
        }
    return stats


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)
CORS(app)

cl_model = None
seg_model = None

def load_models():
    global cl_model, seg_model
    if cl_model is None:
        try:
            print(f"Using device: {DEVICE}")
            print(f"Loading classification model from: {CL_WEIGHTS}")
            cl_model = get_classification_model(CL_WEIGHTS, DEVICE)
            print("Classification model loaded ✅")
        except Exception as e:
            print(f"Error loading classification model: {e}")
            raise
    
    if seg_model is None:
        try:
            print(f"Loading segmentation model from: {SEG_WEIGHTS}")
            seg_model = get_segmentation_model(SEG_WEIGHTS, DEVICE)
            print("Segmentation model loaded ✅")
        except Exception as e:
            print(f"Error loading segmentation model: {e}")
            raise


@app.route('/')
def index():
    return jsonify({"message": "Retina-AI Microservice Running"})


@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Main analysis endpoint — runs both classification and segmentation"""
    load_models()
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        # Read image
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img_bgr = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        if img_bgr is None:
            return jsonify({'error': 'Could not decode image. Please upload a valid image file.'}), 400
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

        # 1. Classification
        grade, probabilities = run_classification(cl_model, img_rgb)

        # 2. Segmentation
        roi, pred_mask = run_segmentation(seg_model, img_rgb)

        # 3. Create overlay
        overlay = overlay_mask(roi, pred_mask)

        # 4. Calculate lesion stats
        lesion_stats = calculate_lesion_stats(pred_mask)

        # 5. Determine if any lesions detected
        any_lesions = any(s["detected"] for s in lesion_stats.values())

        # 6. Build response
        response = {
            'success': True,
            'classification': {
                'grade': grade,
                'label': DR_GRADE_LABELS[grade],
                'description': DR_GRADE_DESCRIPTIONS[grade],
                'confidence': {
                    DR_GRADE_LABELS[i]: round(float(probabilities[i]) * 100, 2)
                    for i in range(5)
                }
            },
            'segmentation': {
                'overlay_image': numpy_to_base64(overlay),
                'original_roi': numpy_to_base64(roi),
                'lesion_stats': lesion_stats,
                'any_lesions_detected': any_lesions
            }
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'device': str(DEVICE),
        'models_loaded': cl_model is not None and seg_model is not None
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
