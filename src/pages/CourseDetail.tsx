import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { academicService, type Course } from '@/services/academic.service';
import { vaultService, type AcademicFile } from '@/services/vault.service';
import { googleService } from '@/services/google.service';
import { useUserStore } from '@/lib/store';
import { 
  ArrowLeft, Clock, MapPin, User, 
  FileText, Plus, ExternalLink, Trash2,
  RefreshCw
} from 'lucide-react';

export const ClassroomSyncComponent: React.FC<{ courseName: string }> = ({ courseName }) => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const semester = useUserStore((state) => state.semester);

  const handleSync = async () => {
    setLoading(true);
    try {
      const courses = await googleService.listClassroomCourses();
      const matchedCourse = courses.find((c: any) => 
        c.name.toLowerCase().includes(courseName.toLowerCase())
      );

      if (matchedCourse) {
        const data = await googleService.syncClassroomMaterials(matchedCourse.id);
        setMaterials([...(data.work || []), ...(data.announcements || [])]);
      } else {
        alert("Kelas tidak ditemukan di Google Classroom.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveToVault = async (material: any) => {
    const attachment = material.materials?.find((m: any) => m.driveFile);
    if (!attachment) return alert("Tidak ada file drive yang ditemukan pada materi ini.");

    try {
      const fileId = attachment.driveFile.driveFile.id;
      const fileName = attachment.driveFile.driveFile.title;
      
      const blob = await googleService.downloadDriveFile(fileId);
      
      await vaultService.saveFile({
        name: fileName,
        blob: blob,
        type: blob.type,
        semester: Number(semester),
        category: 'Materi'
      });

      alert(`Berhasil menyimpan ${fileName} ke Vault!`);
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert("Proses simpan gagal. Pastikan izin Drive sudah aktif.");
    }
  };

  return (
    <div className="space-y-4">
      <button 
        onClick={handleSync}
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
      >
        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        {loading ? 'Menyinkronkan...' : 'Tarik Materi Classroom'}
      </button>

      <div className="space-y-2">
        {materials.map((item, idx) => (
          <div key={idx} className="p-4 bg-app-surface border border-app-border rounded-xl flex justify-between items-center shadow-sm">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-app-text-main leading-tight truncate">
                {item.title || item.text?.substring(0, 60)}
              </p>
              <p className="text-[10px] text-app-text-muted font-bold uppercase mt-1">
                {new Date(item.updateTime || item.creationTime).toLocaleDateString()}
              </p>
            </div>
            <button 
              onClick={() => saveToVault(item)}
              className="p-2 bg-app-primary/10 text-app-primary rounded-lg hover:bg-app-primary hover:text-white transition-all"
            >
              <Plus size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [attachments, setAttachments] = useState<AcademicFile[]>([]);
  const [isEditingData, setIsEditingData] = useState(false);
  const [academicData, setAcademicData] = useState({
    lecturerContact: '',
    gradeWeight: 'UTS: 30%, UAS: 40%, Tugas: 30%'
  });

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        const c = await academicService.getCourseById(Number(id));
        if (c) {
          setCourse(c);
          setAcademicData(prev => ({
            ...prev,
            lecturerContact: c.lecturer || ''
          }));
          const allFiles = await vaultService.getFilesBySemester(c.semester);
          const filtered = allFiles.filter(f => f.name.toLowerCase().includes(c.name.toLowerCase()));
          setAttachments(filtered);
        }
      }
    };
    loadData();
  }, [id]);

  const handleSaveAcademicInfo = async () => {
    if (course?.id) {
      await academicService.updateCourse(course.id, {
        lecturer: academicData.lecturerContact,
      });
      setCourse(prev => prev ? { ...prev, lecturer: academicData.lecturerContact } : null);
      setIsEditingData(false);
    }
  };

  if (!course) return null;

  return (
    <div className="p-6 pb-32 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-app-surface rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold truncate uppercase tracking-tight">{course.name}</h1>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-app-surface border border-app-border rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-4 text-app-text-muted">
            <Clock size={20} className="text-app-primary" />
            <p className="text-sm font-medium">{course.day}, {course.time}</p>
          </div>
          <div className="flex items-center gap-4 text-app-text-muted">
            <MapPin size={20} className="text-blue-500" />
            <p className="text-sm font-medium">{course.room}</p>
          </div>
          <div className="flex items-center gap-4 text-app-text-muted">
            <User size={20} className="text-mint-500" />
            <p className="text-sm font-medium">{course.lecturer || 'Dosen Belum Diatur'}</p>
          </div>
        </div>
      </div>

      <section className="bg-app-surface border border-app-border rounded-xl p-6 space-y-4 shadow-sm">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-black uppercase tracking-widest text-app-primary">Akademik & Kontak</h2>
          <button onClick={() => setIsEditingData(!isEditingData)} className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest">
            {isEditingData ? 'Batal' : 'Edit'}
          </button>
        </div>

        {isEditingData ? (
          <div className="space-y-3">
            <input 
              className="w-full p-3 bg-app-bg border border-app-border rounded-lg text-sm outline-none focus:border-app-primary text-app-text-main font-medium"
              placeholder="Email/WA Dosen"
              value={academicData.lecturerContact}
              onChange={e => setAcademicData({...academicData, lecturerContact: e.target.value})}
            />
            <textarea 
              className="w-full p-3 bg-app-bg border border-app-border rounded-lg text-sm outline-none focus:border-app-primary text-app-text-main resize-none font-medium"
              placeholder="Bobot Nilai (Misal: UTS 30%)"
              value={academicData.gradeWeight}
              onChange={e => setAcademicData({...academicData, gradeWeight: e.target.value})}
              rows={3}
            />
            <button onClick={handleSaveAcademicInfo} className="w-full py-3 bg-app-primary text-white rounded-lg font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-all">
              Simpan Info Kuliah
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-bold text-app-text-main">Kontak: <span className="text-app-text-muted font-medium ml-1">{course.lecturer || 'Belum diatur'}</span></p>
            <p className="text-xs text-app-text-muted font-bold uppercase tracking-tight italic">Bobot: {academicData.gradeWeight}</p>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-app-text-muted">Google Classroom</h2>
        </div>
        <ClassroomSyncComponent courseName={course.name} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-app-text-muted">Materi & Dokumen</h2>
          <button 
            onClick={() => navigate('/vault')}
            className="p-2 bg-app-primary/10 text-app-primary rounded-lg hover:bg-app-primary/20 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {attachments.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-app-border rounded-xl text-center">
              <p className="text-xs text-app-text-muted font-medium">Belum ada dokumen terkait di Vault.</p>
            </div>
          ) : (
            attachments.map((file) => (
              <div key={file.id} className="p-4 bg-app-surface border border-app-border rounded-xl flex items-center gap-4 transition-all hover:border-app-primary/50">
                <div className="p-3 bg-red-500/10 rounded-xl">
                  <FileText className="text-red-500" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate uppercase tracking-tight text-app-text-main">{file.name}</p>
                  <p className="text-[10px] text-app-text-muted uppercase font-bold mt-1">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button 
                  onClick={() => window.open(URL.createObjectURL(file.blob), '_blank')}
                  className="p-2 text-app-text-muted hover:text-app-primary transition-colors"
                >
                  <ExternalLink size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <button 
        onClick={() => {
          if (window.confirm('Hapus mata kuliah ini dari jadwal?')) {
            academicService.deleteCourse(course.id!).then(() => navigate('/schedule'));
          }
        }}
        className="w-full py-4 border-2 border-red-500/30 text-red-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all active:scale-[0.98] uppercase text-xs tracking-widest"
      >
        <Trash2 size={18} /> Hapus Mata Kuliah
      </button>
    </div>
  );
};

export default CourseDetail;