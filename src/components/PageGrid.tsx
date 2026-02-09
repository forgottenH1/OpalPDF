import React, { useState } from 'react';
import { Trash2, GripVertical, CheckCircle2 } from 'lucide-react';

interface PageGridProps {
    files: File[];
    thumbnails: string[];
    onSave: (newOrder: number[]) => void;
}

// Simple Drag & Drop Grid
const PageGrid: React.FC<PageGridProps> = ({ thumbnails, onSave }) => {
    // Current order of pages (by original index)
    // If original PDF had 3 pages, initial state is [0, 1, 2]
    // If we delete page 2 (index 1), state becomes [0, 2]
    // If we swap, state becomes [2, 0] etc.
    const [pageOrder, setPageOrder] = useState<number[]>(thumbnails.map((_, i) => i));
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDelete = (indexToDelete: number) => {
        const newOrder = pageOrder.filter((_, idx) => idx !== indexToDelete); // Remove by position in array
        setPageOrder(newOrder);
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Ghost image usually handled by browser
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault(); // Necessary to allow dropping
        if (draggedIndex === null || draggedIndex === index) return;

        // Perform swap visually immediately
        const newOrder = [...pageOrder];
        const draggedItem = newOrder[draggedIndex];
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(index, 0, draggedItem);

        setPageOrder(newOrder);
        setDraggedIndex(index); // Update dragged index to new position
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    // const originalCount = thumbnails.length; // Unused
    const currentCount = pageOrder.length;

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white">Organize Pages</h3>
                    <p className="text-slate-400 text-sm">Drag to reorder. Click bin to delete.</p>
                </div>
                <button
                    onClick={() => onSave(pageOrder)}
                    className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center gap-2"
                >
                    <CheckCircle2 size={18} />
                    Save ({currentCount} Pages)
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {pageOrder.map((originalIndex, currentIndex) => (
                    <div
                        key={`${originalIndex}-${currentIndex}`} // Key uses combinator to be unique but stable enough
                        draggable
                        onDragStart={(e) => handleDragStart(e, currentIndex)}
                        onDragOver={(e) => handleDragOver(e, currentIndex)}
                        onDragEnd={handleDragEnd}
                        className={`relative group bg-white border-2 ${draggedIndex === currentIndex ? 'border-blue-500 opacity-50 scale-95' : 'border-slate-800 hover:border-slate-600'} rounded-lg overflow-hidden transition-all duration-200 cursor-move shadow-lg`}
                    >
                        {/* Page Number Badge */}
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-md z-10 font-mono">
                            {currentIndex + 1}
                        </div>

                        {/* Thumbnail */}
                        <img
                            src={thumbnails[originalIndex]}
                            alt={`Page ${originalIndex + 1}`}
                            className="w-full h-auto aspect-[1/1.41] object-contain bg-slate-100" // A4 Ratio
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <GripVertical className="text-white/50" />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent drag start if clicked
                                    handleDelete(currentIndex);
                                }}
                                className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-all hover:scale-110"
                                title="Delete Page"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {pageOrder.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-slate-700 rounded-2xl">
                    <p className="text-slate-500">All pages deleted.</p>
                </div>
            )}
        </div>
    );
};

export default PageGrid;
