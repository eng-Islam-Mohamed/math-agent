import React, { useRef, useState } from "react";
import { UploadCloud, File, X, Image as ImageIcon, Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileDropzoneProps {
  accept: string;
  type: "image" | "audio";
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
}

export default function FileDropzone({
  accept,
  type,
  selectedFile,
  onFileSelect,
}: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Basic check
      const fileType = file.type.toLowerCase();
      if (type === "image" && !fileType.startsWith("image/")) return;
      if (type === "audio" && !fileType.startsWith("audio/") && !file.name.endsWith(".m4a")) return;
      onFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const Icon = type === "image" ? ImageIcon : Music;

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-300 ${
        isDragActive
          ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
          : selectedFile
          ? "border-emerald-500/50 bg-emerald-500/5"
          : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/40"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {selectedFile ? (
          <motion.div
            key="file-selected"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center text-center space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-400 border border-emerald-500/20">
              <Icon size={28} className="animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200 max-w-[250px] truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-400">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={clearFile}
              className="flex items-center space-x-1.5 px-3 py-1 text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-full transition"
            >
              <X size={12} />
              <span>Remove</span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center space-y-3"
          >
            <div className="p-4 bg-slate-900/60 rounded-full text-slate-400 border border-slate-800/80">
              <UploadCloud size={28} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-300">
                Drag and drop your math {type} here
              </p>
              <p className="text-xs text-slate-500">
                or click to browse ({type === "image" ? "PNG, JPG, WEBP" : "MP3, WAV, M4A"})
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
