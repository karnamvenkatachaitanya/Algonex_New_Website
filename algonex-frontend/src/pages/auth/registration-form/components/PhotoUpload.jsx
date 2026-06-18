import { useState, useRef, useCallback } from 'react';

const PhotoUpload = ({ photo, photoPreview, onPhotoChange, onRemovePhoto, error }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onPhotoChange(files[0]);
      }
    },
    [onPhotoChange]
  );

  const handleFileInput = useCallback(
    (e) => {
      if (e.target.files.length > 0) {
        onPhotoChange(e.target.files[0]);
      }
    },
    [onPhotoChange]
  );

  const handleRemove = useCallback(
    (e) => {
      e.stopPropagation();
      e.preventDefault();
      onRemovePhoto();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onRemovePhoto]
  );

  return (
    <div className="photo-upload-container">
      <label className="field-label required">Passport Size Photo</label>
      <div
        id="photoDropzone"
        className={`photo-dropzone${isDragOver ? ' dragover' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={photo ? { padding: '15px' } : undefined}
      >
        <input
          type="file"
          ref={fileInputRef}
          id="photoInput"
          name="photo"
          accept="image/*"
          className="file-input-hidden"
          onChange={handleFileInput}
        />

        {!photo ? (
          <div className="dropzone-prompt">
            <i className="fa-solid fa-cloud-arrow-up dropzone-icon"></i>
            <p className="prompt-text">
              Drag & drop your passport photo here, or <span>browse</span>
            </p>
            <p className="file-specs">JPG, PNG, or WEBP (Max 5MB)</p>
          </div>
        ) : (
          <div className="photo-preview-container">
            <img
              className="photo-preview-img"
              src={photoPreview}
              alt="Passport preview"
            />
            <button
              type="button"
              className="remove-photo-btn"
              onClick={handleRemove}
            >
              <i className="fa-solid fa-circle-xmark"></i> Remove
            </button>
          </div>
        )}
      </div>
      {error && (
        <span className="error-msg visible" id="photoError">
          {error}
        </span>
      )}
    </div>
  );
};

export default PhotoUpload;
