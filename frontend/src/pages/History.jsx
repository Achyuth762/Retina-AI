import { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, Clock, FileText, ChevronRight } from 'lucide-react';

export default function History() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      // Excludes big base64 strings so it loads fast
      const response = await axios.get(`${apiUrl}/api/analysis/history`);
      setHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (grade) => {
    if (grade === undefined) return null;
    let colorClass = '';
    switch(grade) {
      case 0: colorClass = 'text-emerald-400 bg-emerald-400/10'; break;
      case 1: colorClass = 'text-yellow-400 bg-yellow-400/10'; break;
      case 2: colorClass = 'text-orange-400 bg-orange-400/10'; break;
      case 3: colorClass = 'text-red-400 bg-red-400/10'; break;
      case 4: colorClass = 'text-rose-500 bg-rose-500/10'; break;
      default: colorClass = 'text-slate-400 bg-slate-800';
    }
    return <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${colorClass}`}>Grade {grade}</span>;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-500">
      <div className="mb-8 border-b border-white/10 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
          <Clock className="w-8 h-8 text-primary" />
          Analysis History
        </h1>
        <p className="text-slate-400 mt-2">View past AI diagnosis and segmentation results.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 glass rounded-xl animate-pulse bg-slate-800/50"></div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 px-4 glass rounded-2xl">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-300">No analysis history found</h3>
          <p className="text-slate-500 mt-2">Upload and analyze images to build your history.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map((item) => (
            <div key={item._id} className="glass rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between group hover:bg-white-[0.03] transition-colors cursor-pointer border border-transparent hover:border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-black/40 flex items-center justify-center border border-white/5 group-hover:bg-primary/10 transition-colors">
                  <Eye className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-slate-200">{item.classification?.label || 'Unknown'}</span>
                    {getStatusBadge(item.classification?.grade)}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                    <span>•</span>
                    <span>Status: {item.status}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center gap-4 w-full md:w-auto self-end">
                {item.segmentation?.anyLesionsDetected && (
                  <span className="text-xs text-rose-400 bg-rose-400/10 px-2 py-1 rounded">Lesions Detected</span>
                )}
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-primary group-hover:text-white transition-all duration-200 hidden md:block">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
