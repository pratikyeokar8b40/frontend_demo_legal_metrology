import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Loader2,
  RefreshCw,
  Printer,
  X,
  MapPin,
  Calendar,
  Building,
  Package,
  ShieldCheck,
  Award,
  ArrowLeft,
  Eye,
  Check,
  Info
} from "lucide-react";

const CHECKLIST_ITEMS = [
  { id: 1, text: "Extracting Text via PaddleOCR...", type: "check" },
  { id: 2, text: "Unrolling 360-degree cylinder...", type: "check" },
  { id: 3, text: "Checking Rule 6: Mandatory Declarations...", type: "check" },
  { id: 4, text: "Verifying Rule 13: Standard SI Units...", type: "warning" },
  { id: 5, text: "Calculating Schedule II Font Dimensions...", type: "check" },
  { id: 6, text: "Generating TrustStore Hash...", type: "check" },
];

export default function ScannerPage() {
  const [step, setStep] = useState("initial"); // 'initial' | 'camera' | 'processing' | 'report'
  const [capturedImage, setCapturedImage] = useState(null);
  const [completedIndex, setCompletedIndex] = useState(-1);
  const [cameraError, setCameraError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // Stop camera stream helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Step 2: Camera Start
  const startCamera = async () => {
    setCameraError(null);
    setStep("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Webcam access failed or denied:", err);
      // Fallback for devices without webcam or denied permission
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr) {
        setCameraError("Camera unavailable or permission denied. Please upload an image or use sample photo.");
      }
    }
  };

  // Step 2: Capture Image from Camera
  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(dataUrl);
      stopCamera();
      startProcessing();
    }
  };

  // Step 2: Upload File Action
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target.result);
      startProcessing();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Use a default mock product photo if user selects sample
  const useSamplePhoto = () => {
    setCapturedImage("/organic_honey_jar.jpg");
    startProcessing();
  };

  // Step 3: Start AI Simulation Processing
  const startProcessing = () => {
    setStep("processing");
    setCompletedIndex(-1);
  };

  // Step 3: Timer effect for loading checklist (every 800ms)
  useEffect(() => {
    if (step !== "processing") return;

    let timer;
    if (completedIndex < CHECKLIST_ITEMS.length - 1) {
      timer = setTimeout(() => {
        setCompletedIndex((prev) => prev + 1);
      }, 800);
    }

    return () => clearTimeout(timer);
  }, [step, completedIndex]);

  // Reset to initial state
  const resetScanner = () => {
    stopCamera();
    setStep("initial");
    setCapturedImage(null);
    setCompletedIndex(-1);
    setCameraError(null);
    setShowReportModal(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 font-sans">
      {/* Hidden File Input & Canvas */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Container */}
      {step !== "report" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-200 rounded-full text-teal-700 text-xs font-semibold uppercase tracking-wider mb-2">
                <ShieldCheck size={14} /> Smart India Hackathon AI Inspection Desk
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Legal Metrology Compliance Scanner
              </h1>
              <p className="text-slate-600 text-sm mt-1 max-w-2xl">
                Automated pack inspection engine for Legal Metrology (Packaged Commodities) Rules, 2011. Scan or upload product labels to extract declarations, verify SI metrics, and generate digital notices.
              </p>
            </div>
            {step !== "initial" && (
              <button
                onClick={resetScanner}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-all"
              >
                <RefreshCw size={16} /> Restart Scanner
              </button>
            )}
          </div>

          {/* 1. INITIAL STATE (Two Buttons) */}
          {step === "initial" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Scan Product Button Card */}
              <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:border-teal-500 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
                    <Camera size={32} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Scan Product</h2>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                      Launch your device's web camera in high-definition to perform live label scanning and real-time bounding box extraction.
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <button
                    onClick={startCamera}
                    className="w-full py-4 px-6 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 hover:shadow-teal-600/40 flex items-center justify-center gap-3 transition-all transform active:scale-95 text-base"
                  >
                    <Camera size={20} /> Open Device Camera
                  </button>
                </div>
              </div>

              {/* Upload Image Button Card */}
              <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                    <Upload size={32} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Upload Image</h2>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                      Select a high-resolution photo or product packaging artwork from your computer or mobile storage.
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-slate-900/40 flex items-center justify-center gap-3 transition-all transform active:scale-95 text-base"
                  >
                    <Upload size={20} /> Select File from Device
                  </button>
                </div>
              </div>

              {/* Quick Mock Sample Card for Quick Hackathon Demo */}
              <div className="md:col-span-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500 text-white rounded-xl">
                    <Package size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Quick Demo Mode (Preloaded Sample)</h3>
                    <p className="text-xs text-slate-600">Want to test without camera access? Load pre-configured Organic Honey Jar (500g) label sample.</p>
                  </div>
                </div>
                <button
                  onClick={useSamplePhoto}
                  className="whitespace-nowrap px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                >
                  Load Sample Honey Jar
                </button>
              </div>
            </div>
          )}

          {/* 2. CAMERA FEED / ACTION STATE */}
          {step === "camera" && (
            <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 max-w-3xl mx-auto text-white space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500 absolute" />
                  <span className="font-mono text-xs font-semibold tracking-wider text-emerald-400 ml-4 uppercase">
                    Live Web Camera Feed • Active
                  </span>
                </div>
                <button
                  onClick={resetScanner}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modern Camera Container with Rounded Corners & Viewfinder */}
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl flex items-center justify-center group">
                {cameraError ? (
                  <div className="p-8 text-center space-y-4 max-w-md">
                    <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
                    <p className="text-sm text-slate-300">{cameraError}</p>
                    <div className="flex gap-3 justify-center pt-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                      >
                        Upload Image File
                      </button>
                      <button
                        onClick={useSamplePhoto}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl"
                      >
                        Use Sample Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Viewfinder Target Frame */}
                    <div className="absolute inset-8 border-2 border-dashed border-teal-400/60 rounded-xl pointer-events-none flex flex-col justify-between p-4">
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl" />
                        <div className="w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr" />
                      </div>
                      <div className="text-center font-mono text-xs text-teal-300 bg-slate-900/70 px-3 py-1 rounded-full w-fit mx-auto backdrop-blur-md">
                        ALIGN PRODUCT LABEL WITHIN FRAME
                      </div>
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl" />
                        <div className="w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Capture Button below feed */}
              {!cameraError && (
                <div className="flex items-center justify-center gap-4 pt-2">
                  <button
                    onClick={resetScanner}
                    className="px-5 py-3 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 font-semibold rounded-xl text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={captureFrame}
                    className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-3 transition-all transform active:scale-95 text-base"
                  >
                    <div className="w-4 h-4 rounded-full bg-slate-950 animate-pulse" />
                    Capture Image
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. PROCESSING STATE (Simulating AI Laser + Dynamic Checklist) */}
          {step === "processing" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Image Preview & Scanning Laser Overlay Container (Left 6 Cols) */}
              <div className="lg:col-span-6 bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    LayoutLMv3 Spatial Inspection
                  </span>
                  <span className="text-xs text-slate-400 font-mono">500g Jar Label</span>
                </div>

                {/* Image Container with Scanning Laser */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-[4/3] flex items-center justify-center group">
                  {/* Laser Moving Overlay (Only active during scanning simulation) */}
                  {completedIndex < CHECKLIST_ITEMS.length - 1 && (
                    <div className="animate-laser" />
                  )}

                  {/* Rendered Captured or Mock Image */}
                  {capturedImage && capturedImage !== "/organic_honey_jar.jpg" ? (
                    <img
                      src={capturedImage}
                      alt="Captured Label"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    /* Mock Product Label UI Representation */
                    <div className="w-full h-full p-6 bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col justify-between border-4 border-amber-300 text-slate-900 relative">
                      {/* Bounding Box Highlights simulating PaddleOCR */}
                      <div className="border-2 border-emerald-500 bg-emerald-500/10 p-2 rounded relative">
                        <span className="absolute -top-3 left-2 bg-emerald-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                          Rule 6(1)(a) [Manufacturer]
                        </span>
                        <p className="text-xs font-bold">Packed by: M/s Metro Retail Hypermarket Pvt Ltd</p>
                        <p className="text-[10px] text-slate-600">Plot 12, Industrial Area, Pune - 411018</p>
                      </div>

                      <div className="my-2 border-2 border-emerald-500 bg-emerald-500/10 p-2 rounded relative">
                        <span className="absolute -top-3 left-2 bg-emerald-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                          Commodity
                        </span>
                        <h3 className="text-base font-extrabold text-amber-900 uppercase">Organic Honey Jar</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="border-2 border-amber-500 bg-amber-500/20 p-2 rounded relative">
                          <span className="absolute -top-3 left-2 bg-amber-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                            Rule 13(5) [Net Qty Infraction]
                          </span>
                          <p className="text-xs font-black text-rose-700">Net Vol: 500 gms</p>
                          <p className="text-[9px] text-rose-600 font-semibold">★ Flagged: Used 'gms' instead of 'g'</p>
                        </div>
                        <div className="border-2 border-emerald-500 bg-emerald-500/10 p-2 rounded relative">
                          <span className="absolute -top-3 left-2 bg-emerald-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                            Rule 6(1)(e) [MRP]
                          </span>
                          <p className="text-xs font-bold text-emerald-800">MRP: ₹ 350.00</p>
                          <p className="text-[9px] text-slate-600">(Incl. of all taxes)</p>
                        </div>
                      </div>

                      <div className="border-2 border-emerald-500 bg-emerald-500/10 p-1.5 rounded text-[10px] text-slate-700">
                        Batch No: MH-HNY-2026-09 | Mfg Date: 01/2026
                      </div>
                    </div>
                  )}

                  {/* AI Status Pill Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${completedIndex < CHECKLIST_ITEMS.length - 1 ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                      {completedIndex < CHECKLIST_ITEMS.length - 1 ? "OCR & Bounding Box Engine Active" : "AI Inspection Complete"}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">Conf: 98.6%</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Loading Checklist & Results (Right 6 Cols) */}
              <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Loader2 className={`w-5 h-5 text-teal-600 ${completedIndex < CHECKLIST_ITEMS.length - 1 ? 'animate-spin' : 'hidden'}`} />
                    Legal Metrology Rule Verification
                  </h2>
                  <p className="text-slate-500 text-xs mt-1">
                    Executing automated verification pipeline for PCR 2011 statutory provisions.
                  </p>
                </div>

                {/* Checklist Items Container */}
                <div className="space-y-3">
                  {CHECKLIST_ITEMS.map((item, idx) => {
                    const isDone = idx <= completedIndex;
                    const isCurrent = idx === completedIndex + 1;

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border transition-all duration-500 flex items-center justify-between ${
                          isDone
                            ? item.type === "warning"
                              ? "bg-amber-50/80 border-amber-200 text-amber-900"
                              : "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                            : isCurrent
                            ? "bg-slate-50 border-teal-500 shadow-md ring-2 ring-teal-500/20"
                            : "bg-slate-50/50 border-slate-100 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isDone ? (
                            item.type === "warning" ? (
                              <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 animate-bounce" />
                            ) : (
                              <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                            )
                          ) : isCurrent ? (
                            <Loader2 size={20} className="text-teal-600 animate-spin flex-shrink-0" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                          )}
                          <span className={`text-xs sm:text-sm font-medium ${isDone ? "font-semibold" : ""}`}>
                            {item.text}
                          </span>
                        </div>

                        {/* Status Tag */}
                        {isDone && (
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                              item.type === "warning"
                                ? "bg-amber-200/60 text-amber-800"
                                : "bg-emerald-200/60 text-emerald-800"
                            }`}
                          >
                            {item.type === "warning" ? "FLAGGED" : "PASSED"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Final State Trigger Button: Appears after ~4 seconds when simulation finishes */}
                {completedIndex >= CHECKLIST_ITEMS.length - 1 && (
                  <div className="pt-4 border-t border-slate-100 animate-fadeIn space-y-3">
                    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-xs text-emerald-400 font-mono font-semibold uppercase">Inspection Complete</span>
                        <h4 className="font-bold text-sm">Official Notice Ready for Generation</h4>
                      </div>
                      <span className="px-2.5 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold rounded-lg">
                        Non-Compliant
                      </span>
                    </div>

                    <button
                      onClick={() => setStep("report")}
                      className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all transform active:scale-95 hover:scale-[1.02]"
                    >
                      <FileText size={22} /> View Final Statutory Notice Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. FINAL RESULTS STATE (The Notice Report) */}
      {step === "report" && (
        <div className="space-y-6">
          {/* Action Bar (Top floating bar for easy navigation & print) */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 print-hide">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep("processing")}
                className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-xl transition-all"
                title="Back to Inspection View"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">OFFICIAL GOVERNMENT NOTICE</span>
                <h3 className="font-bold text-sm text-slate-100">Notice Ref: LMO/MH/PUNE/2026/0894</h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all"
              >
                <Printer size={16} /> Print / Save Notice PDF
              </button>
              <button
                onClick={resetScanner}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all"
              >
                Scan Another Product
              </button>
            </div>
          </div>

          {/* Full Screen Formal Government Document Container */}
          <div className="bg-white border-4 border-slate-900 rounded-lg p-6 sm:p-12 shadow-2xl max-w-4xl mx-auto font-serif text-slate-900 space-y-6 relative overflow-hidden print-only-container">
            {/* Green VERIFIED Tick Seal Badge Header */}
            <div className="absolute top-6 right-6 sm:top-10 sm:right-10 flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-emerald-600 bg-emerald-50 flex items-center justify-center shadow-lg transform rotate-12">
                <div className="text-center">
                  <Check className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600 mx-auto stroke-[3]" />
                  <span className="block text-[8px] font-sans font-black text-emerald-800 tracking-tighter uppercase">VERIFIED</span>
                </div>
              </div>
              <span className="mt-1 font-mono text-[9px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                DIGITAL HASH AUDITED
              </span>
            </div>

            {/* Official Government Header */}
            <div className="text-center border-b-2 border-slate-900 pb-6 space-y-1">
              <h4 className="font-sans font-bold text-xs tracking-widest uppercase text-slate-600">
                GOVERNMENT OF MAHARASHTRA
              </h4>
              <h2 className="font-bold text-base sm:text-xl text-slate-900 uppercase tracking-tight">
                FOOD, CIVIL SUPPLIES AND CONSUMER PROTECTION DEPARTMENT
              </h2>
              <h3 className="font-sans font-extrabold text-sm sm:text-base text-slate-800 uppercase">
                OFFICE OF THE CONTROLLER OF LEGAL METROLOGY, MAHARASHTRA STATE
              </h3>
              <p className="font-sans text-[11px] text-slate-600">
                Barrack No. 7, Free Church Compound, Mahapalika Marg, Mumbai – 400001 | Tel: 022-22622022
              </p>
            </div>

            {/* Notice Title Banner */}
            <div className="bg-rose-50 border-2 border-rose-700 text-rose-950 p-4 text-center rounded">
              <h1 className="font-sans font-black text-sm sm:text-lg uppercase tracking-wide">
                SHOW CAUSE NOTICE UNDER SECTION 15 OF THE LEGAL METROLOGY ACT, 2009
              </h1>
              <p className="font-sans font-semibold text-xs text-rose-800 mt-1 uppercase">
                READ WITH RULE 32 OF THE LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011
              </p>
            </div>

            {/* Metadata Grid (Hardcoded required values) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs border border-slate-300 p-4 rounded bg-slate-50/60">
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block">Notice Reference No:</span>
                <strong className="font-mono text-sm text-slate-900">LMO/MH/PUNE/2026/0894</strong>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block">Inspection Timestamp:</span>
                <strong className="font-mono text-xs text-slate-900">07-09-2026 | 12:15:42 IST</strong>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block">GPS Geolocation:</span>
                <strong className="font-mono text-xs text-slate-900">18.5018° N, 73.8636° E</strong>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block">Inspected Establishment:</span>
                <strong className="text-xs text-slate-900">M/s Metro Retail Hypermarket</strong>
              </div>
              <div className="sm:col-span-2">
                <span className="font-bold text-slate-500 uppercase text-[10px] block">Audited Commodity (SKU):</span>
                <strong className="text-sm text-slate-900">Organic Honey Jar (500g)</strong>
              </div>
            </div>

            {/* Subject Section */}
            <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-slate-800">
              <p className="font-bold">
                SUBJECT: Notice to show cause regarding statutory labeling infractions and metric standard violations under the Legal Metrology (Packaged Commodities) Rules, 2011.
              </p>
              <p className="text-slate-700">
                WHEREAS, in exercise of powers under Section 15 of the Legal Metrology Act, 2009, an automated digital inspection of pre-packaged commodities was conducted at your establishment. The inspection verified mandatory declarations and identified statutory contraventions as specified hereunder:
              </p>
            </div>

            {/* Passed & Failed Statutory Rules Table */}
            <div className="space-y-3 font-sans">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
                Statutory Compliance Findings Summary
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold">
                      <th className="border border-slate-400 p-2.5 text-left">Rule Clause</th>
                      <th className="border border-slate-400 p-2.5 text-left">Statutory Requirement</th>
                      <th className="border border-slate-400 p-2.5 text-left">Actual Label Finding</th>
                      <th className="border border-slate-400 p-2.5 text-center">Status / Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* PASSED RULES */}
                    <tr className="bg-emerald-50/50">
                      <td className="border border-slate-300 p-2 font-mono font-bold">Rule 6(1)(a)</td>
                      <td className="border border-slate-300 p-2">Manufacturer / Packer Name & Address</td>
                      <td className="border border-slate-300 p-2">M/s Metro Retail Hypermarket Pvt Ltd printed</td>
                      <td className="border border-slate-300 p-2 text-center">
                        <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded">PASSED</span>
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/50">
                      <td className="border border-slate-300 p-2 font-mono font-bold">Rule 6(1)(e)</td>
                      <td className="border border-slate-300 p-2">Maximum Retail Price (MRP incl. of taxes)</td>
                      <td className="border border-slate-300 p-2">MRP: ₹ 350.00 clearly stated</td>
                      <td className="border border-slate-300 p-2 text-center">
                        <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded">PASSED</span>
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/50">
                      <td className="border border-slate-300 p-2 font-mono font-bold">Rule 18(2)</td>
                      <td className="border border-slate-300 p-2">Tampering & Safety Seal Integrity</td>
                      <td className="border border-slate-300 p-2">Induction seal intact; no tampering detected</td>
                      <td className="border border-slate-300 p-2 text-center">
                        <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded">PASSED</span>
                      </td>
                    </tr>

                    {/* FAILED RULES */}
                    <tr className="bg-rose-50/80">
                      <td className="border border-slate-300 p-2 font-mono font-bold text-rose-800">Rule 13(5)</td>
                      <td className="border border-slate-300 p-2 font-semibold">Standard SI Metric Units</td>
                      <td className="border border-slate-300 p-2 text-rose-900 font-bold">
                        Used 'gms' instead of standard statutory symbol 'g'
                      </td>
                      <td className="border border-slate-300 p-2 text-center">
                        <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded">FAILED</span>
                      </td>
                    </tr>
                    <tr className="bg-rose-50/80">
                      <td className="border border-slate-300 p-2 font-mono font-bold text-rose-800">Rule 6(1)(c)</td>
                      <td className="border border-slate-300 p-2 font-semibold">Net Quantity Declaration Syntax</td>
                      <td className="border border-slate-300 p-2 text-rose-900 font-bold">
                        Improper Net Quantity font syntax formatting
                      </td>
                      <td className="border border-slate-300 p-2 text-center">
                        <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded">FAILED</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Statutory Advisory Box */}
            <div className="font-sans text-xs bg-slate-100 border-l-4 border-slate-800 p-3.5 space-y-1">
              <strong className="block text-slate-900 uppercase">PENAL PROVISIONS & ACTION NOTICE:</strong>
              <p className="text-slate-700">
                You are hereby directed to show cause in writing within 15 days of receipt of this notice why compounding/penal action under Section 36(1) of the Legal Metrology Act, 2009 should not be initiated against your establishment for non-compliant metric unit declarations.
              </p>
            </div>

            {/* Officer Signature & Verification Block */}
            <div className="pt-6 border-t-2 border-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 font-sans">
              <div className="space-y-1 text-xs">
                <span className="font-mono text-[10px] text-slate-500 uppercase block">DIGITAL TRUSTSTORE VERIFICATION</span>
                <p className="font-mono text-[11px] text-slate-700">Hash: e3b0c44298fc1c149afbf4c8996fb924</p>
                <p className="text-slate-600 text-[11px]">System: SIH2026 Autonomous Metrology Inspector</p>
              </div>

              <div className="text-right space-y-1">
                {/* Formal Digital Signature Graphic */}
                <div className="inline-block p-2 border border-slate-300 rounded bg-slate-50 text-left font-mono text-[10px]">
                  <span className="text-emerald-700 font-bold block">✓ DIGITALLY SIGNED</span>
                  <span className="text-slate-800 font-bold block">Anubhav Pande</span>
                  <span className="text-slate-500 block">Legal Metrology Inspector (Zone-3)</span>
                </div>
                <p className="font-bold text-xs text-slate-900 mt-1">Anubhav Pande</p>
                <p className="text-xs text-slate-600">Legal Metrology Inspector (Zone-3)</p>
                <p className="text-[10px] text-slate-500">Government of Maharashtra, Pune Division</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
