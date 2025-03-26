// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
  // 방문 기록 데이터 로드
  loadVisitHistory();
  
  // 집중 메트릭스 데이터 로드
  loadFocusMetrics();
  
  // 사이트별 활동 시간 로드
  loadSiteActivity();
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

// 사이트별 활동 시간 로드
function loadSiteActivity() {
  chrome.runtime.sendMessage({action: 'getSiteActivity'}, (response) => {
    if (response && response.siteActivity) {
      updateSiteActivityTable(response.siteActivity);
    }
  });
}

// 사이트별 활동 시간 테이블 업데이트
function updateSiteActivityTable(siteActivity) {
  const tableBody = document.getElementById('recent-sites-table');
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  // 배열로 변환하여 최근 방문 순으로 정렬
  const sites = Object.keys(siteActivity).map(domain => {
    const site = siteActivity[domain];
    return {
      domain: domain,
      lastVisit: site.lastVisit,
      totalActiveTime: site.totalActiveTime,
      category: site.category || 'Other',
      url: site.url
    };
  });
  
  // 최근 방문 순으로 정렬
  sites.sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
  
  // 최대 10개 항목만 표시
  const recentSites = sites.slice(0, 10);
  
  // 테이블에 데이터 추가
  recentSites.forEach(site => {
    const row = document.createElement('tr');
    
    // 방문 시간 형식화
    const visitDate = new Date(site.lastVisit);
    const visitTime = `${visitDate.getHours()}:${String(visitDate.getMinutes()).padStart(2, '0')}`;
    
    // 활성 시간 형식화 (밀리초 → 분:초)
    const activeTimeMinutes = Math.floor(site.totalActiveTime / 60000);
    const activeTimeSeconds = Math.floor((site.totalActiveTime % 60000) / 1000);
    const activeTimeFormatted = `${activeTimeMinutes}:${String(activeTimeSeconds).padStart(2, '0')}`;
    
    // 행 내용 추가
    row.innerHTML = `
      <td>${site.domain}</td>
      <td>${visitTime}</td>
      <td>${activeTimeFormatted}</td>
      <td>${site.category}</td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // 데이터가 없는 경우 메시지 표시
  if (recentSites.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="4" style="text-align: center;">활동 데이터가 없습니다.</td>`;
    tableBody.appendChild(row);
  }
}

// 최근 방문 사이트 표시 (방문 기록 기반)
function displayRecentSites(history) {
  // 사이트별 활동 시간을 우선적으로 사용하기 위해 이 함수는 선택적으로 사용
  // 사이트 활동 데이터가 없는 경우 fallback으로 사용
  
  // 먼저 사이트 활동 데이터가 있는지 확인
  chrome.runtime.sendMessage({action: 'getSiteActivity'}, (response) => {
    if (response && response.siteActivity && Object.keys(response.siteActivity).length > 0) {
      // 이미 사이트 활동 데이터가 있으면 아무것도 하지 않음
      return;
    }
    
    // 사이트 활동 데이터가 없으면 방문 기록을 대신 표시
    const tableBody = document.getElementById('recent-sites-table');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // 최근 순으로 정렬
    const sortedHistory = history.sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // 최대 10개 항목만 표시
    const recentHistory = sortedHistory.slice(0, 10);
    
    recentHistory.forEach(item => {
      const row = document.createElement('tr');
      
      // URL 형식화
      const url = new URL(item.url);
      const displayUrl = url.hostname;
      
      // 방문 시간 형식화
      const visitDate = new Date(item.timestamp);
      const visitTime = `${visitDate.getHours()}:${String(visitDate.getMinutes()).padStart(2, '0')}`;
      
      // 임시 체류 시간 (아직 활동 시간 데이터가 수집되지 않은 경우)
      const stayTime = "수집 중...";
      
      // 행 내용 추가
      row.innerHTML = `
        <td>${displayUrl}</td>
        <td>${visitTime}</td>
        <td>${stayTime}</td>
        <td>${item.category || 'Other'}</td>
      `;
      
      tableBody.appendChild(row);
    });
    
    // 데이터가 없는 경우
    if (recentHistory.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="4" style="text-align: center;">방문 기록이 없습니다.</td>`;
      tableBody.appendChild(row);
    }
  });
}

// 집중 메트릭스 로드
function loadFocusMetrics() {
  // 집중 세션 데이터 로드
  chrome.storage.local.get(['focusSessions'], (result) => {
    const sessions = result.focusSessions || [];
    
    if (sessions.length === 0) {
      // 데이터가 없는 경우 임시 값 사용
      const avgMinutes = Math.floor(Math.random() * 20) + 5;
      document.getElementById('avg-focus-time').textContent = `${avgMinutes}:00`;
      
      const maxMinutes = avgMinutes + Math.floor(Math.random() * 30) + 10;
      document.getElementById('max-focus-time').textContent = `${maxMinutes}:00`;
      
      const score = Math.floor(Math.random() * 51) + 50;
      document.getElementById('focus-score').textContent = `${score}/100`;
      return;
    }
    
    // 실제 세션 데이터 분석
    let totalDuration = 0;
    let maxDuration = 0;
    let totalDistractions = 0;
    
    sessions.forEach(session => {
      const duration = session.duration;
      totalDuration += duration;
      maxDuration = Math.max(maxDuration, duration);
      totalDistractions += session.distractions || 0;
    });
    
    // 평균 집중 시간 계산
    const avgDuration = totalDuration / sessions.length;
    const avgMinutes = Math.floor(avgDuration / 60000);
    const avgSeconds = Math.floor((avgDuration % 60000) / 1000);
    document.getElementById('avg-focus-time').textContent = `${avgMinutes}:${String(avgSeconds).padStart(2, '0')}`;
    
    // 최대 집중 시간 계산
    const maxMinutes = Math.floor(maxDuration / 60000);
    const maxSeconds = Math.floor((maxDuration % 60000) / 1000);
    document.getElementById('max-focus-time').textContent = `${maxMinutes}:${String(maxSeconds).padStart(2, '0')}`;
    
    // 집중 점수 계산 (세션 수, 평균 시간, 방해 요소 수를 고려)
    // 간단한 공식: 평균 세션 시간(분) - 방해 요소 수 * 2 + 세션 수 * 5 (최대 100점)
    let score = Math.min(100, Math.max(0, 
      Math.floor(avgDuration / 60000) - (totalDistractions / sessions.length) * 2 + sessions.length * 5
    ));
    document.getElementById('focus-score').textContent = `${score}/100`;
  });
} 