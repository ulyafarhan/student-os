import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { academicService, type Course } from '@/services/academic.service';
import { vaultService, type AcademicFile } from '@/services/vault.service';
import { 
  ArrowLeft, Clock, MapPin, User, 
  FileText, Plus, ExternalLink, Trash2 
} from 'lucide-react';

export const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [attachments, setAttachments] = useState<AcademicFile[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        const c = await academicService.getCourseById(Number(id));
        if (c) {
          setCourse(c);
          const allFiles = await vaultService.getFilesBySemester(c.semester);
          const filtered = allFiles.filter(f => f.name.toLowerCase().includes(c.name.toLowerCase()));
          setAttachments(filtered);
        }
      }
    };
    loadData();
  }, [id]);

  if (!course) return null;

  return (
    <div className="p-6 pb-32 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-app-surface rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold truncate">{course.name}</h1>
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
              <p className="text-xs text-app-text-muted ">Belum ada dokumen terkait mata kuliah ini di Vault.</p>
            </div>
          ) : (
            attachments.map((file) => (
              <div key={file.id} className="p-4 bg-app-surface border border-app-border rounded-xl flex items-center gap-4 transition-all hover:border-app-primary/50">
                <div className="p-3 bg-red-500/10 rounded-xl">
                  <FileText className="text-red-500" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{file.name}</p>
                  <p className="text-[10px] text-app-text-muted uppercase font-bold tracking-tighter">
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
        className="w-full py-4 border-2 border-red-500/30 text-red-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
      >
        <Trash2 size={18} /> Hapus Mata Kuliah
      </button>
    </div>
  );
};