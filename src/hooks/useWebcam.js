import { useState, useRef, useCallback, useEffect } from "react";

export const useWebcam = () => {
  const [stream,        setStream]        = useState(null);
  const [enabled,       setEnabled]       = useState(false);
  const [error,         setError]         = useState("");
  const [eyeContact,    setEyeContact]    = useState(false);
  const [faceDetected,  setFaceDetected]  = useState(false);
  const [multiPerson,   setMultiPerson]   = useState(false);   // NEW: >1 person detected
  const [faceConfidence, setFaceConfidence] = useState(0);     // NEW: 0-100 live confidence

  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const rafRef      = useRef(null);
  const streamRef   = useRef(null);
  const prevData    = useRef(null);
  const frameCount  = useRef(0);

  // Rolling history for stable confidence score
  const eyeHistory  = useRef([]);   // last 30 frames: 1=eye contact, 0=not
  const faceHistory = useRef([]);   // last 30 frames: 1=detected, 0=not

  useEffect(() => { streamRef.current = stream; }, [stream]);

  useEffect(() => {
    canvasRef.current = document.createElement("canvas");
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream) { video.srcObject = stream; video.play().catch(() => {}); }
    else { video.srcObject = null; }
  }, [stream]);

  useEffect(() => {
    if (!stream) {
      cancelAnimationFrame(rafRef.current);
      setFaceDetected(false);
      setEyeContact(false);
      setMultiPerson(false);
      setFaceConfidence(0);
      prevData.current = null;
      eyeHistory.current = [];
      faceHistory.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    frameCount.current = 0;

    const analyze = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0) {
        rafRef.current = requestAnimationFrame(analyze);
        return;
      }

      const W = 320, H = 240;
      canvas.width = W; canvas.height = H;

      try { ctx.drawImage(video, 0, 0, W, H); }
      catch { rafRef.current = requestAnimationFrame(analyze); return; }

      let imgData;
      try { imgData = ctx.getImageData(0, 0, W, H); }
      catch { rafRef.current = requestAnimationFrame(analyze); return; }

      const pixels = imgData.data;
      const len    = pixels.length;
      const count  = len / 4;

      // ── Brightness & variance ──
      let sum = 0, sumSq = 0;
      for (let i = 0; i < len; i += 4) {
        const lum = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
        sum += lum; sumSq += lum * lum;
      }
      const mean     = sum / count;
      const variance = (sumSq / count) - (mean * mean);

      // ── Skin-tone detection ──
      let skinCount = 0;
      for (let i = 0; i < len; i += 4) {
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        if (r > 60 && g > 30 && b > 15 && r > g && r > b &&
            (r - Math.min(g, b)) > 10 && Math.abs(r - g) > 5) skinCount++;
      }
      const skinRatio = skinCount / count;

      // ── Multi-person detection ──
      // Divide frame into left and right halves — if both halves have significant
      // independent skin clusters, likely 2+ people
      const halfW = Math.floor(W / 2);
      let leftSkin = 0, rightSkin = 0, halfCount = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
          const isSkin = r > 60 && g > 30 && b > 15 && r > g && r > b &&
                         (r - Math.min(g, b)) > 10 && Math.abs(r - g) > 5;
          if (x < halfW) { if (isSkin) leftSkin++; halfCount++; }
          else { if (isSkin) rightSkin++; }
        }
      }
      const leftRatio  = leftSkin / halfCount;
      const rightRatio = rightSkin / halfCount;
      // Both halves have significant skin = likely 2 people side by side
      const isMulti = leftRatio > 0.06 && rightRatio > 0.06 &&
                      Math.min(leftRatio, rightRatio) / Math.max(leftRatio, rightRatio) > 0.35;
      setMultiPerson(isMulti);

      // ── Motion ──
      let motion = 0;
      if (prevData.current && prevData.current.length === len) {
        for (let i = 0; i < len; i += 4) motion += Math.abs(pixels[i] - prevData.current[i]);
        motion /= count;
      }
      prevData.current = new Uint8ClampedArray(pixels);

      // ── Face detected ──
      const goodBrightness = mean > 20 && mean < 240;
      const goodVariance   = variance > 200;
      const hasSkin        = skinRatio > 0.04;
      const detected       = goodBrightness && (goodVariance || hasSkin);
      setFaceDetected(detected);

      // Update rolling face history (30 frames)
      faceHistory.current.push(detected ? 1 : 0);
      if (faceHistory.current.length > 30) faceHistory.current.shift();

      frameCount.current++;

      // ── Eye contact (every 10 frames) ──
      let eyeOn = false;
      if (frameCount.current % 10 === 0) {
        const cx = Math.floor(W * 0.25), cy = Math.floor(H * 0.2);
        const cw = Math.floor(W * 0.5),  ch = Math.floor(H * 0.4);
        let centerSkin = 0, centerCount = 0;
        try {
          const cd = ctx.getImageData(cx, cy, cw, ch).data;
          for (let i = 0; i < cd.length; i += 4) {
            const r = cd[i], g = cd[i + 1], b = cd[i + 2];
            if (r > 60 && g > 30 && b > 15 && r > g && r > b) centerSkin++;
            centerCount++;
          }
        } catch {}
        const centerSkinRatio = centerCount > 0 ? centerSkin / centerCount : 0;
        eyeOn = detected && centerSkinRatio > 0.05;
        setEyeContact(eyeOn);

        // Update rolling eye history
        eyeHistory.current.push(eyeOn ? 1 : 0);
        if (eyeHistory.current.length > 30) eyeHistory.current.shift();

        // ── Compute faceConfidence (0-100) ──
        // Weighted: face presence 40% + eye contact 40% + motion (alive) 20%
        const faceStability = faceHistory.current.length > 0
          ? faceHistory.current.reduce((a, b) => a + b, 0) / faceHistory.current.length
          : 0;
        const eyeStability = eyeHistory.current.length > 0
          ? eyeHistory.current.reduce((a, b) => a + b, 0) / eyeHistory.current.length
          : 0;
        const motionScore = Math.min(1, motion / 8); // normalize motion 0-1
        const raw = (faceStability * 40) + (eyeStability * 40) + (motionScore * 20);
        setFaceConfidence(Math.round(Math.min(100, Math.max(0, raw))));
      }

      rafRef.current = requestAnimationFrame(analyze);
    };

    const t = setTimeout(() => { rafRef.current = requestAnimationFrame(analyze); }, 500);
    return () => { clearTimeout(t); cancelAnimationFrame(rafRef.current); };
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      if (stream) stream.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(rafRef.current);
      prevData.current = null;
      eyeHistory.current = [];
      faceHistory.current = [];

      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user", frameRate: { ideal: 30 } },
        audio: false,
      });
      setStream(s); setEnabled(true); setError("");
    } catch {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false,
        });
        setStream(s); setEnabled(true); setError("");
      } catch (e2) {
        setError(
          e2.name === "NotAllowedError"  ? "Camera permission denied. Allow camera in browser settings." :
          e2.name === "NotFoundError"    ? "No camera found on this device." :
          e2.name === "NotReadableError" ? "Camera is in use by another app." :
          `Camera error: ${e2.message}`
        );
        setEnabled(false);
      }
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null);
    streamRef.current = null;
    setEnabled(false);
    setFaceDetected(false);
    setEyeContact(false);
    setMultiPerson(false);
    setFaceConfidence(0);
    prevData.current = null;
    eyeHistory.current = [];
    faceHistory.current = [];
  }, [stream]);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  }, []); // eslint-disable-line

  return { videoRef, stream, enabled, error, eyeContact, faceDetected, multiPerson, faceConfidence, startCamera, stopCamera };
};
