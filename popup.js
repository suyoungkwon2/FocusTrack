// 팝업이 로드될 때 실행
document.addEventListener('DOMContentLoaded', function() {
  // 최근 방문 기록 가져오기
  fetchRecentHistory();
  
  // 오늘의 활동 카운트 계산
  calculateTodayActivity();
  
  // 집중 점수 계산 (임시 데이터)
  calculateFocusScore();
  
  // 버튼 이벤트 리스너 추가
  document.getElementById('view-analytics').addEventListener('click', openAnalytics);
  document.getElementById('start-focus').addEventListener('click', startFocusMode);
});

// 최근 방문 기록 가져오기
function fetchRecentHistory() {
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

// 집중 점수 계산 (임시 구현)
function calculateFocusScore() {
  // 실제 구현에서는 여러 요소(체류 시간, 사이트 카테고리 등)를 고려해 점수 계산
  // 현재는 임시로 랜덤 점수 생성
  const score = Math.floor(Math.random() * 51) + 50; // 50-100 사이 임의의 점수
  document.getElementById('focus-score').textContent = score + '/100';
}

// 분석 페이지 열기
function openAnalytics() {
  chrome.tabs.create({ url: 'analytics.html' });
}

// 집중 모드 시작
function startFocusMode() {
  // 집중 모드 상태 저장
  chrome.storage.local.set({ focusModeActive: true }, () => {
    // 상태 표시 업데이트
    const button = document.getElementById('start-focus');
    button.textContent = 'Stop Focus Mode';
    button.style.backgroundColor = '#dc3545';
    
    // 이벤트 리스너 변경
    button.removeEventListener('click', startFocusMode);
    button.addEventListener('click', stopFocusMode);
    
    // 백그라운드 스크립트에 집중 모드 활성화 알림
    chrome.runtime.sendMessage({ action: 'startFocusMode' });
  });
}

// 집중 모드 중지
function stopFocusMode() {
  // 집중 모드 상태 업데이트
  chrome.storage.local.set({ focusModeActive: false }, () => {
    // 상태 표시 업데이트
    const button = document.getElementById('start-focus');
    button.textContent = 'Start Focus Mode';
    button.style.backgroundColor = '#38b000';
    
    // 이벤트 리스너 변경
    button.removeEventListener('click', stopFocusMode);
    button.addEventListener('click', startFocusMode);
    
    // 백그라운드 스크립트에 집중 모드 비활성화 알림
    chrome.runtime.sendMessage({ action: 'stopFocusMode' });
  });
} 