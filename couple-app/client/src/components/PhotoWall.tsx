import { useState, useEffect, useRef } from 'react';
import { Camera, Heart, Trash2, Plus, ChevronLeft, ChevronRight, Play, Pause, X } from 'lucide-react';
import type { PhotoItem, ProfileData, UserRole } from '../types';

interface PhotoWallProps {
  photos: PhotoItem[];
  profile: ProfileData;
  role: UserRole;
  onAddPhoto: (title: string, imageData: string, author: string) => void;
  onLikePhoto: (id: number) => void;
  onDeletePhoto: (id: number) => void;
}

export default function PhotoWall({
  photos,
  profile,
  role,
  onAddPhoto,
  onLikePhoto,
  onDeletePhoto
}: PhotoWallProps) {
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [selectedFullscreenPhoto, setSelectedFullscreenPhoto] = useState<PhotoItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentAuthorName = role === 'Partner A' ? (profile.partner_a_name || 'Partner A') : (profile.partner_b_name || 'Partner B');

  // Automatic Slideshow Timer ("die dann durchlaufen")
  useEffect(() => {
    if (!isAutoPlaying || photos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlideIdx(prev => (prev + 1) % photos.length);
    }, 4500); // changes every 4.5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, photos.length]);

  // Make sure currentSlideIdx stays in bounds
  const activeSlide = photos.length > 0 ? photos[currentSlideIdx % photos.length] : null;

  // Handle client-side image compression
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Resize onto canvas to optimize file size (max 800px for crisp mobile display & fast uploads)
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG 72% quality (produces crisp ~60-90 KB images that never fail)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.72);
          setPreviewImage(compressedDataUrl);
          setShowUploadModal(true);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewImage || isUploading) return;
    setIsUploading(true);
    try {
      await onAddPhoto(photoCaption.trim() || 'Schöner Moment 💕', previewImage, currentAuthorName);
      setPreviewImage(null);
      setPhotoCaption('');
      setShowUploadModal(false);
    } finally {
      setIsUploading(false);
    }
  };

  const nextSlide = () => setCurrentSlideIdx(prev => (prev + 1) % photos.length);
  const prevSlide = () => setCurrentSlideIdx(prev => (prev - 1 + photos.length) % photos.length);

  return (
    <div className="space-y-3 pb-3 animate-in w-full max-w-full overflow-hidden">
      {/* Hidden File Input for Mobile Camera / Gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-800">Unsere Fotowand 📸</h2>
          <p className="text-xs text-gray-400 font-medium">Gemeinsame Momente & Schnappschüsse</p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-gradient-to-r from-pink-500 to-rose-400 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-xs hover:shadow-md active:scale-95 transition-all flex items-center gap-1.5"
        >
          <Camera size={14} /> Foto hochladen
        </button>
      </div>

      {/* HERO SLIDESHOW PLAYER ("durchlaufen") */}
      {photos.length > 0 ? (
        <div className="relative rounded-3xl p-3 bg-white/95 shadow-md border-2 border-pink-100 flex flex-col items-center">
          {/* Polaroid Photo Frame */}
          <div
            onClick={() => activeSlide && setSelectedFullscreenPhoto(activeSlide)}
            className="w-full relative aspect-4/3 rounded-2xl overflow-hidden bg-gray-100 cursor-pointer shadow-inner group"
          >
            {activeSlide && (
              <img
                src={activeSlide.image_data}
                alt={activeSlide.title || 'Foto'}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            )}

            {/* Floating Top Controls */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAutoPlaying(!isAutoPlaying);
                }}
                className="bg-black/40 backdrop-blur-xs text-white p-1.5 rounded-full hover:bg-black/60 transition-colors"
                title={isAutoPlaying ? 'Diashow pausieren' : 'Diashow starten'}
              >
                {isAutoPlaying ? <Pause size={12} /> : <Play size={12} fill="white" />}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeSlide) onLikePhoto(activeSlide.id);
                }}
                className="bg-white/90 backdrop-blur-xs text-pink-600 px-2 py-1 rounded-full text-[10px] font-black shadow-xs flex items-center gap-1 active:scale-90 transition-transform"
              >
                <Heart size={11} fill="currentColor" />
                <span>{activeSlide?.likes || 0}</span>
              </button>
            </div>

            {/* Slide Navigation Arrows */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevSlide();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextSlide();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            {/* Slideshow Progress Dots */}
            {photos.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-xs">
                {photos.slice(0, 10).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      (currentSlideIdx % photos.length) === idx
                        ? 'w-4 bg-white'
                        : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Polaroid Caption Footer */}
          {activeSlide && (
            <div className="w-full pt-2.5 px-1 flex items-center justify-between text-left">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="font-black text-xs text-gray-800 truncate">
                  {activeSlide.title || 'Unser Schnappschuss 💕'}
                </h3>
                <span className="text-[10px] text-gray-400 font-bold block truncate">
                  Von {activeSlide.author} • {activeSlide.created_at}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onDeletePhoto(activeSlide.id)}
                className="text-gray-300 hover:text-rose-500 p-1.5 rounded-lg shrink-0"
                title="Foto löschen"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer glass-panel p-8 rounded-3xl text-center text-gray-400 border-2 border-dashed border-pink-200 hover:border-pink-400 transition-all"
        >
          <Camera size={36} className="mx-auto mb-2 text-pink-300 animate-pulse" />
          <p className="text-xs font-black text-gray-700">Noch keine Fotos hochgeladen</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Tippe hier, um euer erstes gemeinsames Foto hochzuladen!</p>
        </div>
      )}

      {/* Grid of All Photos */}
      {photos.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-black text-gray-700 px-1">
            <span>Alle Fotos ({photos.length})</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-pink-600 font-bold text-[11px] hover:underline flex items-center gap-0.5"
            >
              <Plus size={12} /> Weiteres Foto
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                onClick={() => {
                  setCurrentSlideIdx(idx);
                  setSelectedFullscreenPhoto(photo);
                }}
                className="cursor-pointer aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-xs border border-pink-100 relative group"
              >
                <img
                  src={photo.image_data}
                  alt={photo.title || 'Foto'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                  <span className="text-[9px] text-white font-bold truncate">{photo.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Preview Modal */}
      {showUploadModal && previewImage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4.5 shadow-2xl space-y-3">
            <h3 className="text-base font-black text-gray-800">Foto hochladen 📸</h3>

            {/* Preview image */}
            <div className="w-full aspect-4/3 rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
              <img src={previewImage} alt="Vorschau" className="w-full h-full object-cover" />
            </div>

            <form onSubmit={handleConfirmUpload} className="space-y-2.5">
              <div>
                <label className="text-xs font-bold text-gray-500">Titel / Beschriftung</label>
                <input
                  type="text"
                  placeholder="z.B. Urlaub am Meer 🌊"
                  value={photoCaption}
                  onChange={e => setPhotoCaption(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-pink-500"
                  maxLength={50}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-2 rounded-xl font-bold text-gray-500 bg-gray-100 text-xs"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 py-2 rounded-xl font-black text-white bg-gradient-to-r from-pink-500 to-rose-400 text-xs shadow-md disabled:opacity-75 flex items-center justify-center gap-1.5"
                >
                  {isUploading ? 'Wird gespeichert...' : 'Veröffentlichen 💕'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox Modal */}
      {selectedFullscreenPhoto && (
        <div
          onClick={() => setSelectedFullscreenPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in"
        >
          <button
            type="button"
            onClick={() => setSelectedFullscreenPhoto(null)}
            className="absolute top-4 right-4 bg-white/20 text-white p-2 rounded-full hover:bg-white/40"
          >
            <X size={20} />
          </button>

          <div
            onClick={e => e.stopPropagation()}
            className="bg-white p-3 rounded-3xl max-w-sm w-full shadow-2xl space-y-2 text-center"
          >
            <div className="w-full aspect-4/3 rounded-2xl overflow-hidden bg-black">
              <img
                src={selectedFullscreenPhoto.image_data}
                alt={selectedFullscreenPhoto.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="text-left min-w-0 flex-1">
                <h4 className="font-black text-xs text-gray-800 truncate">
                  {selectedFullscreenPhoto.title || 'Unser Schnappschuss'}
                </h4>
                <span className="text-[10px] text-gray-400 font-bold block">
                  Von {selectedFullscreenPhoto.author} • {selectedFullscreenPhoto.created_at}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onLikePhoto(selectedFullscreenPhoto.id)}
                className="bg-pink-50 text-pink-600 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shrink-0"
              >
                <Heart size={13} fill="currentColor" /> {selectedFullscreenPhoto.likes}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
