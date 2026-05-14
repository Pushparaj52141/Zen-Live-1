import React, { forwardRef, useEffect } from 'react';

const CameraView = forwardRef((props, ref) => {
  useEffect(() => {
    if (ref?.current) {
      ref.current.play().catch(() => {});
    }
  }, [ref]);

  return (
    <div className="camera-view">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted
        className="camera-video"
        style={{
          backgroundColor: 'black',
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
    </div>
  );
});

CameraView.displayName = 'CameraView';

export default CameraView;
