// 팝업이 로드될 때 실행
document.addEventListener('DOMContentLoaded', function() {
  // 최근 방문 기록 가져오기
  fetchRecentHistory();
  
  // 오늘의 활동 카운트 계산
  calculateTodayActivity();
  
  // 집중 점수 계산
  calculateFocusScore();
  
  // 집중 모드 상태 확인
  checkFocusModeStatus();
  
  // 버튼 이벤트 리스너 추가
  document.getElementById('view-analytics').addEventListener('click', openAnalytics);
  document.getElementById('start-focus').addEventListener('click', startFocusMode);
});

// 집중 모드 상태 확인
function checkFocusModeStatus() {
  chrome.runtime.sendMessage({ action: 'getFocusStatus' }, (response) => {
    if (response && response.focusModeActive) {
      // 이미 집중 모드가 활성화된 상태인 경우
      const button = document.getElementById('start-focus');
      button.textContent = 'Stop Focus Mode';
      button.style.backgroundColor = '#dc3545';
      
      // 이벤트 리스너 교체
      button.removeEventListener('click', startFocusMode);
      button.addEventListener('click', stopFocusMode);
    }
  });
}

// 최근 방문 기록 가져오기
function fetchRecentHistory() {
  // 사이트 활동 데이터 사용
  chrome.runtime.sendMessage({ action: 'getSiteActivity' }, (response) => {
    if (response && response.siteActivity) {
      displayRecentSitesFromActivity(response.siteActivity);
    } else {
      // 활동 데이터가 없으면 방문 기록 사용
      fetchVisitHistory();
    }
  });
}

// 사이트 활동 데이터 기반으로 최근 사이트 표시
function displayRecentSitesFromActivity(siteActivity) {
  // 사이트 활동 데이터를 배열로 변환
  const sites = Object.keys(siteActivity).map(domain => {
    const site = siteActivity[domain];
    return {
      domain: domain,
      lastVisit: site.lastVisit,
      totalActiveTime: site.totalActiveTime,
      category: site.category
    };
  });
  
  // 최근 방문 순으로 정렬
  sites.sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
  
  // 최대 5개 항목만 표시
  const recentSites = sites.slice(0, 5);
  
  // 목록에 추가
  const recentSitesList = document.getElementById('recent-sites');
  recentSitesList.innerHTML = '';
  
  if (recentSites.length === 0) {
    const listItem = document.createElement('li');
    listItem.textContent = 'No browsing history.';
    recentSitesList.appendChild(listItem);
  } else {
    recentSites.forEach(site => {
      const listItem = document.createElement('li');
      
      // 마지막 방문 시간 형식화
      const visitDate = new Date(site.lastVisit);
      const timeString = `${visitDate.getHours()}:${String(visitDate.getMinutes()).padStart(2, '0')}`;
      
      // 활성 시간 형식화 (밀리초 → 분:초)
      const activeTimeMinutes = Math.floor(site.totalActiveTime / 60000);
      const activeTimeSeconds = Math.floor((site.totalActiveTime % 60000) / 1000);
      const activeTimeFormatted = `${activeTimeMinutes}m ${activeTimeSeconds}s`;
      
      listItem.innerHTML = `
        <span class="site-domain">${site.domain}</span>
        <span class="site-info">
          <span class="site-time">${timeString}</span>
          <span class="site-duration">${activeTimeFormatted}</span>
        </span>
      `;
      
      recentSitesList.appendChild(listItem);
    });
  }
}

// 방문 기록에서 데이터 가져오기 (활동 데이터가 없는 경우 사용)
function fetchVisitHistory() {
  chrome.storage.local.get(['visitHistory'], (result) => {
    const history = result.visitHistory || [];
    
    // 최근 순으로 정렬
    const sortedHistory = history.sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // 최대 5개 항목만 표시
    const recentHistory = sortedHistory.slice(0, 5);
    
    // 목록에 추가
    const recentSitesList = document.getElementById('recent-sites');
    recentSitesList.innerHTML = '';
    
    if (recentHistory.length === 0) {
      const listItem = document.createElement('li');
      listItem.textContent = 'No browsing history.';
      recentSitesList.appendChild(listItem);
    } else {
      recentHistory.forEach(item => {
        const listItem = document.createElement('li');
        
        // URL을 보기 좋게 정리
        const url = new URL(item.url);
        const displayUrl = url.hostname;
        
        // 타임스탬프를 보기 좋게 변환
        const date = new Date(item.timestamp);
        const timeString = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        
        listItem.textContent = `${displayUrl} (${timeString})`;
        recentSitesList.appendChild(listItem);
      });
    }
  });
}

// 오늘의 활동 계산
function calculateTodayActivity() {
  // 사이트 활동 데이터 기반으로 계산
  chrome.runtime.sendMessage({ action: 'getSiteActivity' }, (response) => {
    if (response && response.siteActivity) {
      const siteActivity = response.siteActivity;
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
      
      // 오늘의 총 활동 시간 계산 (밀리초)
      let todayTotalTime = 0;
      let todayActiveSites = 0;
      
      Object.keys(siteActivity).forEach(domain => {
        const site = siteActivity[domain];
        if (site.dailyActivity && site.dailyActivity[today]) {
          todayTotalTime += site.dailyActivity[today];
          todayActiveSites++;
        }
      });
      
      // 활동 시간 형식화 (분:초)
      const activeTimeMinutes = Math.floor(todayTotalTime / 60000);
      const activeTimeSeconds = Math.floor((todayTotalTime % 60000) / 1000);
      
      if (todayActiveSites > 0) {
        document.getElementById('today-count').textContent = 
          `${todayActiveSites} sites (${activeTimeMinutes}m ${activeTimeSeconds}s)`;
      } else {
        // 활동 데이터가 없는 경우 방문 횟수만 표시
        calculateVisitCount();
      }
    } else {
      // 활동 데이터가 없는 경우
      calculateVisitCount();
    }
  });
}

// 방문 횟수 계산 (활동 데이터가 없는 경우 사용)
function calculateVisitCount() {
  chrome.storage.local.get(['visitHistory'], (result) => {
    const history = result.visitHistory || [];
    
    // 오늘 방문한 URL 카운트
    const today = new Date().toDateString();
    const todayVisits = history.filter(item => {
      const itemDate = new Date(item.timestamp).toDateString();
      return itemDate === today;
    });
    
    document.getElementById('today-count').textContent = todayVisits.length.toString();
  });
}

// 집중 점수 계산
function calculateFocusScore() {
  // 실제 집중 세션 데이터 사용
  chrome.storage.local.get(['focusSessions'], (result) => {
    const sessions = result.focusSessions || [];
    
    if (sessions.length === 0) {
      // 데이터가 없는 경우 임시 점수 사용
      const score = Math.floor(Math.random() * 51) + 50; // 50-100 사이 임의의 점수
      document.getElementById('focus-score').textContent = score + '/100';
      return;
    }
    
    // 세션 데이터 분석
    let totalDuration = 0;
    let totalDistractions = 0;
    
    sessions.forEach(session => {
      totalDuration += session.duration;
      totalDistractions += session.distractions || 0;
    });
    
    // 평균값 계산
    const avgDuration = totalDuration / sessions.length;
    const avgDistractions = totalDistractions / sessions.length;
    
    // 집중 점수 계산 (간단한 공식)
    // 평균 세션 시간(분) - 방해 요소 수 * 2 + 세션 수 * 5 (최대 100점)
    let score = Math.min(100, Math.max(0, 
      Math.floor(avgDuration / 60000) - avgDistractions * 2 + sessions.length * 5
    ));
    
    document.getElementById('focus-score').textContent = score + '/100';
  });
}

// 분석 페이지 열기
function openAnalytics() {
  chrome.tabs.create({ url: 'analytics.html' });
}

// 집중 모드 시작
function startFocusMode() {
  // 백그라운드 스크립트에 집중 모드 활성화 알림
  chrome.runtime.sendMessage({ action: 'startFocusMode' }, (response) => {
    if (response && response.success) {
      // 상태 표시 업데이트
      const button = document.getElementById('start-focus');
      button.textContent = 'Stop Focus Mode';
      button.style.backgroundColor = '#dc3545';
      
      // 이벤트 리스너 변경
      button.removeEventListener('click', startFocusMode);
      button.addEventListener('click', stopFocusMode);
    }
  });
}

// 집중 모드 중지
function stopFocusMode() {
  // 백그라운드 스크립트에 집중 모드 비활성화 알림
  chrome.runtime.sendMessage({ action: 'stopFocusMode' }, (response) => {
    if (response && response.success) {
      // 상태 표시 업데이트
      const button = document.getElementById('start-focus');
      button.textContent = 'Start Focus Mode';
      button.style.backgroundColor = '#38b000';
      
      // 이벤트 리스너 변경
      button.removeEventListener('click', stopFocusMode);
      button.addEventListener('click', startFocusMode);
    }
  });
} 