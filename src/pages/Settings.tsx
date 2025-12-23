import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/lib/store';
import { 
  User, Hash, Moon, Sun, Trash2, 
  ArrowLeft, Save, ShieldAlert 
} from 'lucide-react';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const store = useUserStore();
  
  // Gunakan state lokal untuk input form agar sinkron saat mengetik
  const [newUsername, setNewUsername] = useState(store.username || '');
  const [newSemester, setNewSemester] = useState(store.semester || 1);
  const [isSaved, setIsSaved] = useState(false);

  // Pastikan state lokal terupdate jika data store berubah (async rehydration)
  useEffect(() => {
    if (store.username) setNewUsername(store.username);
    if (store.semester) setNewSemester(store.semester);
  }, [store.username, store.semester]);

  const handleSave = () => {
    if (!newUsername.trim()) return alert("Nama tidak boleh kosong");
    
    // Panggil fungsi updater dari store
    store.setUsername(newUsername);
    store.setSemester(Number(newSemester));
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const clearAllData = async () => {
    const confirm = window.confirm(
      "PERINGATAN: Ini akan menghapus seluruh data transaksi, jadwal, dan dokumen di perangkat ini secara permanen. Lanjutkan?"
    );
    
    if (confirm) {
      try {
        // Hapus semua IndexedDB yang digunakan aplikasi
        const dbs = ['studentos_db', 'studentos_academic', 'studentos_vault'];
        await Promise.all(dbs.map(db => indexedDB.deleteDatabase(db)));
        
        // Reset state di store dan bersihkan localStorage/Preferences
        store.logout(); 
        localStorage.clear();
        
        window.location.href = '/'; // Redirect ke root
      } catch (err) {
        console.error("Gagal menghapus database:", err);
        alert("Terjadi kesalahan saat membersihkan data.");
      }
    }
  };

  const handleGoogleConnect = async () => {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      if (user) {
        alert("Terhubung ke Google!");
      }
    } catch (error) {
      console.error("Login Error", error);
    }
  };

  return (
    <div className="p-6 pb-32 min-h-screen bg-app-bg text-app-text-main max-w-2xl mx-auto animate-in fade-in duration-500">
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-app-surface rounded-full transition-colors active:scale-90"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
      </header>

      <div className="space-y-8">
        {/* Profil Section */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text-muted px-2">Identitas</h2>
          <div className="bg-app-surface border border-app-border rounded-xl p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-app-primary/10 rounded-xl flex-shrink-0">
                <User className="text-app-primary" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-bold text-app-text-muted uppercase mb-1 block">Nama Pengguna</label>
                <input 
                  type="text" 
                  value={newUsername} 
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Masukkan nama..."
                  className="w-full bg-transparent border-b border-app-border focus:border-app-primary outline-none py-1 font-semibold transition-colors text-app-text-main"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl flex-shrink-0">
                <Hash className="text-blue-500" size={20} />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-app-text-muted uppercase mb-1 block">Semester Saat Ini</label>
                <select 
                  value={newSemester} 
                  onChange={(e) => setNewSemester(Number(e.target.value))}
                  className="w-full bg-transparent border-b border-app-border focus:border-app-primary outline-none py-1 font-semibold transition-colors text-app-text-main appearance-none cursor-pointer"
                >
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={s} className="bg-app-surface">Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              onClick={handleSave}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                isSaved 
                ? 'bg-green-600 text-white shadow-green-500/20' 
                : 'bg-app-primary text-white shadow-app-primary/20 hover:opacity-90'
              }`}
            >
              {isSaved ? 'Berhasil Disimpan!' : <><Save size={18} /> Simpan Perubahan</>}
            </button>
          </div>
        </section>

        {/* Personalisasi Section */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text-muted px-2">
            Personalisasi
          </h2>
          <div className="bg-app-surface border border-app-border rounded-xl overflow-hidden shadow-sm flex flex-col">
            {/* Dark Mode Toggle */}
            <button 
              onClick={store.toggleTheme}
              className="w-full p-6 flex items-center justify-between hover:bg-app-bg/50 transition-colors active:bg-app-bg border-b border-app-border"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 rounded-xl flex-shrink-0">
                  {store.theme === 'dark' ? <Sun className="text-orange-500" size={20} /> : <Moon className="text-azure-600" size={20} />}
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Mode Tampilan</p>
                  <p className="text-xs text-app-text-muted mt-0.5">
                    Ganti ke mode {store.theme === 'dark' ? 'Terang' : 'Gelap'}
                  </p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 relative border transition-colors duration-300 ${
                store.theme === 'dark' ? 'bg-app-primary/20 border-app-primary/50' : 'bg-slate-200 border-slate-300'
              }`}>
                <div className={`w-4 h-4 bg-app-primary rounded-full shadow-sm transition-all duration-300 transform ${
                  store.theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </div>
            </button>

            {/* Google Cloud Connection */}
            <div className="p-4">
              <button 
                onClick={handleGoogleConnect}
                className="w-full p-4 bg-white text-slate-900 rounded-xl font-bold flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-all hover:bg-slate-50"
              >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5 flex-shrink-0" alt="Google" />
                <span className="text-sm">Hubungkan ke Google Cloud</span>
              </button>
            </div>
          </div>
        </section>

        {/* Bahaya Section */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/70 px-2">Zona Berbahaya</h2>
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-500/10 rounded-xl flex-shrink-0">
                <ShieldAlert className="text-red-500" size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-red-500">Reset Seluruh Data</p>
                <p className="text-xs text-app-text-muted mt-1 leading-relaxed">
                  Menghapus database lokal. Pastikan Anda sudah membackup data penting jika diperlukan.
                </p>
              </div>
            </div>
            <button 
              onClick={clearAllData}
              className="w-full py-4 border-2 border-red-500/30 text-red-500 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Trash2 size={18} /> Bersihkan Storage
            </button>
          </div>
        </section>

        <footer className="text-center pt-4">
          <p className="text-[9px] text-app-text-muted font-mono uppercase tracking-[0.3em] opacity-50">
            StudentOS v1.0.4-Alpha • Build 2025.12
          </p>
        </footer>
      </div>
    </div>
  );
};