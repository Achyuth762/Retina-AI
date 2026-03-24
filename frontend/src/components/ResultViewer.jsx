import { AlertTriangle, Info, CheckCircle, ActivitySquare } from 'lucide-react';

export default function ResultViewer({ result }) {
  if (!result) return null;

  const { classification, segmentation } = result;
  
  // Helper to determine color based on grade
  const getGradeColor = (grade) => {
    switch(grade) {
      case 0: return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 1: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 2: return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 3: return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 4: return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const getSeverityIcon = (grade) => {
    if (grade === 0) return <CheckCircle className="w-6 h-6 text-emerald-400" />;
    if (grade <= 2) return <Info className="w-6 h-6 text-yellow-400" />;
    return <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />;
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-12 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Visualizations - Left Side */}
      <div className="lg:col-span-7 space-y-6">
        <div className="glass rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              <ActivitySquare className="w-4 h-4 text-primary" />
              Lesion Segmentation Map
            </h3>
            <div className="text-xs text-slate-400 px-3 py-1 bg-black/30 rounded-full">
              EfficiencyNet-B3 U-NET
            </div>
          </div>
          <div className="p-1">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black flex items-center justify-center">
              <img 
                src={`data:image/png;base64,${segmentation.overlay_image || segmentation.overlayImage}`} 
                alt="Segmentation Overlay" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          <div className="p-4 border-t border-white/5 bg-black/20 flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"></span> Haemorrhages</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span> Hard Exudates</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></span> Soft Exudates</div>
          </div>
        </div>
      </div>

      {/* Analysis Details - Right Side */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Classification Result */}
        <div className={`glass rounded-2xl p-6 border ${getGradeColor(classification.grade)}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm uppercase tracking-wider font-semibold opacity-80 mb-1">Diagnosis</p>
              <h2 className="text-3xl font-bold tracking-tight">{classification.label}</h2>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              {getSeverityIcon(classification.grade)}
            </div>
          </div>
          <p className="text-sm opacity-90 leading-relaxed">
            {classification.description}
          </p>
        </div>

        {/* Confidence Scores */}
        <div className="glass rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <h3 className="font-semibold text-slate-200 mb-4">Model Confidence Scores</h3>
          <div className="space-y-4">
            {Object.entries(classification.confidence).map(([label, score]) => (
              <div key={label} className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>{label}</span>
                  <span className="font-mono">{score.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${label === classification.label ? 'bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-500'}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lesion Statistics */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center justify-between">
            Lesion Statistics
            {!segmentation.any_lesions_detected && !segmentation.anyLesionsDetected && (
              <span className="text-xs font-normal text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">None Detected</span>
            )}
          </h3>
          <div className="space-y-3">
            {Object.entries(segmentation.lesion_stats || segmentation.lesionStats).map(([lesion, stat]) => (
              <div key={lesion} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                <span className="text-sm text-slate-300">{lesion}</span>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{stat.percentage}%</div>
                  <div className="text-xs text-slate-500">{stat.pixel_count} px</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
