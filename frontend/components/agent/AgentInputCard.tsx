import React, { useState, useEffect } from "react";
import { Sparkles, FileText, Image as ImageIcon, Music, Mail, AlertCircle, BookOpen, Shield, Compass, GraduationCap, Zap, Check, Mic, Square, Trash2, Brain, PenTool, ClipboardCheck } from "lucide-react";
import { motion } from "framer-motion";
import FileDropzone from "./FileDropzone";
import { AdvancedSolveOptions, InputType } from "../../lib/types";

interface AgentInputCardProps {
  onSolve: (
    type: InputType,
    content: string,
    email: string,
    file: File | null,
    solutionMode: string,
    pdfStyle: string,
    advancedOptions: AdvancedSolveOptions
  ) => void;
  isLoading: boolean;
}

const SOLUTION_MODES = [
  { id: "Exam Mode", name: "Exam Mode", desc: "Concise, exam-ready steps", icon: FileText },
  { id: "Full Explanation Mode", name: "Full Explanation", desc: "Every step detailed", icon: BookOpen },
  { id: "Proof Mode", name: "Proof Mode", desc: "Formal math rigor", icon: Shield },
  { id: "Research Style Mode", name: "Research Style", desc: "Compact & advanced", icon: Compass },
  { id: "Teacher Mode", name: "Teacher Mode", desc: "Intuitive & pedagogical", icon: GraduationCap },
  { id: "Fast Answer Mode", name: "Fast Answer", desc: "Direct answer only", icon: Zap },
  { id: "Mistake Diagnosis Mode", name: "Mistake Diagnosis", desc: "Find the first bad step", icon: ClipboardCheck },
  { id: "Socratic Tutor Mode", name: "Socratic Tutor", desc: "Guided hints path", icon: Brain }
];

const PDF_STYLES = [
  { id: "Clean Academic", name: "Clean Academic" },
  { id: "Luxury Dark", name: "Luxury Dark" },
  { id: "Exam Sheet", name: "Exam Sheet" },
  { id: "Professor Notes", name: "Professor Notes" },
  { id: "Minimal LaTeX", name: "Minimal LaTeX" }
];

const CURRICULA = ["General", "Common Core", "AP Calculus", "IB Math", "A-levels", "University Calculus", "Linear Algebra", "Real Analysis"];
const EXPLANATION_STYLES = ["Explain like I am 12", "High school exam", "University rigorous", "Visual intuition", "No shortcuts", "Fast final answer", "Professor-style proof"];
const TUTOR_DEPTHS = ["Light hints", "Guided", "No-spoiler", "Rescue mode"];

export default function AgentInputCard({ onSolve, isLoading }: AgentInputCardProps) {
  const [activeTab, setActiveTab] = useState<InputType>("text");
  const [textProblem, setTextProblem] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [solutionMode, setSolutionMode] = useState("Full Explanation Mode");
  const [pdfStyle, setPdfStyle] = useState("Clean Academic");
  const [curriculum, setCurriculum] = useState("General");
  const [explanationStyle, setExplanationStyle] = useState("University rigorous");
  const [tutorDepth, setTutorDepth] = useState("Guided");
  const [studentAttempt, setStudentAttempt] = useState("");
  const [whiteboardNotes, setWhiteboardNotes] = useState("");
  const [validationError, setValidationError] = useState("");
  const [recordMode, setRecordMode] = useState<"record" | "upload">("record");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/wav" });
        const audioFile = new File([audioBlob], "voice_memo.wav", { type: "audio/wav" });
        setUploadedFile(audioFile);
        const url = URL.createObjectURL(audioBlob);
        setRecordedUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      setRecordedUrl(null);

      const interval = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 120) {
            recorder.stop();
            setIsRecording(false);
            clearInterval(interval);
            setTimerInterval(null);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      setTimerInterval(interval);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setValidationError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  };

  const resetRecording = () => {
    setUploadedFile(null);
    setRecordedUrl(null);
    setRecordingTime(0);
    setValidationError("");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTabChange = (tab: InputType) => {
    setActiveTab(tab);
    setUploadedFile(null);
    setValidationError("");
    
    // Stop recording on tab change
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setRecordedUrl(null);
    setRecordingTime(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    // Validate inputs
    if (activeTab === "text" && !textProblem.trim()) {
      setValidationError("Please enter a mathematical problem description.");
      return;
    }

    if (activeTab !== "text" && !uploadedFile) {
      setValidationError(`Please upload an ${activeTab} file to solve.`);
      return;
    }

    // Call submit handler
    onSolve(
      activeTab,
      activeTab === "text" ? textProblem : uploadedFile!.name,
      email,
      uploadedFile,
      solutionMode,
      pdfStyle,
      {
        curriculum,
        explanationStyle,
        studentAttempt,
        whiteboardNotes,
        tutorDepth,
        includePractice: true,
        includeTeacherDashboard: true
      }
    );
  };

  return (
    <div className="w-full max-w-2xl bg-slate-950/80 backdrop-blur-xl border border-slate-900 shadow-2xl shadow-black/80 rounded-2xl overflow-hidden p-6 md:p-8">
      {/* Tabs Menu */}
      <div className="flex border-b border-slate-900 pb-4 mb-6 gap-2">
        <button
          type="button"
          onClick={() => handleTabChange("text")}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === "text"
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
          }`}
        >
          <FileText size={16} />
          <span>Text Problem</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("image")}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === "image"
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
          }`}
        >
          <ImageIcon size={16} />
          <span>Image / Photo</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("audio")}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === "audio"
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
          }`}
        >
          <Music size={16} />
          <span>Voice Memo</span>
        </button>
      </div>

      {/* Input Fields Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dynamic Input based on Active Tab */}
        <div>
          {activeTab === "text" ? (
            <div className="space-y-2">
              <label htmlFor="problem" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Math problem formulation
              </label>
              <textarea
                id="problem"
                rows={5}
                value={textProblem}
                onChange={(e) => setTextProblem(e.target.value)}
                placeholder="Example: Solve 2x + 5 = 17 or Find the limit as x goes to infinity of (sin x) / x"
                className="w-full bg-slate-900/50 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 focus:border-blue-500/50 text-slate-200 placeholder-slate-600 rounded-xl p-4 text-sm focus:outline-none transition-all duration-300 resize-none font-mono"
              />
            </div>
          ) : activeTab === "image" ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Math image upload
              </label>
              <FileDropzone
                type="image"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                selectedFile={uploadedFile}
                onFileSelect={setUploadedFile}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Audio voice memo
              </label>
              
              <div className="flex flex-col items-center justify-center p-6 border border-slate-900 bg-slate-950/40 rounded-xl space-y-4">
                <div className="flex items-center space-x-4 mb-2">
                  <button
                    key="btn-rec"
                    type="button"
                    onClick={() => { setRecordMode("record"); resetRecording(); }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 ${
                      recordMode === "record"
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : "border-slate-900 bg-slate-900/10 hover:border-slate-800 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Record Voice
                  </button>
                  <button
                    key="btn-upl"
                    type="button"
                    onClick={() => { setRecordMode("upload"); resetRecording(); }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 ${
                      recordMode === "upload"
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : "border-slate-900 bg-slate-900/10 hover:border-slate-800 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Upload File
                  </button>
                </div>

                {recordMode === "record" ? (
                  <div className="w-full flex flex-col items-center py-4 space-y-4">
                    {isRecording ? (
                      <div className="flex flex-col items-center space-y-4">
                        {/* Framer Motion sound wave visualizer */}
                        <div className="flex items-center space-x-1.5 justify-center h-10">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                            <motion.span
                              key={i}
                              animate={{
                                scaleY: [0.3, 1, 0.3],
                              }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.05,
                              }}
                              className="w-1.5 h-6 bg-red-500 rounded-full origin-center"
                            />
                          ))}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                          <span className="text-sm font-bold text-red-400 font-mono">
                            Recording: {formatTime(recordingTime)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="flex items-center justify-center p-4 bg-red-600 hover:bg-red-500 text-white rounded-full transition shadow-lg shadow-red-500/20"
                        >
                          <Square size={16} fill="white" />
                        </button>
                      </div>
                    ) : recordedUrl ? (
                      <div className="w-full flex flex-col items-center space-y-4">
                        <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                          <Check size={12} />
                          <span>Voice Memo Recorded!</span>
                        </div>
                        <audio src={recordedUrl} controls className="w-full max-w-sm h-10 px-2" />
                        <button
                          type="button"
                          onClick={resetRecording}
                          className="flex items-center space-x-2 px-4 py-2 bg-slate-900 border border-slate-800 text-red-400 hover:text-red-300 text-xs font-semibold rounded-xl transition"
                        >
                          <Trash2 size={12} />
                          <span>Delete and Re-record</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-4">
                        <button
                          type="button"
                          onClick={startRecording}
                          className="flex items-center justify-center p-6 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition shadow-lg shadow-blue-500/20 group relative"
                        >
                          <Mic size={24} />
                          <span className="absolute inset-0 rounded-full border border-blue-500/30 group-hover:scale-125 transition duration-300 pointer-events-none" />
                        </button>
                        <span className="text-xs text-slate-500">Click to start recording (maximum 2 minutes)</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full">
                    <FileDropzone
                      type="audio"
                      accept="audio/mp3, audio/wav, audio/mpeg, audio/ogg, audio/x-m4a"
                      selectedFile={uploadedFile}
                      onFileSelect={setUploadedFile}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Solution Mode Selector (3-column grid cards) */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Solution Mode
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SOLUTION_MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = solutionMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSolutionMode(mode.id)}
                  className={`flex flex-col items-center justify-center p-3 text-center border rounded-xl transition-all duration-200 group relative ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/5 text-blue-400"
                      : "border-slate-900 bg-slate-900/10 hover:border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon size={18} className="mb-2" />
                  <span className="text-xs font-bold block">{mode.name}</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-1">{mode.desc}</span>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 bg-blue-500 text-white p-0.5 rounded-full">
                      <Check size={8} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Learning Controls */}
        <div className="space-y-4 border-t border-slate-900 pt-5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Brain size={13} />
            <span>Advanced Learning Intelligence</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Curriculum</label>
              <select
                value={curriculum}
                onChange={(e) => setCurriculum(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-900 focus:border-blue-500/50 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
              >
                {CURRICULA.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Explain Like</label>
              <select
                value={explanationStyle}
                onChange={(e) => setExplanationStyle(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-900 focus:border-blue-500/50 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
              >
                {EXPLANATION_STYLES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tutor Path</label>
              <select
                value={tutorDepth}
                onChange={(e) => setTutorDepth(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-900 focus:border-blue-500/50 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
              >
                {TUTOR_DEPTHS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <ClipboardCheck size={11} />
                <span>Student Attempt</span>
              </label>
              <textarea
                rows={4}
                value={studentAttempt}
                onChange={(e) => setStudentAttempt(e.target.value)}
                placeholder="Paste your attempted solution to get the first wrong step and misconception."
                className="w-full bg-slate-900/40 border border-slate-900 focus:border-blue-500/50 text-slate-200 placeholder-slate-600 rounded-lg p-3 text-xs focus:outline-none resize-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <PenTool size={11} />
                <span>Whiteboard Notes</span>
              </label>
              <textarea
                rows={4}
                value={whiteboardNotes}
                onChange={(e) => setWhiteboardNotes(e.target.value)}
                placeholder="Optional scratch work, diagram notes, or steps from a whiteboard session."
                className="w-full bg-slate-900/40 border border-slate-900 focus:border-blue-500/50 text-slate-200 placeholder-slate-600 rounded-lg p-3 text-xs focus:outline-none resize-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* PDF Style Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            PDF Export Theme Style
          </label>
          <div className="flex flex-wrap gap-2">
            {PDF_STYLES.map((style) => {
              const isSelected = pdfStyle === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setPdfStyle(style.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                      : "border-slate-900 bg-slate-900/10 hover:border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {style.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Email Recipient Input */}
        <div className="space-y-2">
          <label htmlFor="email" className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Mail size={12} />
            <span>Email Report Delivery (Optional)</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="islambenaboud007@gmail.com"
            className="w-full bg-slate-900/50 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 focus:border-blue-500/50 text-slate-200 placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-300"
          />
        </div>

        {/* Validation Errors */}
        {validationError && (
          <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
            <AlertCircle size={14} />
            <span>{validationError}</span>
          </div>
        )}

        {/* Submit button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={isLoading}
          className={`relative w-full flex items-center justify-center space-x-2 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/20 focus:outline-none ${
            isLoading ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing & Solving...</span>
            </div>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Solve Problem</span>
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
}
