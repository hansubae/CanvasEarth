import { useState } from 'react';

// File validation constants (matching backend validation)
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Magic numbers (file signatures) for validation
const MAGIC_NUMBERS: Record<string, string> = {
  ffd8ff: 'image/jpeg',    // JPEG
  '89504e47': 'image/png', // PNG
  '47494638': 'image/gif', // GIF
  '52494646': 'image/webp', // WEBP (RIFF header)
};

interface ToolbarProps {
  onAddText: () => void;
  onAddYouTube: () => void;
  onAddImage: (file: File) => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
  showGrid: boolean;
  onToggleGrid: () => void;
}

/**
 * Get file extension from filename
 */
const getFileExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    throw new Error('File must have a valid extension');
  }
  return filename.substring(lastDotIndex).toLowerCase();
};

/**
 * Validate file signature (magic number)
 * Reads first 4 bytes of file and checks against known signatures
 */
const validateFileSignature = async (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);

        if (bytes.length < 4) {
          reject(new Error('File is too small or corrupted'));
          return;
        }

        // Convert first 4 bytes to hex string
        const hexString = Array.from(bytes.slice(0, 4))
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join('');

        // Check if hex matches any known magic number
        const isValid = Object.keys(MAGIC_NUMBERS).some((magic) =>
          hexString.startsWith(magic)
        );

        resolve(isValid);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    // Read first 4 bytes
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
};

/**
 * Comprehensive file validation (multi-layer security)
 */
const validateImageFile = async (file: File): Promise<void> => {
  // 1. Validate filename exists
  if (!file.name) {
    throw new Error('Filename is required');
  }

  // 2. Validate file extension
  const extension = getFileExtension(file.name);
  if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    throw new Error(
      `Invalid file extension: ${extension}\nAllowed: ${Array.from(ALLOWED_IMAGE_EXTENSIONS).join(', ')}`
    );
  }

  // 3. Validate MIME type (whitelist only)
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error(
      `Invalid file type: ${file.type}\nAllowed: ${Array.from(ALLOWED_IMAGE_MIME_TYPES).join(', ')}`
    );
  }

  // 4. Validate file size
  if (file.size > MAX_IMAGE_SIZE) {
    const maxSizeMB = (MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `File size exceeds limit\nFile size: ${fileSizeMB}MB\nMax allowed: ${maxSizeMB}MB`
    );
  }

  // 5. Validate file signature (magic number)
  const isValidSignature = await validateFileSignature(file);
  if (!isValidSignature) {
    throw new Error(
      'File signature does not match declared type.\nFile may be corrupted or have incorrect extension.'
    );
  }
};

export const Toolbar = ({
  onAddText,
  onAddYouTube,
  onAddImage,
  onDeleteSelected,
  hasSelection,
  showGrid,
  onToggleGrid,
}: ToolbarProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    // Reset input immediately
    e.target.value = '';

    if (!file) return;

    try {
      // Multi-layer validation
      await validateImageFile(file);

      // All validations passed - upload file
      onAddImage(file);
    } catch (error) {
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`File validation failed:\n\n${errorMessage}`);
      console.error('File validation error:', error);
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
            aria-label={isExpanded ? 'Collapse toolbar' : 'Expand toolbar'}
            aria-expanded={isExpanded}
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
                aria-label="Add text object to canvas"
                title="Add Text"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span>Add Text</span>
              </button>

              {/* YouTube Button */}
              <button
                onClick={onAddYouTube}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                aria-label="Add YouTube video to canvas"
                title="Add YouTube"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span>Add YouTube</span>
              </button>

              {/* Image Upload (native input) */}
              <label
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors cursor-pointer text-sm"
                title="Upload Image"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  aria-label="Upload image file to canvas"
                />
              </label>
            </div>

            {/* View Options */}
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
              <h4 className="text-xs text-gray-500 uppercase tracking-wide">
                View
              </h4>
              <button
                onClick={onToggleGrid}
                className={`flex items-center gap-2 px-4 py-2 rounded transition-colors text-sm ${
                  showGrid
                    ? 'bg-purple-500 text-white hover:bg-purple-600'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
                aria-label={showGrid ? 'Hide grid background' : 'Show grid background'}
                aria-pressed={showGrid}
                title={showGrid ? 'Hide Grid' : 'Show Grid'}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                  />
                </svg>
                <span>{showGrid ? 'Hide Grid' : 'Show Grid'}</span>
              </button>
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
                  aria-label="Delete selected object (Delete or Backspace key)"
                  title="Delete (Del)"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Delete (Del)</span>
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
