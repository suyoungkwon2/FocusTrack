// 아이콘 생성을 위한 간단한 SVG를 PNG로 변환 도구
// 브라우저에서 실행 가능한 형태로 작성

// FocusTrack 아이콘 SVG 코드 (Base64 인코딩용)
const svgCode = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <!-- 배경 원 -->
  <circle cx="64" cy="64" r="60" fill="#3a86ff" />
  
  <!-- 타이머/집중력 형태 -->
  <circle cx="64" cy="64" r="48" fill="#ffffff" fill-opacity="0.2" stroke="#ffffff" stroke-width="2" />
  <circle cx="64" cy="64" r="6" fill="#ffffff" />
  
  <!-- 시계 바늘 (집중력 표시) -->
  <line x1="64" y1="64" x2="64" y2="30" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
  <line x1="64" y1="64" x2="90" y2="64" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
  
  <!-- 집중 나선 효과 -->
  <path d="M64,40 Q74,50 64,60 Q54,70 64,80 Q74,90 64,100" fill="none" stroke="#ffffff" stroke-width="3" stroke-opacity="0.7" stroke-linecap="round" />
</svg>
`;

// SVG를 Base64로 변환하여 Data URL 생성
const svgBase64 = btoa(svgCode);
const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;

// 아이콘 크기 목록
const iconSizes = [16, 48, 128];

// 브라우저에서 아이콘 생성 페이지를 열기 위한 HTML
const generateIconsHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FocusTrack Icon Generator</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .icons-container {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-top: 20px;
    }
    .icon-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      border: 1px solid #e9ecef;
      padding: 10px;
      border-radius: 8px;
      background-color: white;
    }
    button {
      background-color: #3a86ff;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
    }
    button:hover {
      background-color: #2667cc;
    }
    h1 {
      color: #3a86ff;
    }
    h2 {
      margin: 5px 0;
      font-size: 16px;
    }
    .instructions {
      background-color: #e7f5ff;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <h1>FocusTrack Icon Generator</h1>
  
  <div class="instructions">
    <h3>사용 방법:</h3>
    <ol>
      <li>각 아이콘 크기에 대해 "Save icon" 버튼을 클릭합니다.</li>
      <li>다운로드된 파일을 "images" 폴더에 저장합니다.</li>
      <li>파일명이 manifest.json의 경로와 일치하는지 확인합니다.</li>
    </ol>
  </div>
  
  <div class="icons-container">
    ${iconSizes.map(size => `
      <div class="icon-box">
        <h2>${size}x${size} Icon</h2>
        <canvas id="canvas${size}" width="${size}" height="${size}"></canvas>
        <button onclick="saveIcon(${size})">Save icon${size}.png</button>
      </div>
    `).join('')}
  </div>
  
  <script>
    // SVG 데이터 URL
    const svgDataUrl = "${svgDataUrl}";
    
    // 각 크기별 아이콘 생성
    function drawIcons() {
      const sizes = [${iconSizes.join(', ')}];
      
      sizes.forEach(size => {
        const canvas = document.getElementById(\`canvas\${size}\`);
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.onload = function() {
          ctx.drawImage(img, 0, 0, size, size);
        };
        img.src = svgDataUrl;
      });
    }
    
    // 아이콘 저장 함수
    function saveIcon(size) {
      const canvas = document.getElementById(\`canvas\${size}\`);
      const dataUrl = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = \`icon\${size}.png\`;
      link.href = dataUrl;
      link.click();
    }
    
    // 페이지 로드 시 아이콘 그리기
    window.onload = drawIcons;
  </script>
</body>
</html>
`;

// HTML 파일 생성 (Node.js 환경에서 실행 시 사용)
const fs = require('fs');
fs.writeFileSync('icon_generator.html', generateIconsHtml);
console.log('icon_generator.html 파일이 생성되었습니다.');
console.log('웹 브라우저에서 이 HTML 파일을 열어 아이콘을 생성할 수 있습니다.'); 