import React from 'react';
import { FaTimes, FaCamera } from 'react-icons/fa';
import CameraView from './CameraView';

function CameraModal({
  videoRef,
  image,
  capturedTime,
  location,
  onCancel,
  onCapture,
  onRetake,
  onSubmit,
  onFileUpload,
  type,
  isSubmitting
}) {
  return (
    <div className="camera-overlay">
      <div className="camera-modal">
        <div className="camera-header">
          <h3>{type === 'check-in' ? 'Check In Photo' : 'Check Out Photo'}</h3>
          <button className="close-btn" onClick={onCancel}>
            <FaTimes />
          </button>
        </div>

        <div className="camera-body">
          <div className="camera-preview">
            {!image ? (
              <CameraView ref={videoRef} />
            ) : (
              <img src={image} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>

          {image && capturedTime && (
            <div className="capture-info">
              <p><strong>Captured at:</strong> {capturedTime.toLocaleTimeString()} on {capturedTime.toLocaleDateString()}</p>
              {location && <p><strong>Location:</strong> {location}</p>}
            </div>
          )}

          <div className="camera-actions">
            {!image ? (
              <>
                <button className="cam-btn cancel" onClick={onCancel}>Cancel</button>
                <button className="cam-btn capture" onClick={onCapture}>
                  <FaCamera /> Capture
                </button>
              </>
            ) : (
              <>
                <button className="cam-btn retake" onClick={onRetake}>Retake</button>
                <button
                  className="cam-btn submit"
                  onClick={onSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : `Submit ${type === 'check-in' ? 'Check In' : 'Check Out'}`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraModal;
