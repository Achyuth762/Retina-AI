import { useState, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2 } from 'lucide-react';

export default function ImageUploader({ onUpload, isLoading }) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (inFile) => {
    if (!inFile.type.startsWith('image/')) return;
    setFile(inFile);
    const objectUrl = URL.createObjectURL(inFile);
    setPreview(objectUrl);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };
  
  const submitUpload = () => {
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {!preview ? (
        <form 
          onDragEnter={handleDrag} 
          onSubmit={(e) => e.preventDefault()}
          className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl transition-all duration-200 ease-in-out ${
            dragActive ? 'border-primary bg-primary/5' : 'border-slate-700 hover:border-slate-600 bg-card/50 hover:bg-card'
          }`}
        >
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleChange} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          />
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 bg-slate-800 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200 mb-1">Click to upload or drag & drop</h3>
            <p className="text-sm text-slate-500">SVG, PNG, JPG or GIF (max. 10MB)</p>
          </div>
        </form>
      ) : (
        <div className="glass rounded-2xl p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative group rounded-xl overflow-hidden bg-black/50 aspect-video flex items-center justify-center">
             <img src={preview} alt="Preview" className="max-h-full max-w-full object-contain" />
             {!isLoading && (
               <button 
                 onClick={clearFile}
                 className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/80 text-white rounded-full backdrop-blur-md transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
             )}
          </div>
          <button 
            onClick={submitUpload}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primary hover:bg-primaryDark text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Image...
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5" />
                Analyze Retina
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
