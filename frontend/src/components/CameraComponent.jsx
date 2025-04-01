import React, { useEffect, useRef, useState } from 'react';
import mascot from "../assets/mascot.webp";

const CameraComponent = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const photoRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      } catch (error) {
        console.error("Error accessing camera:", error);
        onClose();
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraReady(false);
    };
  }, [onClose]);

  const capturePhoto = () => {
    if (videoRef.current && photoRef.current) {
      const video = videoRef.current;
      const canvas = photoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas
        .getContext("2d")
        .drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoData = canvas.toDataURL("image/jpeg");
      onCapture(photoData);
    }
  };

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="relative bg-transparent p-6 rounded-2xl shadow-lg w-full h-full m-4">
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            className="w-full h-full object-cover rounded-lg bg-gray-100"
            autoPlay
            playsInline
            muted
          />
          <canvas ref={photoRef} className="hidden" />
          {!isCameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-gray-500">Loading camera...</div>
            </div>
          )}
        </div>
        <div className="absolute flex flex-row bottom-8 justify-end gap-4 w-full px-8 left-0">
          <button
            onClick={handleClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-6 rounded-full text-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={capturePhoto}
            disabled={!isCameraReady}
            className={`bg-yellow-500 shadow-lg animate-pulse ring-4 ring-yellow-300 p-4 rounded-full text-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              !isCameraReady ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>

        <div className="absolute left-4 bottom-4 flex items-center w-[10vw] mt-30">
            <img
              src={mascot}
              alt="Study Buddy Mascot"
              className="w-[30vw] object-contain"
            />
          </div>
      </div>
    </div>
  );
};

export default CameraComponent;
