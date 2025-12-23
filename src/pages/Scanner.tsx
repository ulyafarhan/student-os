import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, RefreshCw, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
import { vaultService } from '@/services/vault.service';
import { useUserStore } from '@/lib/store';
import { ImageProcessor } from '@/lib/image-processor';

declare const cv: any;

export const Scanner: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const { semester } = useUserStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCvReady, setIsCvReady] = useState(false);

  useEffect(() => {
    const checkCV = setInterval(() => {
      if (window.cv && window.cv.Mat) {
        setIsCvReady(true);
        clearInterval(checkCV);
      }
    }, 200);
    return () => clearInterval(checkCV);
  }, []);

  const applyMagicFilter = useCallback((imgElement: HTMLImageElement) => {
    if (!window.cv || !canvasRef.current) return;
    
    const src = cv.imread(imgElement);
    const dst = new cv.Mat();
    
    try {
      cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
      cv.adaptiveThreshold(src, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
      cv.imshow(canvasRef.current, dst);
    } catch (err) {
      console.error("OpenCV Processing Error:", err);
    } finally {
      src.delete();
      dst.delete();
    }
  }, []);

  const capture = useCallback(async () => {
    const image = webcamRef.current?.getScreenshot();
    if (image && canvasRef.current) {
      const img = new Image();
      img.src = image;
      img.onload = async () => {
        const contour = await ImageProcessor.detectDocument(img);
        if (contour) {
          ImageProcessor.warpPerspective(canvasRef.current!, contour);
          ImageProcessor.applyMagicColor(canvasRef.current!); 
          const processedImage = canvasRef.current!.toDataURL('image/jpeg');
          setImages(prev => [...prev, processedImage]);
        } else {
          setImages(prev => [...prev, image]); 
        }
      };
    }
  }, [webcamRef, applyMagicFilter]);

  const saveToVault = async () => {
    if (images.length === 0 || isProcessing) return;
    setIsProcessing(true);

    try {
      const pdf = new jsPDF();
      
      for (let i = 0; i < images.length; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(images[i], 'JPEG', 0, 0, 210, 297);
      }

      const pdfBlob = pdf.output('blob');
      await vaultService.saveFile({
        name: `MultiScan_${Date.now()}.pdf`,
        blob: pdfBlob,
        type: 'application/pdf',
        semester: Number(semester) || 1,
        category: 'Document'
      });

      confetti({ particleCount: 150, spread: 70 });
      navigate('/vault');
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-[9999] overflow-hidden">
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0 shadow-lg">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-bold tracking-tight">HD Scanner v4</h1>
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
            {images.length} Halaman
          </p>
        </div>
        <div className="w-10" />
      </div>

      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {images.length > 0 && (
          <div className="absolute bottom-6 left-6 w-16 h-20 border-2 border-white rounded-lg overflow-hidden shadow-2xl animate-in zoom-in">
            <img src={images[images.length - 1]} className="w-full h-full object-cover" alt="preview" />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white font-bold text-xs">
              {images.length}
            </div>
          </div>
        )}
        
        {!isCvReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md text-white gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-sm font-bold tracking-[0.2em] uppercase opacity-80">Vision Engine Loading</p>
          </div>
        )}

        {isCvReady && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-12">
            <div className="w-full h-full border-2 border-white/20 rounded-xl relative">
              <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900 p-8 pb-12 flex justify-center items-center gap-12 shrink-0 border-t border-white/5">
        <button
          onClick={() => setImages([])}
          disabled={images.length === 0}
          className="p-4 bg-slate-800 rounded-full text-white disabled:opacity-20 transition-all active:scale-90"
        >
          <RefreshCw size={24} />
        </button>

        <button
          onClick={capture}
          disabled={!isCvReady}
          className="group relative flex items-center justify-center disabled:opacity-20 transition-opacity"
        >
          <div className="absolute w-24 h-24 rounded-full border-4 border-white/20 group-active:scale-90 transition-transform" />
          <div className="w-20 h-20 bg-white rounded-full shadow-2xl group-active:scale-95 transition-transform" />
        </button>

        <button
          onClick={saveToVault}
          disabled={images.length === 0 || isProcessing}
          className="p-5 bg-blue-600 rounded-full text-white shadow-xl disabled:opacity-20 transition-all active:scale-90"
        >
          {isProcessing ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : (
            <Check size={28} />
          )}
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};