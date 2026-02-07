const imageUpload = document.getElementById('imageUpload');
const originalCanvas = document.getElementById('originalCanvas');
const coloringCanvas = document.getElementById('coloringCanvas');
const convertBtn = document.getElementById('convertBtn');
const printBtn = document.getElementById('printBtn');
const thresholdSlider = document.getElementById('thresholdSlider');
const thresholdValueSpan = document.getElementById('thresholdValue');
const imageUrlInput = document.getElementById('imageUrl');
const loadUrlBtn = document.getElementById('loadUrlBtn');

const originalCtx = originalCanvas.getContext('2d');
const coloringCtx = coloringCanvas.getContext('2d');

let uploadedImage = null;
let currentThreshold = parseInt(thresholdSlider.value);

// Update threshold value display
thresholdValueSpan.textContent = currentThreshold;

thresholdSlider.addEventListener('input', () => {
  currentThreshold = parseInt(thresholdSlider.value);
  thresholdValueSpan.textContent = currentThreshold;
  if (uploadedImage) {
    // Re-run conversion with new threshold for real-time feedback
    convertImageToColoringPage();
  }
});

function loadAndProcessImage(img) {
    uploadedImage = img;

    // Set originalCanvas dimensions to match image
    originalCanvas.width = img.width;
    originalCanvas.height = img.height;
    
    // Define A4 dimensions for display (e.g., at 96 DPI)
    const a4WidthPx = 794; // approx 210mm at 96 DPI
    const a4HeightPx = 1122; // approx 297mm at 96 DPI

    // Set coloringCanvas dimensions to A4 aspect ratio for consistent display
    coloringCanvas.width = a4WidthPx;
    coloringCanvas.height = a4HeightPx;

    originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
    originalCtx.drawImage(img, 0, 0);

    convertBtn.disabled = false;
    printBtn.disabled = true; // Disable print until conversion

    // Clear coloring canvas if a new image is uploaded
    coloringCtx.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height);
    // Immediately convert image after upload
    convertImageToColoringPage();
    printBtn.disabled = false;
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
        alert('이미지 URL을 입력해주세요.');
        return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous"; // CORS 문제 완화 시도
    img.onload = () => {
        loadAndProcessImage(img);
    };
    img.onerror = () => {
        alert('이미지 로드에 실패했습니다. 유효한 URL인지 확인하거나 CORS 문제가 없는지 확인해주세요.');
        // 이미지 로드 실패 시 상태 초기화
        uploadedImage = null;
        originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
        coloringCtx.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height);
        convertBtn.disabled = true;
        printBtn.disabled = true;
    };
    img.src = imageUrl;
});

function convertImageToColoringPage() {
  if (!uploadedImage) {
    return; // Do nothing if no image is uploaded
  }
  console.log('Converting image with threshold (Sobel):', currentThreshold); // Log the threshold
  
  const processingWidth = uploadedImage.width;
  const processingHeight = uploadedImage.height;

  // Draw the original image onto a temporary canvas for processing
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

  // Pre-calculate grayscale values for efficiency
  const grayscaleData = new Uint8ClampedArray(processingWidth * processingHeight);
  for (let y = 0; y < processingHeight; y++) {
    for (let x = 0; x < processingWidth; x++) {
      const i = (y * processingWidth + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      grayscaleData[y * processingWidth + x] = 0.2126 * r + 0.7152 * g + 0.0722 * b; // Luminance
    }
  }

  // Apply Gaussian Blur (3x3 kernel for simplicity)
  const blurredGrayscaleData = new Uint8ClampedArray(processingWidth * processingHeight);
  const gaussianKernel = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1]
  ];
  const kernelSum = 16; // Sum of all values in the kernel

  for (let y = 1; y < processingHeight - 1; y++) {
    for (let x = 1; x < processingWidth - 1; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          sum += grayscaleData[(y + ky) * processingWidth + (x + kx)] * gaussianKernel[ky + 1][kx + 1];
        }
      }
      blurredGrayscaleData[y * processingWidth + x] = sum / kernelSum;
    }
  }

  // Sobel kernels
  const Gx = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];

  const Gy = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];

  const threshold = currentThreshold; // Use dynamic threshold

  // Apply Sobel filter
  for (let y = 1; y < processingHeight - 1; y++) { // Skip border pixels
    for (let x = 1; x < processingWidth - 1; x++) {
      let sumX = 0;
      let sumY = 0;

      // Apply convolution for Gx and Gy
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelValue = grayscaleData[(y + ky) * processingWidth + (x + kx)];
          sumX += pixelValue * Gx[ky + 1][kx + 1];
          sumY += pixelValue * Gy[ky + 1][kx + 1];
        }
      }

      // Calculate magnitude
      const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);

      const i = (y * processingWidth + x) * 4;
      if (magnitude > threshold) {
        outputData[i] = 0;     // Black
        outputData[i + 1] = 0;
        outputData[i + 2] = 0;
        outputData[i + 3] = 255; // Opaque
      } else {
        outputData[i] = 255;     // White
        outputData[i + 1] = 255;
        outputData[i + 2] = 255;
        outputData[i + 3] = 255; // Opaque
      }
    }
  }

  // Handle border pixels (set to white)
  for (let y = 0; y < processingHeight; y++) {
    for (let x = 0; x < processingWidth; x++) {
      if (y === 0 || y === processingHeight - 1 || x === 0 || x === processingWidth - 1) {
        const i = (y * processingWidth + x) * 4;
        outputData[i] = 255;     // White
        outputData[i + 1] = 255;
        outputData[i + 2] = 255;
        outputData[i + 3] = 255; // Opaque
      }
    }
  }

  processedTempCtx.putImageData(outputImageData, 0, 0);

  // Now, draw the processed image onto the main coloringCanvas, scaling to fit its A4 dimensions
  // Clear the coloringCanvas first to ensure a clean slate
  coloringCtx.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height);
  
  // Calculate scaling to fit the processed image into the coloringCanvas (A4 aspect ratio)
  const scale = Math.min(coloringCanvas.width / processingWidth, coloringCanvas.height / processingHeight);
  const scaledWidth = processingWidth * scale;
  const scaledHeight = processingHeight * scale;
  const xOffset = (coloringCanvas.width - scaledWidth) / 2;
  const yOffset = (coloringCanvas.height - scaledHeight) / 2;

  // Draw scaled image centered on the coloringCanvas
  coloringCtx.drawImage(processedTempCanvas, xOffset, yOffset, scaledWidth, scaledHeight);
}

convertBtn.addEventListener('click', () => {
  if (!uploadedImage) {
    alert('Please upload an image first.');
    return;
  }
  console.log('Converting image...');
  convertImageToColoringPage();
  printBtn.disabled = false;
});

printBtn.addEventListener('click', () => {
  console.log('Printing coloring page...');
  window.print();
});