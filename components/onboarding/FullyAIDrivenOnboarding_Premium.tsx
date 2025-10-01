'use client';

/**
 * Premium AI-Driven Onboarding - Aesop-Inspired Design
 * Luxurious, sophisticated chat interface for skincare consultation
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Leaf, Check, AlertCircle, X, Camera, Upload, CheckCircle, Sun, Eye, Zap, Sparkles, User, ShieldCheck, Info } from 'lucide-react';
import { GeolocationCapture, useGeolocation } from './GeolocationCapture';
import { cn } from '@/lib/utils';
import { capturePhoto, uploadPhoto, validatePhoto, formatFileSize, PhotoResult } from '@/lib/utils/photo-upload';
import { haptics } from '@/lib/native/haptics';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

interface ConversationPhase {
  name: string;
  description: string;
  placeholder: string;
  quickReplies?: string[];
}

const PHASES: ConversationPhase[] = [
  {
    name: 'Discovery',
    description: 'Understanding your skin type',
    placeholder: "Tell me about your skin...",
    quickReplies: [
      "Combination (oily T-zone, dry cheeks)",
      "Dry and sensitive",
      "Oily all over",
      "Normal, no major issues",
      "I'm not sure",
    ],
  },
  {
    name: 'Concerns',
    description: 'Your main skin concerns',
    placeholder: "What frustrates you most?",
    quickReplies: [
      "Acne and breakouts",
      "Dark spots or hyperpigmentation",
      "Fine lines and aging",
      "Redness and sensitivity",
      "Dull, uneven texture",
    ],
  },
  {
    name: 'Habits',
    description: 'Your current habits',
    placeholder: "What do you currently use?",
    quickReplies: [
      "Just water and moisturizer",
      "Cleanser and moisturizer",
      "Full routine (5+ steps)",
      "I use makeup but minimal skincare",
      "Nothing consistent",
    ],
  },
  {
    name: 'Lifestyle',
    description: 'Your lifestyle & environment',
    placeholder: "Tell me about your daily life...",
    quickReplies: [
      "Humid, tropical climate",
      "Dry, desert climate",
      "Indoor office work",
      "Outdoor work or activities",
      "Frequent travel",
    ],
  }
];

export function FullyAIDrivenOnboardingPremium() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [environmentCollected, setEnvironmentCollected] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(5);
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);

  // Photo upload state
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<PhotoResult | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Consent state
  const [storageConsent, setStorageConsent] = useState(false);
  const [mlConsent, setMlConsent] = useState(false);
  const [researchConsent, setResearchConsent] = useState(false);
  const [retentionPeriod, setRetentionPeriod] = useState(365); // default 1 year

  const { geolocation, showCapture, capture, dismiss } = useGeolocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update phase based on message count
  useEffect(() => {
    const count = messages.filter(m => m.role === 'user').length;
    if (count >= 1 && count < 2) setCurrentPhase(1);
    else if (count >= 2 && count < 3) setCurrentPhase(2);
    else if (count >= 3) setCurrentPhase(3);
  }, [messages]);

  const startConversation = async () => {
    try {
      const response = await fetch('/api/ai/fully-driven', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          geolocation: geolocation || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();

      const initialMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages([initialMessage]);
      setSessionId(data.sessionId);
      setEnvironmentCollected(data.environmentCollected || false);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm having trouble starting our conversation. Please refresh the page and try again.",
        timestamp: new Date(),
        isError: true
      };
      setMessages([errorMessage]);
    }
  };

  const handleQuickReply = async (reply: string) => {
    if (isLoading || !sessionId) return;

    // Create user message immediately
    const userMessage: Message = {
      role: 'user',
      content: reply,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/fully-driven', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'message',
          sessionId: sessionId,
          message: reply
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      // Add AI response to messages
      const aiMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update AI-generated suggestions
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setAiSuggestions(data.suggestions);
      } else {
        setAiSuggestions(null);
      }

      // Update phase if provided
      if (typeof data.currentPhase === 'number') {
        setCurrentPhase(data.currentPhase);
      }

      // Update estimated time
      if (typeof data.estimatedCompletion === 'number') {
        setEstimatedTimeRemaining(data.estimatedCompletion);
      }

      // Check if conversation is complete
      if (data.isDone && data.profile) {
        setIsDone(true);
        setProfile(data.profile);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "I had trouble processing that. Could you try again?",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionId) {
      startConversation();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !sessionId) return;

    const messageText = inputValue;
    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/fully-driven', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'message',
          sessionId: sessionId,
          message: messageText
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      // Add AI response to messages
      const aiMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update AI-generated suggestions
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setAiSuggestions(data.suggestions);
      } else {
        setAiSuggestions(null);
      }

      // Update phase if provided
      if (typeof data.currentPhase === 'number') {
        setCurrentPhase(data.currentPhase);
      }

      // Update estimated time
      if (typeof data.estimatedCompletion === 'number') {
        setEstimatedTimeRemaining(data.estimatedCompletion);
      }

      // Check if conversation is complete
      if (data.isDone && data.profile) {
        setIsDone(true);
        setProfile(data.profile);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "I had trouble processing that. Could you try again?",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  // Photo capture handler
  const handleCapturePhoto = async () => {
    setIsCapturing(true);
    setUploadError(null);
    await haptics.medium();

    try {
      const photo = await capturePhoto({
        maxSizeMB: 5,
        maxWidthOrHeight: 1920,
        quality: 0.9,
        useNativeCamera: true,
      });

      setIsCapturing(false);
      setIsAnalyzing(true);

      // Validate photo
      const validation = validatePhoto(photo);
      if (!validation.valid) {
        setUploadError(validation.error || 'Invalid photo');
        await haptics.error();
        setIsAnalyzing(false);
        return;
      }

      // Wait a bit to show analyzing animation
      await new Promise(resolve => setTimeout(resolve, 800));

      setCapturedPhoto(photo);
      await haptics.success();
    } catch (error: any) {
      console.error('[Photo Capture] Error:', error);
      setUploadError(error.message || 'Failed to capture photo');
      await haptics.error();
    } finally {
      setIsCapturing(false);
      setIsAnalyzing(false);
    }
  };

  // Photo upload handler
  const handleUploadPhoto = async () => {
    if (!capturedPhoto || !sessionId) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    await haptics.medium();

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await uploadPhoto(capturedPhoto, {
        sessionId,
        photoType: 'baseline',
        mlConsent,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadSuccess(true);
      await haptics.success();

      // Wait a bit to show success, then navigate
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('[Photo Upload] Error:', error);
      setUploadError(error.message || 'Failed to upload photo');
      setUploadProgress(0);
      await haptics.error();
    } finally {
      setIsUploading(false);
    }
  };

  // Retake photo
  const handleRetakePhoto = async () => {
    setCapturedPhoto(null);
    setUploadError(null);
    setUploadSuccess(false);
    await haptics.light();
  };

  // Skip photo upload
  const handleSkipPhoto = async () => {
    await haptics.light();
    router.push('/dashboard');
  };

  if (isDone && profile) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full"
        >
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-br from-sage-500 to-sage-600 p-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-semibold">Baseline Photo</h2>
                  <p className="text-sage-100 text-sm">Optional but recommended</p>
                </div>
              </div>
              <p className="text-sage-50 text-base leading-relaxed">
                Capture a photo to track your skin's progress over time. This helps us provide more personalized recommendations.
              </p>
            </div>

            {/* Content */}
            <div className="p-8">

              {/* Analyzing Animation */}
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-sage-200"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                      className="absolute inset-2 rounded-full border-4 border-sage-400 border-t-transparent"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-sage-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-display font-semibold text-warm-900 mb-2">
                    Analyzing Photo Quality
                  </h3>
                  <p className="text-sm text-warm-600">
                    Checking brightness, sharpness, and composition...
                  </p>
                </motion.div>
              )}

              {/* Upload Success */}
              {uploadSuccess && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-success" />
                  </div>
                  <h3 className="text-2xl font-display font-semibold text-warm-900 mb-2">
                    Photo Uploaded Successfully
                  </h3>
                  <p className="text-warm-600 mb-6">
                    Redirecting to your dashboard...
                  </p>
                  <div className="flex gap-2 justify-center">
                    <div className="w-2 h-2 bg-sage-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-sage-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-sage-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </motion.div>
              )}

              {/* Photo Preview */}
              {!uploadSuccess && !isAnalyzing && capturedPhoto && (
                <div className="space-y-6">
                  <div className="relative rounded-2xl overflow-hidden bg-warm-100 aspect-[3/4] max-w-md mx-auto">
                    <img
                      src={capturedPhoto.dataUrl}
                      alt="Captured photo"
                      className="w-full h-full object-cover"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center text-white">
                          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                          <p className="text-lg font-medium mb-2">Uploading...</p>
                          <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden mx-auto">
                            <motion.div
                              className="h-full bg-white rounded-full"
                              initial={{ width: '0%' }}
                              animate={{ width: `${uploadProgress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <p className="text-sm text-white/80 mt-2">{uploadProgress}%</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Photo Info & Quality Analysis */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-warm-600">
                        {capturedPhoto.width} × {capturedPhoto.height} • {formatFileSize(capturedPhoto.size)}
                      </p>
                    </div>

                    {/* Quality Score */}
                    {capturedPhoto.quality && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-warm-700">Photo Quality</span>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "w-2 h-2 rounded-full transition-all",
                                    i < Math.ceil(capturedPhoto.quality!.overallScore / 20)
                                      ? capturedPhoto.quality!.overallScore >= 70
                                        ? "bg-success"
                                        : capturedPhoto.quality!.overallScore >= 50
                                        ? "bg-warning"
                                        : "bg-error"
                                      : "bg-warm-200"
                                  )}
                                />
                              ))}
                            </div>
                            <span className={cn(
                              "text-sm font-semibold",
                              capturedPhoto.quality.overallScore >= 70
                                ? "text-success"
                                : capturedPhoto.quality.overallScore >= 50
                                ? "text-warning"
                                : "text-error"
                            )}>
                              {capturedPhoto.quality.overallScore}
                            </span>
                          </div>
                        </div>

                        {/* Quality Metrics */}
                        <div className="grid grid-cols-3 gap-2">
                          {/* Brightness */}
                          <div className={cn(
                            "flex flex-col items-center gap-1 p-3 rounded-xl border",
                            capturedPhoto.quality.brightness === 'good'
                              ? "bg-success/5 border-success/30"
                              : "bg-warm-50 border-warm-200"
                          )}>
                            <Sun className={cn(
                              "w-4 h-4",
                              capturedPhoto.quality.brightness === 'good' ? "text-success" : "text-warm-500"
                            )} />
                            <span className="text-xs font-medium text-warm-700">
                              {capturedPhoto.quality.brightness === 'too_dark' ? 'Dark' :
                               capturedPhoto.quality.brightness === 'too_bright' ? 'Bright' : 'Good'}
                            </span>
                          </div>

                          {/* Sharpness */}
                          <div className={cn(
                            "flex flex-col items-center gap-1 p-3 rounded-xl border",
                            capturedPhoto.quality.sharpness === 'sharp' || capturedPhoto.quality.sharpness === 'acceptable'
                              ? "bg-success/5 border-success/30"
                              : "bg-warm-50 border-warm-200"
                          )}>
                            <Eye className={cn(
                              "w-4 h-4",
                              capturedPhoto.quality.sharpness === 'sharp' || capturedPhoto.quality.sharpness === 'acceptable'
                                ? "text-success" : "text-warm-500"
                            )} />
                            <span className="text-xs font-medium text-warm-700">
                              {capturedPhoto.quality.sharpness === 'blurry' ? 'Blurry' :
                               capturedPhoto.quality.sharpness === 'acceptable' ? 'Clear' : 'Sharp'}
                            </span>
                          </div>

                          {/* Composition */}
                          <div className={cn(
                            "flex flex-col items-center gap-1 p-3 rounded-xl border",
                            capturedPhoto.quality.aspectRatio === 'portrait'
                              ? "bg-success/5 border-success/30"
                              : "bg-warm-50 border-warm-200"
                          )}>
                            <Sparkles className={cn(
                              "w-4 h-4",
                              capturedPhoto.quality.aspectRatio === 'portrait' ? "text-success" : "text-warm-500"
                            )} />
                            <span className="text-xs font-medium text-warm-700 capitalize">
                              {capturedPhoto.quality.aspectRatio}
                            </span>
                          </div>
                        </div>

                        {/* Recommendations */}
                        {capturedPhoto.quality.recommendations.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-amber-50 border border-amber-200 rounded-xl p-3"
                          >
                            <div className="flex items-start gap-2">
                              <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs font-medium text-amber-900 mb-1">Photo Quality Tips</p>
                                <ul className="text-xs text-amber-700 space-y-0.5">
                                  {capturedPhoto.quality.recommendations.map((rec, idx) => (
                                    <li key={idx}>• {rec}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Face Validation Results */}
                    {capturedPhoto.faceValidation && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-warm-700">Face Detection</span>
                          <div className="flex items-center gap-2">
                            {capturedPhoto.faceValidation.valid ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-error" />
                            )}
                            <span className={cn(
                              "text-sm font-semibold",
                              capturedPhoto.faceValidation.valid ? "text-success" : "text-error"
                            )}>
                              {capturedPhoto.faceValidation.valid ? 'Valid' : 'Needs Improvement'}
                            </span>
                          </div>
                        </div>

                        {/* Face Metrics */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border text-xs",
                            capturedPhoto.faceValidation.metrics.faceDetected
                              ? "bg-success/5 border-success/30"
                              : "bg-error/5 border-error/30"
                          )}>
                            <User className={cn(
                              "w-3.5 h-3.5",
                              capturedPhoto.faceValidation.metrics.faceDetected ? "text-success" : "text-error"
                            )} />
                            <span className="text-warm-900 font-medium">
                              {capturedPhoto.faceValidation.metrics.faceCount === 1 ? 'Single Face' :
                               capturedPhoto.faceValidation.metrics.faceCount === 0 ? 'No Face' :
                               `${capturedPhoto.faceValidation.metrics.faceCount} Faces`}
                            </span>
                          </div>

                          <div className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border text-xs",
                            capturedPhoto.faceValidation.metrics.isCentered
                              ? "bg-success/5 border-success/30"
                              : "bg-warm-50 border-warm-200"
                          )}>
                            <Sparkles className={cn(
                              "w-3.5 h-3.5",
                              capturedPhoto.faceValidation.metrics.isCentered ? "text-success" : "text-warm-500"
                            )} />
                            <span className="text-warm-900 font-medium">
                              {capturedPhoto.faceValidation.metrics.isCentered ? 'Centered' : 'Off-Center'}
                            </span>
                          </div>
                        </div>

                        {/* Face Coverage */}
                        {capturedPhoto.faceValidation.metrics.faceDetected && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-warm-600">Face Coverage</span>
                              <span className="font-medium text-warm-900">
                                {capturedPhoto.faceValidation.metrics.faceCoverage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-warm-200 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  capturedPhoto.faceValidation.metrics.faceCoverage >= 15 &&
                                  capturedPhoto.faceValidation.metrics.faceCoverage <= 60
                                    ? "bg-success"
                                    : "bg-amber-500"
                                )}
                                style={{ width: `${Math.min(capturedPhoto.faceValidation.metrics.faceCoverage, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-warm-500">
                              {capturedPhoto.faceValidation.metrics.faceCoverage < 15 && 'Too far - move closer'}
                              {capturedPhoto.faceValidation.metrics.faceCoverage > 60 && 'Too close - move back slightly'}
                              {capturedPhoto.faceValidation.metrics.faceCoverage >= 15 &&
                               capturedPhoto.faceValidation.metrics.faceCoverage <= 60 && 'Perfect distance'}
                            </p>
                          </div>
                        )}

                        {/* Face Validation Issues */}
                        {capturedPhoto.faceValidation.issues.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-error/5 border border-error/30 rounded-xl p-3"
                          >
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs font-medium text-error-dark mb-1">Face Detection Issues</p>
                                <ul className="text-xs text-error space-y-0.5">
                                  {capturedPhoto.faceValidation.issues.map((issue, idx) => (
                                    <li key={idx}>• {issue}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Face Validation Recommendations */}
                        {capturedPhoto.faceValidation.recommendations.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-blue-50 border border-blue-200 rounded-xl p-3"
                          >
                            <div className="flex items-start gap-2">
                              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs font-medium text-blue-900 mb-1">Face Positioning Tips</p>
                                <ul className="text-xs text-blue-700 space-y-0.5">
                                  {capturedPhoto.faceValidation.recommendations.map((rec, idx) => (
                                    <li key={idx}>• {rec}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Comprehensive Consent */}
                  <div className="space-y-4">
                    {/* Storage Consent (Required) */}
                    <div className="bg-gradient-to-br from-sage-50 to-warm-50 rounded-xl p-4 border-2 border-sage-300">
                      <div className="flex items-start gap-3 mb-3">
                        <ShieldCheck className="w-5 h-5 text-sage-700 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-warm-900 mb-1">
                            Photo Storage Consent (Required)
                          </h4>
                          <p className="text-xs text-warm-600 leading-relaxed mb-3">
                            I consent to securely storing my facial photo to track my skin health progress. Photos are encrypted, HIPAA-compliant, and I can delete them anytime.
                          </p>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={storageConsent}
                              onChange={(e) => setStorageConsent(e.target.checked)}
                              className="w-4 h-4 rounded border-warm-300 text-sage-600 focus:ring-sage-500 focus:ring-offset-0"
                            />
                            <span className="text-xs font-medium text-warm-900">
                              I consent to photo storage
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Retention Period Selector */}
                      {storageConsent && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="pl-8 space-y-2"
                        >
                          <p className="text-xs font-medium text-warm-700">Data Retention Period:</p>
                          <select
                            value={retentionPeriod}
                            onChange={(e) => setRetentionPeriod(Number(e.target.value))}
                            className="w-full px-3 py-2 text-xs bg-white border border-warm-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                          >
                            <option value={90}>3 months</option>
                            <option value={180}>6 months</option>
                            <option value={365}>1 year (recommended)</option>
                            <option value={730}>2 years</option>
                            <option value={1825}>5 years (maximum)</option>
                          </select>
                          <p className="text-xs text-warm-500">
                            Photo will automatically delete after this period
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* ML Training Consent (Optional) */}
                    <div className="bg-warm-50 rounded-xl p-4 border border-warm-200">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mlConsent}
                          onChange={(e) => setMlConsent(e.target.checked)}
                          disabled={!storageConsent}
                          className="mt-0.5 w-4 h-4 rounded border-warm-300 text-sage-600 focus:ring-sage-500 focus:ring-offset-0 disabled:opacity-50"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-warm-900 mb-1">
                            Help Improve AI (Optional)
                          </p>
                          <p className="text-xs text-warm-600 leading-relaxed">
                            Allow anonymized photo use for training skin analysis models. Fully anonymized - cannot be traced back to you.
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Research Consent (Optional) */}
                    <div className="bg-warm-50 rounded-xl p-4 border border-warm-200">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={researchConsent}
                          onChange={(e) => setResearchConsent(e.target.checked)}
                          disabled={!storageConsent}
                          className="mt-0.5 w-4 h-4 rounded border-warm-300 text-sage-600 focus:ring-sage-500 focus:ring-offset-0 disabled:opacity-50"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-warm-900 mb-1">
                            Support Research (Optional)
                          </p>
                          <p className="text-xs text-warm-600 leading-relaxed">
                            Allow anonymized data use for dermatological research and publications. Helps advance skincare science.
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Privacy Policy Link */}
                    <div className="text-center">
                      <p className="text-xs text-warm-500">
                        By uploading, you agree to our{' '}
                        <button className="text-sage-600 hover:text-sage-700 underline font-medium">
                          Privacy Policy
                        </button>
                        {' '}and{' '}
                        <button className="text-sage-600 hover:text-sage-700 underline font-medium">
                          Terms of Service
                        </button>
                      </p>
                    </div>
                  </div>

                  {/* Error Message */}
                  {uploadError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-error/5 border border-error/30 rounded-xl p-4 flex items-start gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-error-dark mb-1">Upload Failed</p>
                        <p className="text-xs text-error">{uploadError}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleRetakePhoto}
                      disabled={isUploading}
                      className="flex-1 px-6 py-4 bg-warm-100 hover:bg-warm-200 text-warm-900 rounded-2xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Retake Photo
                    </button>
                    <button
                      onClick={handleUploadPhoto}
                      disabled={isUploading || !storageConsent}
                      className="flex-1 px-6 py-4 bg-sage-600 hover:bg-sage-700 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      title={!storageConsent ? 'Storage consent required' : ''}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Upload Photo
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Capture Photo */}
              {!uploadSuccess && !isAnalyzing && !capturedPhoto && (
                <div className="space-y-6">

                  {/* Professional Tips */}
                  <div className="bg-gradient-to-br from-sage-50 to-warm-50 rounded-2xl p-6 border border-sage-200">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-sage-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-display font-semibold text-warm-900 mb-1">
                          Perfect Photo Guide
                        </h3>
                        <p className="text-xs text-warm-600">
                          Follow these tips for the best results
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Sun className="w-3.5 h-3.5 text-sage-700" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-warm-900">Natural Lighting</p>
                          <p className="text-xs text-warm-600">Face a window or use soft, diffused light</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Eye className="w-3.5 h-3.5 text-sage-700" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-warm-900">Direct View</p>
                          <p className="text-xs text-warm-600">Face camera straight-on, fill the frame</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Camera className="w-3.5 h-3.5 text-sage-700" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-warm-900">Clean & Bare</p>
                          <p className="text-xs text-warm-600">No makeup, hair pulled back, neutral expression</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Capture Button */}
                  <button
                    onClick={handleCapturePhoto}
                    disabled={isCapturing}
                    className="w-full aspect-[3/4] max-w-md mx-auto bg-gradient-to-br from-sage-50 to-warm-50 border-2 border-dashed border-sage-300 rounded-2xl hover:border-sage-500 hover:from-sage-100 hover:to-warm-100 transition-all flex flex-col items-center justify-center gap-6 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="w-24 h-24 rounded-full bg-sage-100 group-hover:bg-sage-200 flex items-center justify-center transition-all group-hover:scale-110">
                      {isCapturing ? (
                        <Loader2 className="w-12 h-12 text-sage-700 animate-spin" />
                      ) : (
                        <Camera className="w-12 h-12 text-sage-700" />
                      )}
                    </div>
                    <div className="text-center px-8">
                      <p className="text-lg font-display font-semibold text-warm-900 mb-2">
                        {isCapturing ? 'Opening Camera...' : 'Capture Photo'}
                      </p>
                      <p className="text-sm text-warm-600">
                        Your photo will be analyzed for quality
                      </p>
                    </div>
                  </button>

                  {/* Error Message */}
                  {uploadError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-error/5 border border-error/30 rounded-xl p-4 flex items-start gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-error-dark mb-1">Camera Error</p>
                        <p className="text-xs text-error">{uploadError}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Skip Button */}
                  <div className="text-center">
                    <button
                      onClick={handleSkipPhoto}
                      className="text-sm text-warm-600 hover:text-warm-900 font-medium underline decoration-dotted underline-offset-4 transition-colors"
                    >
                      Skip for now
                    </button>
                    <p className="text-xs text-warm-500 mt-2">
                      You can always add photos later from your dashboard
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="max-w-5xl mx-auto">

        {/* Premium Header */}
        <div className="bg-white border-b border-warm-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-sage-700" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-warm-500 uppercase tracking-wider letter-spacing-wide">
                  Skin Profile Creation
                </h2>
                <p className="text-xs text-warm-400">Step {currentPhase + 1} of 4</p>
              </div>
            </div>
            {estimatedTimeRemaining > 0 && (
              <span className="text-xs text-warm-500 font-medium">~{estimatedTimeRemaining} min</span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2 mb-6">
            {PHASES.map((phase, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex-1 h-1 rounded-full transition-all duration-700 ease-out",
                  idx <= currentPhase ? "bg-sage-500" : "bg-warm-200"
                )}
              />
            ))}
          </div>

          {/* Phase Title */}
          <div>
            <h1 className="text-3xl font-display font-semibold text-warm-900 mb-2">
              {PHASES[currentPhase].name}
            </h1>
            <p className="text-base text-warm-600">{PHASES[currentPhase].description}</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="bg-white min-h-[65vh] flex flex-col p-8">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-8 mb-8 pr-2">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div className={cn("max-w-[85%]", msg.role === 'user' ? 'ml-auto' : 'mr-auto')}>

                    {/* AI Avatar */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center">
                          <Leaf className="w-4 h-4 text-sage-700" />
                        </div>
                        <span className="text-xs font-medium text-warm-500 uppercase tracking-wider">
                          Specialist
                        </span>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={cn(
                        "px-6 py-5",
                        msg.role === 'user'
                          ? "bg-sage-600 text-white rounded-[24px] rounded-br-md shadow-md"
                          : msg.isError
                          ? "bg-error/5 text-error-dark border border-error/30 rounded-[24px] rounded-tl-md"
                          : "bg-warm-50 text-warm-900 rounded-[24px] rounded-tl-md border border-warm-200"
                      )}
                    >
                      {msg.isError && (
                        <AlertCircle className="w-4 h-4 inline mr-2 text-error" />
                      )}
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>

                    {/* User Label */}
                    {msg.role === 'user' && (
                      <p className="text-xs text-warm-400 text-right mt-2 mr-1">You</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading State */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="max-w-[85%]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-sage-700" />
                    </div>
                    <span className="text-xs font-medium text-warm-500 uppercase tracking-wider">
                      Specialist
                    </span>
                  </div>
                  <div className="bg-warm-50 border border-warm-200 rounded-[24px] rounded-tl-md px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-sage-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-sage-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-sage-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span className="text-sm text-warm-600">Analyzing your response...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-warm-200 pt-6 space-y-4">
            {/* Quick Replies - Use AI suggestions if available, otherwise use phase defaults */}
            {!isLoading && (aiSuggestions || PHASES[currentPhase].quickReplies) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2"
              >
                {(aiSuggestions || PHASES[currentPhase].quickReplies)!.map((reply, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleQuickReply(reply)}
                    className="px-4 py-2.5 bg-white border-2 border-warm-200 hover:border-sage-500 hover:bg-sage-50 text-warm-800 text-sm rounded-full transition-all hover:shadow-md group"
                  >
                    <span className="group-hover:text-sage-700 transition-colors">{reply}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={PHASES[currentPhase].placeholder}
                disabled={isLoading}
                className="flex-1 px-5 py-4 bg-warm-50 text-warm-900 placeholder:text-warm-400 rounded-2xl border border-warm-300 focus:border-sage-500 focus:bg-white focus:ring-2 focus:ring-sage-200 focus:outline-none disabled:opacity-50 text-[15px] transition-all"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="h-[52px] w-[52px] rounded-full bg-sage-600 hover:bg-sage-700 disabled:bg-warm-300 disabled:cursor-not-allowed text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>

            {/* Helper Text */}
            <p className="text-xs text-warm-500 text-center">
              Choose a suggestion or type your own response
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-warm-200 p-6 text-center">
          <p className="text-xs text-warm-500">
            Powered by advanced AI with multi-expert dermatological framework
          </p>
          {environmentCollected && (
            <p className="text-xs text-sage-600 mt-1 flex items-center justify-center gap-1">
              <Check className="w-3 h-3" />
              Environment data collected
            </p>
          )}
        </div>

      </div>

      {/* Geolocation Modal */}
      {showCapture && <GeolocationCapture onCaptured={capture} onDismissed={dismiss} />}
    </div>
  );
}
