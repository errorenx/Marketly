import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { User, Product, ContentType } from '../../types';
import { api } from '../../services/api';
import {
  PlusSquare,
  Radio,
  FileText,
  Camera,
  Video,
  Upload,
  Sparkles,
  X,
  Check,
  ShoppingBag,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Store,
  Users,
  MessageSquare,
  Trash2,
  Repeat,
  FileImage,
  Clock,
  Heart,
  Bookmark,
  Share2,
  Truck,
  CheckCircle2,
} from 'lucide-react';

interface CreateScreenProps {
  currentUser: User;
  onClose?: () => void;
  onContentCreated: (type: 'post' | 'status') => void;
}

export const CreateScreen: React.FC<CreateScreenProps> = ({
  currentUser,
  onClose,
  onContentCreated,
}) => {
  const { t } = useI18n();

  // Root view mode:
  // 'choice': Exactly two options: CREATE POST or CREATE STATUS
  // 'post': Facebook-like create post wizard
  // 'status': Create status story flow
  const [activeFlow, setActiveFlow] = useState<'choice' | 'post' | 'status'>('choice');

  // -------------------------------------------------------------
  // POST CREATION STATE
  // -------------------------------------------------------------
  // Role-based destination rules:
  // - Seller: SELLER or SOCIAL
  // - Social: SOCIAL only
  const getAllowedDestinations = (): ContentType[] => {
    if (currentUser.role === 'SELLER') return ['seller', 'social'];
    return ['social'];
  };

  const allowedDestinations = getAllowedDestinations();
  const [postStep, setPostStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDestination, setSelectedDestination] = useState<ContentType>(allowedDestinations[0]);

  // Media state
  const [postMediaType, setPostMediaType] = useState<'photo' | 'video'>('photo');
  const [postMediaUrl, setPostMediaUrl] = useState<string>('');
  const [postStoragePath, setPostStoragePath] = useState<string>('');
  const [postUploadState, setPostUploadState] = useState<'idle' | 'uploading' | 'complete' | 'failed'>('idle');
  const [postUploadError, setPostUploadError] = useState<string | null>(null);

  // Description & product
  const [postCaption, setPostCaption] = useState('');
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // -------------------------------------------------------------
  // STATUS CREATION STATE
  // -------------------------------------------------------------
  const [statusMediaType, setStatusMediaType] = useState<'photo' | 'video'>('photo');
  const [statusMediaUrl, setStatusMediaUrl] = useState<string>('');
  const [statusStoragePath, setStatusStoragePath] = useState<string>('');
  const [statusOptionalCaption, setStatusOptionalCaption] = useState<string>('');
  const [statusUploadState, setStatusUploadState] = useState<'idle' | 'uploading' | 'complete' | 'failed'>('idle');
  const [statusUploadError, setStatusUploadError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // COMMON CAMERA & PUBLISH STATE
  // -------------------------------------------------------------
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusFileInputRef = useRef<HTMLInputElement>(null);

  // Load seller products if seller
  useEffect(() => {
    if (currentUser.role === 'SELLER') {
      api.getProducts({ sellerId: currentUser.id })
        .then((res) => setSellerProducts(res.products || []))
        .catch(console.error);
    }
  }, [currentUser.id, currentUser.role]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // -------------------------------------------------------------
  // LIVE CAMERA & RECORDING HELPERS
  // -------------------------------------------------------------
  const startCamera = async (forVideo = false) => {
    setPublishError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: forVideo,
      });
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setPublishError(
        'Camera/Microphone access was denied or not available. You can upload media directly from your device below.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsRecordingVideo(false);
  };

  const captureLivePhoto = async (target: 'post' | 'status') => {
    if (!videoPreviewRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoPreviewRef.current.videoWidth || 640;
      canvas.height = videoPreviewRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoPreviewRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        stopCamera();
        await uploadMediaData(dataUrl, 'photo', target, 'captured_photo.jpg');
      }
    } catch (err: any) {
      setPublishError('Photo capture failed: ' + err.message);
    }
  };

  const startLiveRecording = () => {
    if (!streamRef.current) return;
    try {
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          stopCamera();
          if (activeFlow === 'post') {
            await uploadMediaData(dataUrl, 'video', 'post', 'recorded_video.mp4');
          } else {
            await uploadMediaData(dataUrl, 'video', 'status', 'recorded_video.mp4');
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecordingVideo(true);
    } catch (err: any) {
      setPublishError('Video recording failed: ' + err.message);
    }
  };

  const stopLiveRecording = () => {
    if (mediaRecorderRef.current && isRecordingVideo) {
      mediaRecorderRef.current.stop();
      setIsRecordingVideo(false);
    }
  };

  // -------------------------------------------------------------
  // REAL MEDIA UPLOAD LOGIC
  // -------------------------------------------------------------
  const uploadMediaData = async (
    dataUrl: string,
    type: 'photo' | 'video',
    target: 'post' | 'status',
    fileName = 'media_upload'
  ) => {
    if (target === 'post') {
      setPostMediaType(type);
      setPostUploadState('uploading');
      setPostUploadError(null);
    } else {
      setStatusMediaType(type);
      setStatusUploadState('uploading');
      setStatusUploadError(null);
    }

    try {
      // Real upload to backend storage endpoint
      const uploadRes = await api.uploadMedia({
        fileData: dataUrl,
        fileName,
        fileType: type === 'video' ? 'video/mp4' : 'image/jpeg',
        mediaType: type,
      });

      if (target === 'post') {
        setPostMediaUrl(uploadRes.media_url);
        setPostStoragePath(uploadRes.storage_path);
        setPostUploadState('complete');
      } else {
        setStatusMediaUrl(uploadRes.media_url);
        setStatusStoragePath(uploadRes.storage_path);
        setStatusUploadState('complete');
      }
    } catch (err: any) {
      const msg = err.message || 'Media upload failed';
      if (target === 'post') {
        setPostUploadState('failed');
        setPostUploadError(msg);
      } else {
        setStatusUploadState('failed');
        setStatusUploadError(msg);
      }
    }
  };

  const handleDeviceFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'post' | 'status'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith('video');
    const type: 'photo' | 'video' = isVid ? 'video' : 'photo';

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await uploadMediaData(dataUrl, type, target, file.name);
    };
    reader.readAsDataURL(file);
  };

  // -------------------------------------------------------------
  // SAMPLE MEDIA PRESETS FOR FAST TESTING
  // -------------------------------------------------------------
  const SAMPLE_PRESETS = [
    {
      title: 'Sony WH-1000XM5 Demo',
      type: 'video' as const,
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    },
    {
      title: 'Islamabad Drive Vlog',
      type: 'video' as const,
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    },
    {
      title: 'Product Showcase Kurti',
      type: 'photo' as const,
      url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Tech Gadget Studio',
      type: 'photo' as const,
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    },
  ];

  // -------------------------------------------------------------
  // PUBLISH POST HANDLER
  // -------------------------------------------------------------
  const handlePublishPost = async () => {
    // Validation
    if (!postMediaUrl && !postCaption.trim()) {
      setPublishError('Please add a photo, video, or caption before publishing.');
      return;
    }

    if (postUploadState === 'uploading') {
      setPublishError('Please wait for the media upload to complete.');
      return;
    }

    // Role validation
    if (currentUser.role === 'SELLER' && !['seller', 'social'].includes(selectedDestination)) {
      setPublishError('Sellers can only publish to SELLER or SOCIAL.');
      return;
    }
    if (currentUser.role === 'SOCIAL' && selectedDestination !== 'social') {
      setPublishError('Social users can only publish to SOCIAL.');
      return;
    }

    setPublishing(true);
    setPublishError(null);

    try {
      const selectedProd = sellerProducts.find((p) => p.id === selectedProductId);

      await api.createPost({
        authorId: currentUser.id,
        authorName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.username,
        authorUsername: currentUser.username,
        authorAvatar: currentUser.avatar,
        authorCity: currentUser.city,
        contentType: selectedDestination,
        caption: postCaption.trim(),
        mediaType: postMediaType,
        mediaUrl: postMediaUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        storagePath: postStoragePath,
        productContext:
          selectedDestination === 'seller' && selectedProd
            ? {
                productId: selectedProd.id,
                productName: selectedProd.name,
                productPrice: selectedProd.originalPrice,
                productDiscount: selectedProd.discount,
                finalPrice: selectedProd.finalPrice,
                productImage: selectedProd.mediaUrls[0] || postMediaUrl,
                sellerId: currentUser.id,
                sellerName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.username,
                sellerCity: currentUser.city,
                freeDelivery: selectedProd.freeDelivery,
                warranty: selectedProd.warranty,
                warrantyDuration: selectedProd.warrantyDuration,
              }
            : undefined,
      });

      setPublishSuccess(true);
      setTimeout(() => {
        onContentCreated('post');
      }, 1200);
    } catch (err: any) {
      setPublishError(err.message || 'Unable to publish your post. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  // -------------------------------------------------------------
  // PUBLISH STATUS HANDLER
  // -------------------------------------------------------------
  const handlePublishStatus = async () => {
    if (!statusMediaUrl) {
      setStatusUploadError('Please select or record a photo or video for your status.');
      return;
    }

    if (statusUploadState === 'uploading') {
      setStatusUploadError('Please wait for the media upload to finish.');
      return;
    }

    setPublishing(true);
    setStatusUploadError(null);

    try {
      await api.createStatus({
        userId: currentUser.id,
        type: statusMediaType,
        mediaUrl: statusMediaUrl,
        storagePath: statusStoragePath,
        caption: statusOptionalCaption.trim() || undefined,
        bgGradient: 'from-violet-600 via-pink-600 to-amber-600',
      });

      setPublishSuccess(true);
      setTimeout(() => {
        onContentCreated('status');
      }, 1200);
    } catch (err: any) {
      setStatusUploadError(err.message || 'Unable to publish your status. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  // =============================================================
  // 1. ROOT CHOICE SCREEN: CREATE POST vs CREATE STATUS
  // =============================================================
  if (activeFlow === 'choice') {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <PlusSquare className="w-6 h-6 text-violet-400" />
              <span>Create</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select what you want to create and share with your Marketly network
            </p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* The Two Main Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OPTION 1: CREATE POST */}
          <div
            onClick={() => setActiveFlow('post')}
            className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-violet-500/80 transition-all cursor-pointer group shadow-xl hover:shadow-violet-900/20 flex flex-col justify-between space-y-5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-[11px] font-extrabold border border-violet-500/30">
                  Feed & Profile
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white group-hover:text-violet-300 transition-colors">
                  1. CREATE POST
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Publish a permanent social or marketplace post with photo or video, role destination routing, and description rendered below media.
                </p>
              </div>

              <div className="pt-2 space-y-1.5 text-[11px] text-slate-400">
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Destination: {allowedDestinations.join(' / ').toUpperCase()}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Photo & Video upload with live camera capture</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Description strictly below media</span>
                </p>
              </div>
            </div>

            <button className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 group-hover:shadow-violet-600/40">
              <span>Create Post</span>
              <span>→</span>
            </button>
          </div>

          {/* OPTION 2: CREATE STATUS */}
          <div
            onClick={() => setActiveFlow('status')}
            className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/80 transition-all cursor-pointer group shadow-xl hover:shadow-amber-900/20 flex flex-col justify-between space-y-5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-violet-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-extrabold border border-amber-500/30">
                  24 Hours Temporary
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                  2. CREATE STATUS
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Share a temporary photo or video story that automatically disappears after 24 hours. No text required — share instantly with only media!
                </p>
              </div>

              <div className="pt-2 space-y-1.5 text-[11px] text-slate-400">
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Supports Photo or Video (no caption required)</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Automatic 24-hour expiration</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Full vertical story viewer with seen counts & reactions</span>
                </p>
              </div>
            </div>

            <button className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 group-hover:shadow-rose-600/40">
              <span>Create Status</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =============================================================
  // 2. CREATE STATUS FLOW (Photo / Video, 24h Expiration, No text required)
  // =============================================================
  if (activeFlow === 'status') {
    return (
      <div className="w-full max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        {/* Status Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <button
            onClick={() => {
              stopCamera();
              setActiveFlow('choice');
            }}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Options</span>
          </button>

          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-extrabold border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" /> 24-Hour Story
          </span>
        </div>

        {/* Live Camera View if active */}
        {isCameraActive && (
          <div className="relative aspect-[9/16] max-h-[460px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-violet-500/50">
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={stopCamera}
                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="absolute bottom-6 inset-x-0 flex items-center justify-center gap-4 z-20">
              <button
                onClick={() => captureLivePhoto('status')}
                className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Take Photo</span>
              </button>

              {!isRecordingVideo ? (
                <button
                  onClick={startLiveRecording}
                  className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95"
                >
                  <Video className="w-4 h-4" />
                  <span>Record Video</span>
                </button>
              ) : (
                <button
                  onClick={stopLiveRecording}
                  className="px-5 py-2.5 rounded-2xl bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 animate-pulse shadow-lg"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  <span>Stop Recording</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Media Selection / Upload Options */}
        {!isCameraActive && !statusMediaUrl && (
          <div className="space-y-4">
            <div className="p-8 border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-3xl text-center space-y-4 bg-slate-900/40">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 text-white flex items-center justify-center mx-auto shadow-lg">
                <Radio className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-extrabold text-base text-white">Choose Status Media</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  A Status must support photo or video. Text is completely optional.
                </p>
              </div>

              <input
                ref={statusFileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => handleDeviceFileSelect(e, 'status')}
              />

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => statusFileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Select from Device</span>
                </button>

                <button
                  onClick={() => startCamera(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>Take Live Photo</span>
                </button>

                <button
                  onClick={() => startCamera(true)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95"
                >
                  <Video className="w-4 h-4 text-rose-400" />
                  <span>Record Live Video</span>
                </button>
              </div>
            </div>

            {/* Quick Sample Presets */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Or test with sample media
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setStatusMediaType(preset.type);
                      setStatusMediaUrl(preset.url);
                      setStatusStoragePath(`samples/${preset.type}_${idx}`);
                      setStatusUploadState('complete');
                    }}
                    className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-left text-xs text-slate-300 hover:text-white transition-all"
                  >
                    <p className="font-bold truncate">{preset.title}</p>
                    <span className="text-[10px] text-amber-400 uppercase">{preset.type}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STATUS PREVIEW (7. STATUS PREVIEW) */}
        {!isCameraActive && statusMediaUrl && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h3 className="font-black text-sm text-white">Status Preview</h3>
              <p className="text-xs text-slate-400">
                Preview your 24-hour photo/video story before posting
              </p>
            </div>

            {/* 9:16 Vertical Story Mockup */}
            <div className="relative aspect-[9/16] max-h-[480px] max-w-xs mx-auto bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
              {statusMediaType === 'video' ? (
                <video
                  src={statusMediaUrl}
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={statusMediaUrl}
                  alt="Status Preview"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Story Header overlay */}
              <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="w-8 h-8 rounded-full border-2 border-amber-400 object-cover"
                  />
                  <div>
                    <p className="font-extrabold text-xs text-white drop-shadow">
                      {currentUser.firstName} {currentUser.lastName}
                    </p>
                    <p className="text-[10px] text-white/80 drop-shadow">Expires in 24 hours</p>
                  </div>
                </div>
              </div>

              {/* Optional caption overlay */}
              {statusOptionalCaption.trim() && (
                <div className="absolute bottom-6 inset-x-4 z-10 text-center">
                  <span className="inline-block px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white font-medium text-xs border border-white/10">
                    {statusOptionalCaption}
                  </span>
                </div>
              )}
            </div>

            {/* Real Upload Status Indicator */}
            {statusUploadState === 'uploading' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center gap-2 text-xs text-amber-300 font-bold animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Uploading media to storage...</span>
              </div>
            )}
            {statusUploadState === 'complete' && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center gap-2 text-xs text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Media upload complete</span>
              </div>
            )}
            {statusUploadState === 'failed' && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-2 text-center">
                <p className="text-xs text-rose-300 font-bold">{statusUploadError || 'Upload failed'}</p>
                <button
                  onClick={() => statusFileInputRef.current?.click()}
                  className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-bold"
                >
                  Retry Upload
                </button>
              </div>
            )}

            {/* Optional Caption Field (Strictly optional, no text required) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Optional Caption (Text is not required)
              </label>
              <input
                type="text"
                value={statusOptionalCaption}
                onChange={(e) => setStatusOptionalCaption(e.target.value)}
                placeholder="Add optional caption or leave empty..."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Buttons: REPLACE, REMOVE, CANCEL, POST STATUS */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  setStatusMediaUrl('');
                  setStatusUploadState('idle');
                }}
                className="py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Replace</span>
              </button>

              <button
                onClick={() => {
                  setStatusMediaUrl('');
                  setStatusOptionalCaption('');
                  setStatusUploadState('idle');
                }}
                className="py-2.5 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setActiveFlow('choice')}
                className="w-1/3 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-all"
              >
                Cancel
              </button>

              <button
                onClick={handlePublishStatus}
                disabled={publishing || statusUploadState === 'uploading'}
                className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-rose-600 to-violet-600 hover:from-amber-500 hover:to-violet-500 text-white text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {publishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Publishing Status...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Post Status (24 Hours)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {publishSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-center space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
            <p className="text-xs font-black text-white">Status story posted successfully!</p>
          </div>
        )}
      </div>
    );
  }

  // =============================================================
  // 3. CREATE POST FLOW (Facebook-like flow with 4 clear steps)
  // =============================================================
  return (
    <div className="w-full max-w-xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Wizard Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={() => {
            if (postStep > 1) {
              setPostStep((prev) => (prev - 1) as any);
            } else {
              stopCamera();
              setActiveFlow('choice');
            }
          }}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{postStep > 1 ? 'Back' : 'Options'}</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-300">
          <span className="text-violet-400">Step {postStep} of 4:</span>
          <span>
            {postStep === 1 && 'Select Destination'}
            {postStep === 2 && 'Upload Media'}
            {postStep === 3 && 'Add Description'}
            {postStep === 4 && 'Final Preview & Publish'}
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {publishError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{publishError}</span>
          </div>
          <button
            onClick={handlePublishPost}
            className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* STEP 1: SELECT POST DESTINATION */}
      {postStep === 1 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-black text-base text-white">Select Post Destination</h3>
            <p className="text-xs text-slate-400">
              Your available destinations depend strictly on your role ({currentUser.role}).
            </p>
          </div>

          <div className="space-y-2.5">
            {allowedDestinations.map((dest) => {
              const isSelected = selectedDestination === dest;
              return (
                <div
                  key={dest}
                  onClick={() => setSelectedDestination(dest)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-violet-600/20 border-violet-500 shadow-md'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        dest === 'seller'
                          ? 'bg-violet-600 text-white'
                          : 'bg-sky-600 text-white'
                      }`}
                    >
                      {dest === 'seller' ? (
                        <Store className="w-5 h-5" />
                      ) : (
                        <Users className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-white uppercase tracking-wide">
                        {dest} Feed
                      </p>
                      <p className="text-xs text-slate-400">
                        {dest === 'seller'
                          ? 'Commercial product showcases and seller inventory with COD checkout.'
                          : 'Community, lifestyle, thoughts, and discussions.'}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-violet-500 bg-violet-600' : 'border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setPostStep(2)}
            className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-4"
          >
            <span>Continue to Media</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* STEP 2: POST MEDIA */}
      {postStep === 2 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-black text-base text-white">Add Photo or Video</h3>
            <p className="text-xs text-slate-400">
              Upload from your device, or capture live using camera and microphone.
            </p>
          </div>

          {/* Live Camera View if active */}
          {isCameraActive && (
            <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-violet-500/50">
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              <div className="absolute top-3 right-3 z-20">
                <button
                  onClick={stopCamera}
                  className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3 z-20">
                <button
                  onClick={() => captureLivePhoto('post')}
                  className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Photo</span>
                </button>

                {!isRecordingVideo ? (
                  <button
                    onClick={startLiveRecording}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                  >
                    <Video className="w-4 h-4" />
                    <span>Record Video</span>
                  </button>
                ) : (
                  <button
                    onClick={stopLiveRecording}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 animate-pulse shadow"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    <span>Stop Recording</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Media Preview if uploaded/selected */}
          {!isCameraActive && postMediaUrl && (
            <div className="space-y-3">
              <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-slate-800 shadow-lg">
                {postMediaType === 'video' ? (
                  <video
                    src={postMediaUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={postMediaUrl}
                    alt="Post media preview"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Upload state */}
              {postUploadState === 'uploading' && (
                <div className="p-3 bg-violet-500/10 border border-violet-500/30 rounded-2xl flex items-center justify-center gap-2 text-xs text-violet-300 font-bold animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Uploading to storage...</span>
                </div>
              )}
              {postUploadState === 'complete' && (
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center gap-2 text-xs text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Media upload complete</span>
                </div>
              )}
              {postUploadState === 'failed' && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-1 text-center">
                  <p className="text-xs text-rose-300 font-bold">{postUploadError || 'Upload failed'}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-bold"
                  >
                    Retry Upload
                  </button>
                </div>
              )}

              {/* Replace / Remove Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Replace Media</span>
                </button>

                <button
                  onClick={() => {
                    setPostMediaUrl('');
                    setPostUploadState('idle');
                  }}
                  className="py-2.5 px-4 rounded-2xl bg-rose-950/40 text-rose-300 border border-rose-800/40 text-xs font-bold hover:bg-rose-900/60 transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          )}

          {/* Media Picker / Upload Box */}
          {!isCameraActive && !postMediaUrl && (
            <div className="p-8 border-2 border-dashed border-slate-700 hover:border-violet-500/60 rounded-3xl text-center space-y-4 bg-slate-900/40">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => handleDeviceFileSelect(e, 'post')}
              />

              <div className="w-12 h-12 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>

              <div>
                <p className="font-extrabold text-sm text-white">Upload Media</p>
                <p className="text-xs text-slate-400 mt-1">
                  Select photo or video from your device, or capture live.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload File</span>
                </button>

                <button
                  onClick={() => startCamera(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Camera className="w-4 h-4 text-violet-400" />
                  <span>Take Live Photo</span>
                </button>

                <button
                  onClick={() => startCamera(true)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Video className="w-4 h-4 text-indigo-400" />
                  <span>Record Live Video</span>
                </button>
              </div>

              {/* Sample Presets */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2 text-left">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Or pick a sample preset:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setPostMediaType(p.type);
                        setPostMediaUrl(p.url);
                        setPostStoragePath(`samples/post_${p.type}_${i}`);
                        setPostUploadState('complete');
                      }}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-violet-500/50 text-left text-xs text-slate-300"
                    >
                      <p className="font-bold truncate">{p.title}</p>
                      <span className="text-[10px] text-violet-400 uppercase">{p.type}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setPostStep(3)}
            disabled={postUploadState === 'uploading'}
            className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            <span>Continue to Caption</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* STEP 3: POST DESCRIPTION */}
      {postStep === 3 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-black text-base text-white">Add Description & Caption</h3>
            <p className="text-xs text-slate-400">
              Write your caption. In Marketly, this description will render strictly BELOW the media.
            </p>
          </div>

          <div className="space-y-1.5">
            <textarea
              value={postCaption}
              onChange={(e) => setPostCaption(e.target.value)}
              placeholder="What's happening? Add details, specifications, or thoughts..."
              rows={4}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>Supports hashtags and mentions</span>
              <span>{postCaption.length} characters</span>
            </div>
          </div>

          {/* Quick Hashtags */}
          <div className="flex flex-wrap gap-1.5">
            {['#Marketly', '#Pakistan', '#COD', '#Trending', '#Lahore', '#Karachi'].map((tag) => (
              <button
                key={tag}
                onClick={() => setPostCaption((prev) => `${prev} ${tag}`.trim())}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Seller Product Linkage (if destination is seller) */}
          {selectedDestination === 'seller' && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-violet-300">
                <ShoppingBag className="w-4 h-4" />
                <span>Link a Catalog Product (Cash on Delivery)</span>
              </div>

              {sellerProducts.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No products in your catalog yet. You can still publish this post or add products in Seller Center.
                </p>
              ) : (
                <div className="space-y-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="">-- No attached product --</option>
                    {sellerProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — Rs. {p.finalPrice.toLocaleString()}
                      </option>
                    ))}
                  </select>

                  {selectedProductId && (
                    <div className="p-2.5 bg-violet-950/40 border border-violet-800/40 rounded-xl flex items-center gap-3">
                      <ShoppingBag className="w-5 h-5 text-violet-400 shrink-0" />
                      <div className="text-xs">
                        <p className="font-bold text-white">Product attached for COD purchase</p>
                        <p className="text-[11px] text-slate-400">
                          Shoppers can tap "ORDER NOW" directly on your post.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setPostStep(4)}
            className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-4"
          >
            <span>Continue to Final Preview</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* STEP 4: FINAL PREVIEW & PUBLISH (REQUIREMENT 4: DESCRIPTION BELOW MEDIA) */}
      {postStep === 4 && (
        <div className="space-y-4">
          <div className="space-y-1 text-center">
            <h3 className="font-black text-base text-white">Final Post Preview</h3>
            <p className="text-xs text-slate-400">
              Verify your post layout. Notice the caption renders strictly BELOW the photo/video.
            </p>
          </div>

          {/* The Exact Visual Layout Mandated by Requirement 4:
              [ User / Profile Information ]
              [ PHOTO or VIDEO ]
              [ User's description/caption ]
              [ Like ] [ Comment ] [ Save ] [ Share ]
          */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* 1. User / Profile Information */}
            <div className="p-4 flex items-center justify-between border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.username}
                  className="w-10 h-10 rounded-xl object-cover border border-violet-500/30"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-white">
                      {currentUser.firstName} {currentUser.lastName}
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase">
                      {selectedDestination}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    @{currentUser.username} • {currentUser.city}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold text-slate-500">Just now</span>
            </div>

            {/* 2. PHOTO or VIDEO */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              {postMediaUrl ? (
                postMediaType === 'video' ? (
                  <video
                    src={postMediaUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={postMediaUrl}
                    alt="Post Media"
                    className="w-full h-full object-contain"
                  />
                )
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  (Text-only post layout)
                </div>
              )}
            </div>

            {/* 3. User's description/caption — STRICTLY RENDERED BELOW THE MEDIA */}
            <div className="p-4 space-y-2 border-b border-slate-800/60">
              <p className="text-xs font-medium text-slate-200 leading-relaxed">
                {postCaption || '(No description provided)'}
              </p>

              {/* Product Badge if Seller Destination */}
              {selectedDestination === 'seller' && selectedProductId && (
                <div className="p-2.5 bg-violet-950/40 border border-violet-500/30 rounded-2xl flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold text-white">
                      {sellerProducts.find((p) => p.id === selectedProductId)?.name}
                    </span>
                  </div>
                  <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                    <Truck className="w-3 h-3" /> Cash on Delivery
                  </span>
                </div>
              )}
            </div>

            {/* 4. [ Like ] [ Comment ] [ Save ] [ Share ] */}
            <div className="p-3 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400 font-bold">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 hover:text-white cursor-pointer">
                  <Heart className="w-4 h-4 text-rose-500" /> 0
                </span>
                <span className="flex items-center gap-1.5 hover:text-white cursor-pointer">
                  <MessageSquare className="w-4 h-4 text-violet-400" /> 0
                </span>
                <span className="flex items-center gap-1.5 hover:text-white cursor-pointer">
                  <Bookmark className="w-4 h-4 text-amber-400" /> Save
                </span>
              </div>
              <span className="flex items-center gap-1 hover:text-white cursor-pointer">
                <Share2 className="w-4 h-4 text-sky-400" /> Share
              </span>
            </div>
          </div>

          {/* Action Buttons: BACK and PUBLISH */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setPostStep(3)}
              className="w-1/3 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs transition-all"
            >
              Back
            </button>

            <button
              onClick={handlePublishPost}
              disabled={publishing}
              className="w-2/3 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {publishing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Publishing Post...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Publish Post</span>
                </>
              )}
            </button>
          </div>

          {publishSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="text-xs font-black text-white">Post published successfully!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
