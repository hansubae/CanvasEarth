import { useState } from 'react';

interface ToolbarProps {
  onAddText: () => void;
  onAddYouTube: () => void;
  onAddImage: (file: File) => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
}

export const Toolbar = ({
  onAddText,
  onAddYouTube,
  onAddImage,
  onDeleteSelected,
  hasSelection,
}: ToolbarProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onAddImage(file);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg z-50">
      <div className="flex flex-col gap-2 p-3">
        {/* Toolbar Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">Canvas Tools</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 text-xs"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>

        {isExpanded && (
          <>
            {/* Add Object Buttons */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs text-gray-500 uppercase tracking-wide">
                Add Object
              </h4>

              {/* Text Button */}
              <button
                onClick={onAddText}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Add Text
              </button>

              {/* YouTube Button */}
              <button
                onClick={onAddYouTube}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                Add YouTube
              </button>

              {/* Image Upload (native input) */}
              <label className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors cursor-pointer text-sm">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            {/* Delete Button */}
            {hasSelection && (
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                <h4 className="text-xs text-gray-500 uppercase tracking-wide">
                  Selection
                </h4>
                <button
                  onClick={onDeleteSelected}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete (Del)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Instruction */}
      {isExpanded && (
        <div className="px-3 pb-3 text-xs text-gray-500 border-t border-gray-200 pt-2">
          💡 Tip: Drag & drop images directly onto the canvas
        </div>
      )}
    </div>
  );
};
