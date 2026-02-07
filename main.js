const imageUpload = document.getElementById('imageUpload');
const originalCanvas = document.getElementById('originalCanvas');
const coloringCanvas = document.getElementById('coloringCanvas');
const convertBtn = document.getElementById('convertBtn');
const printBtn = document.getElementById('printBtn');
const thresholdSlider = document.getElementById('thresholdSlider');
const thresholdValueSpan = document.getElementById('thresholdValue');
const blurSlider = document.getElementById('blurSlider');
const blurValueSpan = document.getElementById('blurValue');
const imageUrlInput = document.getElementById('imageUrl');
const loadUrlBtn = document.getElementById('loadUrlBtn');

const originalCtx = originalCanvas.getContext('2d');
const coloringCtx = coloringCanvas.getContext('2d');

let uploadedImage = null;
let currentThreshold = parseInt(thresholdSlider.value);
let currentBlurRadius = parseFloat(blurSlider.value);

// Update threshold value display
thresholdValueSpan.textContent = currentThreshold;

// Update blur value display
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

// 가우시안 커널 생성 함수
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

    // Normalize kernel
    for (let y = 0; y < kernelSize; y++) {
        for (let x = 0; x < kernelSize; x++) {
            kernel[y][x] /= sum;
        }
    }
    return { kernel: kernel, kernelSize: kernelSize };
}

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
  console.log('Converting image with threshold (Sobel):', currentThreshold, 'Blur Radius:', currentBlurRadius); // Log the threshold
  
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

  // Apply Gaussian Blur
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
    // If blur radius is 0, just copy grayscale data
    blurredGrayscaleData.set(grayscaleData);
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

  // Apply Sobel filter
  const edgeMagnitudeData = new Float32Array(processingWidth * processingHeight);
  const edgeAngleData = new Float32Array(processingWidth * processingHeight);

  for (let y = 1; y < processingHeight - 1; y++) {
    for (let x = 1; x < processingWidth - 1; x++) {
      let sumX = 0;
      let sumY = 0;

      // Apply convolution for Gx and Gy
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelValue = blurredGrayscaleData[(y + ky) * processingWidth + (x + kx)];
          sumX += pixelValue * Gx[ky + 1][kx + 1];
          sumY += pixelValue * Gy[ky + 1][kx + 1];
        }
      }

      const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
      const angle = Math.atan2(sumY, sumX) * 180 / Math.PI; // 각도를 -180 ~ 180도로 계산

      edgeMagnitudeData[y * processingWidth + x] = magnitude;
      edgeAngleData[y * processingWidth + x] = angle;
    }
  }

  // Apply Non-Maximum Suppression (NMS)
  const nmsMagnitudeData = new Float32Array(processingWidth * processingHeight);
  for (let y = 1; y < processingHeight - 1; y++) {
    for (let x = 1; x < processingWidth - 1; x++) {
      const currentMagnitude = edgeMagnitudeData[y * processingWidth + x];
      if (currentMagnitude === 0) { // 엣지 강도가 0이면 스킵
        continue;
      }

      let angle = edgeAngleData[y * processingWidth + x];
      // 각도를 0-180도로 정규화하고 4가지 방향(0, 45, 90, 135)으로 양자화
      if (angle < 0) angle += 180;
      angle = Math.round(angle / 45) * 45;

      let p1 = 0, p2 = 0; // 비교할 인접 픽셀의 강도

      // 엣지 방향에 따른 인접 픽셀 선택
      if (angle === 0 || angle === 180) { // Horizontal edge
        p1 = edgeMagnitudeData[y * processingWidth + (x + 1)];
        p2 = edgeMagnitudeData[y * processingWidth + (x - 1)];
      } else if (angle === 45) { // Diagonal (top-right to bottom-left)
        p1 = edgeMagnitudeData[(y - 1) * processingWidth + (x + 1)];
        p2 = edgeMagnitudeData[(y + 1) * processingWidth + (x - 1)];
      } else if (angle === 90) { // Vertical edge
        p1 = edgeMagnitudeData[(y - 1) * processingWidth + x];
        p2 = edgeMagnitudeData[(y + 1) * processingWidth + x];
      } else if (angle === 135) { // Diagonal (top-left to bottom-right)
        p1 = edgeMagnitudeData[(y - 1) * processingWidth + (x - 1)];
        p2 = edgeMagnitudeData[(y + 1) * processingWidth + (x + 1)];
      }

      // 현재 픽셀의 강도가 인접 픽셀보다 크거나 같으면 유지 (국지적 최대값)
      if (currentMagnitude >= p1 && currentMagnitude >= p2) {
        nmsMagnitudeData[y * processingWidth + x] = currentMagnitude;
      } else {
        nmsMagnitudeData[y * processingWidth + x] = 0; // 억제
      }
    }
  }

  const threshold = currentThreshold; // Use dynamic threshold

  // 최종 임계값 처리
  for (let y = 0; y < processingHeight; y++) {
    for (let x = 0; x < processingWidth; x++) {
      const i = (y * processingWidth + x) * 4;
      const magnitude = nmsMagnitudeData[y * processingWidth + x];

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
  // NMS 처리 시 경계 픽셀은 0으로 초기화되므로 별도로 처리할 필요는 없지만,
  // Sobel 필터가 적용되지 않은 외곽 1픽셀 영역을 흰색으로 강제
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