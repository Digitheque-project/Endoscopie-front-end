"use client";

import React, { useState } from "react";

interface UploadedImage {
  id: string;
  url: string;
  name: string;
}

export default function ImageUploader() {
  const [images, setImages] = useState<UploadedImage[]>([
    { id: "1", url: "/assets/placeholder-endo1.jpg", name: "capture_01.jpg" },
  ]);

  const removeImage = (id: string) => {
    setImages(images.filter(img => img.id !== id));
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <span className="material-symbols-outlined">image</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Images Endoscopiques</h2>
        </div>
        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{images.length} image(s)</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {images.map(img => (
          <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100 flex items-center justify-center">
            {/* Simulate image with gradient if no real image */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300"></div>
            <div className="relative z-10 text-slate-500 font-mono text-xs font-bold">{img.name}</div>
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button className="w-8 h-8 rounded-full bg-white text-slate-700 flex items-center justify-center hover:scale-110 transition-transform shadow-lg" title="Aperçu">
                <span className="material-symbols-outlined text-[16px]">visibility</span>
              </button>
              <button 
                onClick={() => removeImage(img.id)}
                className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 hover:bg-red-600 transition-all shadow-lg" 
                title="Supprimer"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          </div>
        ))}
        
        <label className="cursor-pointer flex flex-col items-center justify-center gap-2 aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 transition-colors group">
          <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-emerald-500 transition-colors">add_photo_alternate</span>
          <span className="text-xs font-semibold text-slate-500 group-hover:text-emerald-600">Ajouter</span>
          <input type="file" className="hidden" multiple accept="image/*" />
        </label>
      </div>
      
      <p className="text-xs text-slate-500 text-center font-medium">Glissez-déposez vos captures ou cliquez pour importer.</p>
    </section>
  );
}
