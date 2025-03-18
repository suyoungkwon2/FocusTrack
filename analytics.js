// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
  // 방문 기록 데이터 로드
  loadVisitHistory();
  
  // 집중 메트릭스 데이터 로드 (현재는 임시 데이터)
  loadFocusMetrics();
});

// 방문 기록 데이터 로드
function loadVisitHistory() {
  chrome.storage.local.get(['visitHistory'], (result) => {
    const history = result.visitHistory || [];
    
    if (history.length === 0) {
      // 데이터가 없는 경우
      return;
    }
    
    // 테이블에 데이터 표시
    displayRecentSites(history);
  });
}

// 최근 방문 사이트 표시
function displayRecentSites(history) {
  const tableBody = document.getElementById('recent-sites-table');
  tableBody.innerHTML = '';
  
  // 최근 순으로 정렬
  const sortedHistory = history.sort((a, b) => {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  
  // 최대 10개 항목만 표시
  const recentHistory = sortedHistory.slice(0, 10);
  
  // 임시 데이터 (실제 구현에서는 서버나 로컬에서 계산된 값 사용)
  const categories = ['Learning Sites', 'Social Media', 'Development', 'News & Media', 'Others'];
  
  recentHistory.forEach(item => {
    const row = document.createElement('tr');
    
    // URL 형식화
    const url = new URL(item.url);
    const displayUrl = url.hostname;
    
    // 방문 시간 형식화
    const visitDate = new Date(item.timestamp);
    const visitTime = `${visitDate.getHours()}:${String(visitDate.getMinutes()).padStart(2, '0')}`;
    
    // 임의의 체류 시간 (실제 구현에서는 실제 데이터 사용)
    const stayMinutes = Math.floor(Math.random() * 30) + 1;
    const stayTime = `${stayMinutes} min`;
    
    // 임의의 카테고리 (실제 구현에서는 분류 알고리즘 사용)
    const randomCategoryIndex = Math.floor(Math.random() * categories.length);
    const category = categories[randomCategoryIndex];
    
    // 행 내용 추가
    row.innerHTML = `
      <td>${displayUrl}</td>
      <td>${visitTime}</td>
      <td>${stayTime}</td>
      <td>${category}</td>
    `;
    
    tableBody.appendChild(row);
  });
}

// 집중 메트릭스 로드 (임시 데이터)
function loadFocusMetrics() {
  // 실제 구현에서는 수집된 데이터를 분석하여 계산된 값 사용
  
  // 평균 집중 시간 (임시 값)
  const avgMinutes = Math.floor(Math.random() * 20) + 5;
  document.getElementById('avg-focus-time').textContent = `${avgMinutes}:00`;
  
  // 최대 집중 시간 (임시 값)
  const maxMinutes = avgMinutes + Math.floor(Math.random() * 30) + 10;
  document.getElementById('max-focus-time').textContent = `${maxMinutes}:00`;
  
  // 집중 점수 (임시 값)
  const score = Math.floor(Math.random() * 51) + 50;
  document.getElementById('focus-score').textContent = `${score}/100`;
} 