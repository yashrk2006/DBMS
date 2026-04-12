import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Camera, CameraOff, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface WebcamPreviewHandle {
  startRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
}

export const WebcamPreview = forwardRef<WebcamPreviewHandle, {}>((prop, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  useImperativeHandle(ref, () => ({
    startRecording: () => {
      if (!stream) return;
      chunksRef.current = [];
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      
      try {
        const recorder = new MediaRecorder(stream, options);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.start(1000); // 1 second intervals
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        console.log("Recording started...");
      } catch (e) {
        console.error("MediaRecorder failed:", e);
      }
    },
    stopRecording: () => {
      return new Promise((resolve) => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
          resolve(null);
          return;
        }

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          chunksRef.current = [];
          setIsRecording(false);
          resolve(blob);
        };

        mediaRecorderRef.current.stop();
      });
    }
  }));

  useEffect(() => {
    async function setupCamera() {
      try {
        const constraints = {
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          },
          audio: true 
        };
        
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
      } catch (err) {
        console.error("Camera access denied or failed:", err);
        setError("Camera access required for assessment. Please check permissions.");
      }
    }

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // TAC_BIND: Force bind stream to video element whenever it changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(e => console.warn("Industrial Autoplay Blocked:", e));
      };
    }
  }, [stream]);

  return (
    <div className="relative group">
      {/* PROFESSIONAL CAMERA FRAME */}
      <div className="w-full aspect-video md:w-64 md:aspect-square rounded-3xl bg-slate-900 border-2 border-slate-800 overflow-hidden shadow-2xl relative">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center space-y-2 bg-rose-500/10"
            >
              <CameraOff className="text-rose-500" size={24} />
              <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">{error}</p>
            </motion.div>
          ) : (
            <div className="absolute inset-0">
               <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted={isMuted}
                className="w-full h-full object-cover scale-x-[-1]" 
              />
              
              {/* SCANLINES OVERLAY */}
              <div className="absolute inset-x-0 top-0 h-1 bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.5)] animate-scanline pointer-events-none" />
              
              {/* HUD OVERLAY */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                 <div className={`size-2 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                 <span className="text-[10px] font-bold text-white uppercase tracking-[2px] drop-shadow-md">
                   {isRecording ? 'Recording Active' : 'Live Assessment'}
                 </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                 <div className="text-[8px] font-mono text-white/60 tracking-wider">
                    720P // H.264
                 </div>
                 <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-1 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                 </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* GLASS REFLECTION */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
      </div>

      {/* TOOLTIP/LABEL */}
      <div className="absolute -top-3 -right-3 px-3 py-1 rounded-full bg-[#0F172A] border border-white/10 text-[8px] font-black text-indigo-400 uppercase tracking-widest shadow-xl">
        Proctoring {isRecording ? 'Recording' : 'Active'}
      </div>
    </div>
  );
});

WebcamPreview.displayName = 'WebcamPreview';
