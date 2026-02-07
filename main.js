import './components/AppHeader.js';
import './components/ControlPanel.js';
import './components/CanvasDisplay.js';
import './components/AppFooter.js';

document.addEventListener('DOMContentLoaded', () => {
  const controlPanel = document.querySelector('control-panel').shadowRoot;
  const canvasDisplay = document.querySelector('canvas-display').shadowRoot;

  const imageUpload = controlPanel.getElementById('imageUpload');
  const imageUrlInput = controlPanel.getElementById('imageUrl');
  const loadUrlBtn = controlPanel.getElementById('loadUrlBtn');
  const convertBtn = controlPanel.getElementById('convertBtn');
  const printBtn = controlPanel.getElementById('printBtn');
  const downloadSvgBtn = controlPanel.getElementById('downloadSvgBtn');
  const thresholdSlider = controlPanel.getElementById('thresholdSlider');
  const thresholdValueSpan = controlPanel.getElementById('thresholdValue');
  const blurSlider = controlPanel.getElementById('blurSlider');
  const blurValueSpan = controlPanel.getElementById('blurValue');

  const originalCanvas = canvasDisplay.getElementById('originalCanvas');
  const coloringCanvas = canvasDisplay.getElementById('coloringCanvas');
  const originalCtx = originalCanvas.getContext('2d');
  const coloringCtx = coloringCanvas.getContext('2d');

  let uploadedImage = null;
  let currentThreshold = parseInt(thresholdSlider.value);
  let currentBlurRadius = parseFloat(blurSlider.value);
  let processedCanvasForSVG = null;

  thresholdValueSpan.textContent = currentThreshold;
  blurValueSpan.textContent = currentBlurRadius.toFixed(1);

  thresholdSlider.addEventListener('input', () => {
    currentThreshold = parseInt(thresholdSlider.value);
    thresholdValueSpan.textContent = currentThreshold;
    if (uploadedImage) {
      convertImageToColoringPage();
    }
  });

  blurSlider.addEventListener('input', () => {
    currentBlurRadius = parseFloat(blurSlider.value);
    blurValueSpan.textContent = currentBlurRadius.toFixed(1);
    if (uploadedImage) {
      convertImageToColoringPage();
    }
  });

  function generateGaussianKernel(radius, sigma = radius / 3) {
      const kernelSize = 2 * Math.ceil(radius) + 1;
      const kernel = Array(kernelSize).fill(0).map(() => Array(kernelSize).fill(0));
      let sum = 0;
      const center = Math.floor(kernelSize / 2);

      for (let y = 0; y < kernelSize; y++) {
          for (let x = 0; x < kernelSize; x++) {
              const exp = Math.exp(-((x - center) * (x - center) + (y - center) * (y - center)) / (2 * sigma * sigma));
              const val = exp / (2 * Math.PI * sigma * sigma);
              kernel[y][x] = val;
              sum += val;
          }
      }

      for (let y = 0; y < kernelSize; y++) {
          for (let x = 0; x < kernelSize; x++) {
              kernel[y][x] /= sum;
          }
      }
      return { kernel: kernel, kernelSize: kernelSize };
  }

  function loadAndProcessImage(img) {
      uploadedImage = img;

      originalCanvas.width = img.width;
      originalCanvas.height = img.height;
      
      const a4WidthPx = 794;
      const a4HeightPx = 1122;

      coloringCanvas.width = a4WidthPx;
      coloringCanvas.height = a4HeightPx;

      originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
      originalCtx.drawImage(img, 0, 0);

      convertBtn.disabled = false;
      printBtn.disabled = true;
      downloadSvgBtn.disabled = true; 

      coloringCtx.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height);
      convertImageToColoringPage();
      printBtn.disabled = false;
      downloadSvgBtn.disabled = false;
  }

  imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        loadAndProcessImage(img);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  loadUrlBtn.addEventListener('click', () => {
      const imageUrl = imageUrlInput.value.trim();
      if (!imageUrl) {
          alert('Please enter an image URL.');
          return;
      }

      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
          loadAndProcessImage(img);
      };
      img.onerror = () => {
          alert('Failed to load the image. Please check the URL or CORS policy.');
          uploadedImage = null;
          originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
          coloringCtx.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height);
          convertBtn.disabled = true;
          printBtn.disabled = true;
          downloadSvgBtn.disabled = true;
      };
      img.src = imageUrl;
  });

  function convertImageToColoringPage() {
    if (!uploadedImage) {
      return;
    }
    
    const processingWidth = uploadedImage.width;
    const processingHeight = uploadedImage.height;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = processingWidth;
    tempCanvas.height = processingHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(uploadedImage, 0, 0, processingWidth, processingHeight);

    const imageData = tempCtx.getImageData(0, 0, processingWidth, processingHeight);
    const data = imageData.data;
    
    const processedTempCanvas = document.createElement('canvas');
    processedTempCanvas.width = processingWidth;
    processedTempCanvas.height = processingHeight;
    const processedTempCtx = processedTempCanvas.getContext('2d');
    const outputImageData = processedTempCtx.createImageData(processingWidth, processingHeight);
    const outputData = outputImageData.data;

    const grayscaleData = new Uint8ClampedArray(processingWidth * processingHeight);
    for (let y = 0; y < processingHeight; y++) {
      for (let x = 0; x < processingWidth; x++) {
        const i = (y * processingWidth + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        grayscaleData[y * processingWidth + x] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }
    }

    const blurredGrayscaleData = new Uint8ClampedArray(processingWidth * processingHeight);
    if (currentBlurRadius > 0) {
      const { kernel, kernelSize } = generateGaussianKernel(currentBlurRadius);
      const halfKernel = Math.floor(kernelSize / 2);

      for (let y = halfKernel; y < processingHeight - halfKernel; y++) {
        for (let x = halfKernel; x < processingWidth - halfKernel; x++) {
          let sum = 0;
          for (let ky = -halfKernel; ky <= halfKernel; ky++) {
            for (let kx = -halfKernel; kx <= halfKernel; kx++) {
              sum += grayscaleData[(y + ky) * processingWidth + (x + kx)] * kernel[ky + halfKernel][kx + halfKernel];
            }
          }
          blurredGrayscaleData[y * processingWidth + x] = sum;
        }
      }
    } else {
      blurredGrayscaleData.set(grayscaleData);
    }

    const Gx = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const Gy = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

    const edgeMagnitudeData = new Float32Array(processingWidth * processingHeight);
    const edgeAngleData = new Float32Array(processingWidth * processingHeight);

    for (let y = 1; y < processingHeight - 1; y++) {
      for (let x = 1; x < processingWidth - 1; x++) {
        let sumX = 0;
        let sumY = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelValue = blurredGrayscaleData[(y + ky) * processingWidth + (x + kx)];
            sumX += pixelValue * Gx[ky + 1][kx + 1];
            sumY += pixelValue * Gy[ky + 1][kx + 1];
          }
        }

        const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
        const angle = Math.atan2(sumY, sumX) * 180 / Math.PI;

        edgeMagnitudeData[y * processingWidth + x] = magnitude;
        edgeAngleData[y * processingWidth + x] = angle;
      }
    }

    const nmsMagnitudeData = new Float32Array(processingWidth * processingHeight);
    for (let y = 1; y < processingHeight - 1; y++) {
      for (let x = 1; x < processingWidth - 1; x++) {
        const currentMagnitude = edgeMagnitudeData[y * processingWidth + x];
        if (currentMagnitude === 0) {
          continue;
        }

        let angle = edgeAngleData[y * processingWidth + x];
        if (angle < 0) angle += 180;
        angle = Math.round(angle / 45) * 45;

        let p1 = 0, p2 = 0;

        if (angle === 0 || angle === 180) {
          p1 = edgeMagnitudeData[y * processingWidth + (x + 1)];
          p2 = edgeMagnitudeData[y * processingWidth + (x - 1)];
        } else if (angle === 45) {
          p1 = edgeMagnitudeData[(y - 1) * processingWidth + (x + 1)];
          p2 = edgeMagnitudeData[(y + 1) * processingWidth + (x - 1)];
        } else if (angle === 90) {
          p1 = edgeMagnitudeData[(y - 1) * processingWidth + x];
          p2 = edgeMagnitudeData[(y + 1) * processingWidth + x];
        } else if (angle === 135) {
          p1 = edgeMagnitudeData[(y - 1) * processingWidth + (x - 1)];
          p2 = edgeMagnitudeData[(y + 1) * processingWidth + (x + 1)];
        }

        if (currentMagnitude >= p1 && currentMagnitude >= p2) {
          nmsMagnitudeData[y * processingWidth + x] = currentMagnitude;
        } else {
          nmsMagnitudeData[y * processingWidth + x] = 0;
        }
      }
    }

    const threshold = currentThreshold;

    for (let y = 0; y < processingHeight; y++) {
      for (let x = 0; x < processingWidth; x++) {
        const i = (y * processingWidth + x) * 4;
        const magnitude = nmsMagnitudeData[y * processingWidth + x];

        if (magnitude > threshold) {
          outputData[i] = 0; outputData[i + 1] = 0; outputData[i + 2] = 0; outputData[i + 3] = 255;
        } else {
          outputData[i] = 255; outputData[i + 1] = 255; outputData[i + 2] = 255; outputData[i + 3] = 255;
        }
      }
    }

    for (let y = 0; y < processingHeight; y++) {
      for (let x = 0; x < processingWidth; x++) {
        if (y === 0 || y === processingHeight - 1 || x === 0 || x === processingWidth - 1) {
          const i = (y * processingWidth + x) * 4;
          outputData[i] = 255; outputData[i + 1] = 255; outputData[i + 2] = 255; outputData[i + 3] = 255;
        }
      }
    }

    processedTempCtx.putImageData(outputImageData, 0, 0);
    processedCanvasForSVG = processedTempCanvas;

    coloringCtx.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height);
    
    const scale = Math.min(coloringCanvas.width / processingWidth, coloringCanvas.height / processingHeight);
    const scaledWidth = processingWidth * scale;
    const scaledHeight = processingHeight * scale;
    const xOffset = (coloringCanvas.width - scaledWidth) / 2;
    const yOffset = (coloringCanvas.height - scaledHeight) / 2;

    coloringCtx.drawImage(processedTempCanvas, xOffset, yOffset, scaledWidth, scaledHeight);
  }

  convertBtn.addEventListener('click', () => {
    if (!uploadedImage) {
      alert('Please upload an image first.');
      return;
    }
    convertImageToColoringPage();
    printBtn.disabled = false;
    downloadSvgBtn.disabled = false;
  });

  printBtn.addEventListener('click', () => {
    window.print();
  });

  downloadSvgBtn.addEventListener('click', () => {
      if (!processedCanvasForSVG) {
          alert('Please convert an image first.');
          return;
      }

      const trace = new Potrace(processedCanvasForSVG);
      trace.process(() => {
          const svg = trace.getSVG();
          
          const blob = new Blob([svg], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = 'coloring-page.svg';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      });
  });
});
