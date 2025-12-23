import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, FileText, MoreVertical, Plus, 
  FolderOpen, ArrowLeft, Upload, Scan, Trash2, ExternalLink, X
} from 'lucide-react';
import { vaultService, type AcademicFile } from '@/services/vault.service';
import { useUserStore } from '@/lib/store';
import { clsx } from 'clsx';

export const Vault: React.FC = () => {
  const navigate = useNavigate();
  const { semester } = useUserStore();
  const [files, setFiles] = useState<AcademicFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [isUploading, setIsUploading] = useState(false);
  const [editingFile, setEditingFile] = useState<AcademicFile | null>(null);

  const categories = ['Semua', 'Document', 'KRS', 'Materi', 'Struk'];

  const loadFiles = async () => {
    const currentSemester = Number(semester) || 1;
    const data = await vaultService.getFilesBySemester(currentSemester);
    setFiles(data);
  };

  useEffect(() => {
    loadFiles();
  }, [semester]);

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await vaultService.saveFile({
        name: file.name,
        blob: file,
        type: file.type,
        semester: Number(semester) || 1,
        category: 'Document'
      });
      await loadFiles();
    } catch (error) {
      console.error("Upload gagal:", error);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Hapus dokumen ini?')) {
      await vaultService.deleteFile(id);
      loadFiles();
    }
  };

  const handleUpdate = async () => {
    if (editingFile && editingFile.id) {
      await vaultService.updateFile(editingFile.id, {
        name: editingFile.name,
        category: editingFile.category
      });
      setEditingFile(null);
      loadFiles();
    }
  };

  const openFile = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-app-surface rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-app-text-main tracking-tighter uppercase">Library</h1>
            <p className="text-app-text-muted text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
              Vault Semester {semester}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted" size={18} />
            <input 
              type="text"
              placeholder="Cari dokumen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-app-surface border border-app-border rounded-xl text-sm outline-none focus:border-app-primary transition-all"
            />
          </div>
          <button 
            onClick={() => navigate('/scanner')}
            className="p-4 bg-app-primary text-white rounded-xl shadow-lg shadow-app-primary/20 active:scale-95 transition-all"
          >
            <Scan size={20} />
          </button>
          <label className="p-4 bg-mint-500 text-white rounded-xl shadow-lg shadow-mint-500/20 active:scale-95 transition-all cursor-pointer">
            <Upload size={20} />
            <input type="file" className="hidden" onChange={handleManualUpload} accept="application/pdf,image/*" disabled={isUploading} />
          </label>
        </div>
      </header>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={clsx(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shrink-0",
              selectedCategory === cat 
                ? "bg-app-primary border-app-primary text-white" 
                : "bg-app-surface border-app-border text-app-text-muted hover:border-app-primary/50"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-app-text-muted space-y-4">
          <FolderOpen size={48} strokeWidth={1.5} className="opacity-20" />
          <p className="text-sm">Belum ada dokumen di kategori ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div 
              key={file.id}
              className="group bg-app-surface border border-app-border rounded-xl p-3 hover:border-app-primary/50 transition-all relative overflow-hidden shadow-sm flex flex-col"
            >
              <div 
                onClick={() => navigate(`/vault/${file.id}`)}
                className="aspect-square rounded-lg bg-app-bg mb-3 flex items-center justify-center relative overflow-hidden cursor-pointer"
              >
                <FileText className="text-app-text-muted opacity-20" size={32} />
                <div className="absolute top-1.5 right-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[7px] font-black text-white uppercase tracking-tighter">
                  {file.category || 'PDF'}
                </div>
              </div>
              
              <div className="px-1 flex-1 min-w-0">
                <h4 className="text-[11px] font-bold text-app-text-main truncate uppercase tracking-tight leading-tight">
                  {file.name}
                </h4>
                <p className="text-[8px] text-app-text-muted font-bold mt-1 opacity-70">
                  {new Date(file.createdAt).toLocaleDateString('id-ID')}
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-app-border/30">
                <button 
                  onClick={(e) => { e.stopPropagation(); setEditingFile(file); }} 
                  className="p-2 text-app-text-muted hover:text-app-primary active:bg-app-primary/10 rounded-lg transition-all"
                >
                  <MoreVertical size={16} />
                </button>
                
                <div className="flex gap-0.5">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openFile(file.blob); }} 
                    className="p-2 text-app-text-muted hover:text-app-primary active:bg-app-primary/10 rounded-lg transition-all"
                  >
                    <ExternalLink size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); file.id && handleDelete(file.id); }} 
                    className="p-2 text-red-400/70 hover:text-red-500 active:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-app-surface rounded-xl p-8 border border-app-border animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold uppercase tracking-tighter">Edit Metadata</h2>
              <button onClick={() => setEditingFile(null)} className="text-app-text-muted hover:text-red-500">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-app-text-muted uppercase mb-1 block">Nama File</label>
                <input 
                  type="text" 
                  value={editingFile.name}
                  className="w-full p-4 bg-app-bg rounded-xl border border-app-border outline-none focus:border-app-primary text-sm font-semibold"
                  onChange={e => setEditingFile({...editingFile, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-app-text-muted uppercase mb-1 block">Kategori</label>
                <select 
                  className="w-full p-4 bg-app-bg rounded-xl border border-app-border text-app-text-main outline-none focus:border-app-primary text-sm font-semibold appearance-none"
                  value={editingFile.category}
                  onChange={e => setEditingFile({...editingFile, category: e.target.value})}
                >
                  {['Document', 'KRS', 'Materi', 'Struk'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button 
                  onClick={() => setEditingFile(null)} 
                  className="py-4 font-bold text-app-text-muted uppercase text-xs tracking-widest"
                >
                  Batal
                </button>
                <button 
                  onClick={handleUpdate} 
                  className="py-4 bg-app-primary text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-app-primary/20"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};