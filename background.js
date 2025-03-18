// 백그라운드 스크립트 - 브라우저가 열려있는 동안 계속 실행됩니다.
console.log('FocusTrack 백그라운드 스크립트가 로드되었습니다.');

// 브라우징 히스토리 추적 예시
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // URL 변경이 완료된 경우
    console.log(`탭 ${tabId}에서 페이지 로드 완료: ${tab.url}`);
    
    // 여기에 방문 URL 저장, 분석 등의 코드를 추가할 수 있습니다.
    trackVisitedUrl(tab.url, tabId);
  }
});

// 방문한 URL 추적
function trackVisitedUrl(url, tabId) {
  // 저장할 데이터 구조
  const visitData = {
    url: url,
    timestamp: new Date().toISOString(),
    tabId: tabId
  };
  
  // 로컬 스토리지에 저장
  chrome.storage.local.get(['visitHistory'], (result) => {
    const history = result.visitHistory || [];
    history.push(visitData);
    
    // 최대 100개 항목 유지 (필요에 따라 조정)
    if (history.length > 100) {
      history.shift(); // 가장 오래된 항목 제거
    }
    
    chrome.storage.local.set({ visitHistory: history });
  });
} 