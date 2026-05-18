import { useState, useRef, useCallback, useEffect } from "react";

const isSkinPixel = (r, g, b) => (
  r > 60 &&
  g > 30 &&
  b > 15 &&
  r > g &&
  r > b &&
  (r - Math.min(g, b)) > 10 &&
  Math.abs(r - g) > 5
);

const findFaceLikeRegions = (pixels, width, height) => {
  const focusHeight = Math.floor(height * 0.72);
  const minX = Math.floor(width * 0.08);
  const maxX = Math.ceil(width * 0.92);
  const mask = new Uint8Array(width * focusHeight);

  for (let y = 0; y < focusHeight; y++) {
    for (let x = minX; x < maxX; x++) {
      const i = (y * width + x) * 4;
      if (isSkinPixel(pixels[i], pixels[i + 1], pixels[i + 2])) {
        mask[(y * width) + x] = 1;
      }
    }
  }

  const visited = new Uint8Array(width * focusHeight);
  const stackX = [];
  const stackY = [];
  const components = [];

  for (let y = 0; y < focusHeight; y++) {
    for (let x = minX; x < maxX; x++) {
      const startIndex = (y * width) + x;
      if (!mask[startIndex] || visited[startIndex]) continue;

      let area = 0;
      let minCx = x;
      let maxCx = x;
      let minCy = y;
      let maxCy = y;
      let sumX = 0;
      let sumY = 0;

      stackX.push(x);
      stackY.push(y);
      visited[startIndex] = 1;

      while (stackX.length) {
        const cx = stackX.pop();
        const cy = stackY.pop();

        area++;
        sumX += cx;
        sumY += cy;
        if (cx < minCx) minCx = cx;
        if (cx > maxCx) maxCx = cx;
        if (cy < minCy) minCy = cy;
        if (cy > maxCy) maxCy = cy;

        for (let ny = Math.max(0, cy - 1); ny <= Math.min(focusHeight - 1, cy + 1); ny++) {
          for (let nx = Math.max(minX, cx - 1); nx <= Math.min(maxX - 1, cx + 1); nx++) {
            const nextIndex = (ny * width) + nx;
            if (!visited[nextIndex] && mask[nextIndex]) {
              visited[nextIndex] = 1;
              stackX.push(nx);
              stackY.push(ny);
            }
          }
        }
      }

      const boxWidth = maxCx - minCx + 1;
      const boxHeight = maxCy - minCy + 1;
      const fillRatio = area / (boxWidth * boxHeight);
      const aspectRatio = boxWidth / boxHeight;
      const centerX = sumX / area;
      const centerY = sumY / area;

      const looksFaceLike =
        area >= 170 &&
        boxWidth >= 18 &&
        boxHeight >= 22 &&
        boxWidth <= width * 0.62 &&
        boxHeight <= focusHeight * 0.85 &&
        aspectRatio >= 0.38 &&
        aspectRatio <= 1.75 &&
        fillRatio >= 0.16 &&
        centerY <= focusHeight * 0.78;

      if (looksFaceLike) {
        components.push({ area, centerX, centerY, boxWidth, boxHeight });
      }
    }
  }

  return components.sort((a, b) => b.area - a.area);
};

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
  const eyeHistory   = useRef([]);   // last 30 frames: 1=eye contact, 0=not
  const faceHistory  = useRef([]);   // last 30 frames: 1=detected, 0=not
  const multiHistory = useRef([]);   // last 20 frames: 1=multi detected, 0=not

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
      multiHistory.current = [];
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
        if (isSkinPixel(r, g, b)) skinCount++;
      }
      const skinRatio = skinCount / count;

      // ── Multi-person detection ──
      // Look for separate face-sized skin regions instead of raw skin columns.
      const faceRegions = findFaceLikeRegions(pixels, W, H);
      const primaryFace = faceRegions[0];
      const secondaryFace = faceRegions[1];
      const secondaryStrongEnough =
        secondaryFace &&
        primaryFace &&
        secondaryFace.area >= primaryFace.area * 0.34 &&
        Math.abs(secondaryFace.centerX - primaryFace.centerX) >= W * 0.18;
      const isMulti = Boolean(primaryFace && secondaryStrongEnough);

      // Debounce: require 12 of last 20 frames to confirm
      multiHistory.current.push(isMulti ? 1 : 0);
      if (multiHistory.current.length > 20) multiHistory.current.shift();
      const multiVotes = multiHistory.current.reduce((a, b) => a + b, 0);
      setMultiPerson(multiVotes >= 12);

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
      const hasFaceRegion  = faceRegions.length > 0;
      const detected       = goodBrightness && ((hasFaceRegion && (goodVariance || hasSkin)) || (hasSkin && variance > 140));
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
            if (isSkinPixel(r, g, b)) centerSkin++;
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
      multiHistory.current = [];

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
    multiHistory.current = [];
  }, [stream]);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  }, []); // eslint-disable-line

  return { videoRef, stream, enabled, error, eyeContact, faceDetected, multiPerson, faceConfidence, startCamera, stopCamera };
};
