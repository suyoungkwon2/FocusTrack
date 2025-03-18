// 백그라운드 스크립트 - 브라우저가 열려있는 동안 계속 실행됩니다.
console.log('FocusTrack 백그라운드 스크립트가 로드되었습니다.');

// 초기 상태 설정
let focusModeActive = false;
let distractionCounter = 0;
let sessionStartTime = null;
let lastActiveTime = Date.now();

// 카테고리별 사이트 분류 (간단한 예시)
const siteCategories = {
  'youtube.com': 'Entertainment',
  'netflix.com': 'Entertainment',
  'github.com': 'Development',
  'stackoverflow.com': 'Development',
  'google.com': 'Search',
  'docs.google.com': 'Productivity',
  'gmail.com': 'Communication',
  'linkedin.com': 'Social Media',
  'twitter.com': 'Social Media',
  'facebook.com': 'Social Media',
  'instagram.com': 'Social Media',
  'reddit.com': 'Social Media',
  'coursera.org': 'Learning',
  'udemy.com': 'Learning',
  'edx.org': 'Learning',
  'kaist.ac.kr': 'Education',
  'cmu.edu': 'Education'
};

// 브라우징 히스토리 추적
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // URL 변경이 완료된 경우
    console.log(`탭 ${tabId}에서 페이지 로드 완료: ${tab.url}`);
    
    // 방문 URL 저장 및 분석
    trackVisitedUrl(tab.url, tabId);
    
    // 집중 모드가 활성화된 경우 방해 요소 체크
    if (focusModeActive) {
      checkForDistraction(tab.url);
    }
  }
});

// 메시지 리스너 (팝업이나 콘텐츠 스크립트에서 보낸 메시지 처리)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startFocusMode') {
    startFocusMode();
    sendResponse({ success: true });
  } else if (message.action === 'stopFocusMode') {
    stopFocusMode();
    sendResponse({ success: true });
  } else if (message.action === 'getFocusStatus') {
    sendResponse({ 
      focusModeActive: focusModeActive,
      distractionCounter: distractionCounter,
      sessionStartTime: sessionStartTime
    });
  }
  
  // 비동기 응답을 위해 true 반환
  return true;
});

// 방문한 URL 추적
function trackVisitedUrl(url, tabId) {
  try {
    // URL 객체로 변환
    const urlObj = new URL(url);
    
    // 데이터 URL, 크롬 내부 페이지 등 제외
    if (urlObj.protocol === 'chrome:' || urlObj.protocol === 'chrome-extension:' || urlObj.protocol === 'data:') {
      return;
    }
    
    // 저장할 데이터 구조
    const visitData = {
      url: url,
      timestamp: new Date().toISOString(),
      tabId: tabId,
      category: getCategoryForUrl(url),
      domain: urlObj.hostname
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
  } catch (e) {
    console.error('URL 추적 중 오류 발생:', e);
  }
}

// URL의 카테고리 판별
function getCategoryForUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    
    // www. 접두사 제거
    const cleanHostname = hostname.replace(/^www\./, '');
    
    // 도메인이 정확히 일치하는지 확인
    if (siteCategories[cleanHostname]) {
      return siteCategories[cleanHostname];
    }
    
    // 부분 도메인 일치 확인 (예: subdomain.example.com)
    for (const domain in siteCategories) {
      if (cleanHostname.includes(domain)) {
        return siteCategories[domain];
      }
    }
    
    // 일치하는 카테고리가 없으면 기타로 분류
    return 'Other';
  } catch (e) {
    console.error('카테고리 판별 중 오류 발생:', e);
    return 'Other';
  }
}

// 집중 모드 시작
function startFocusMode() {
  focusModeActive = true;
  distractionCounter = 0;
  sessionStartTime = Date.now();
  lastActiveTime = Date.now();
  
  // 상태 저장
  chrome.storage.local.set({ 
    focusModeActive: true,
    focusSessionStartTime: sessionStartTime
  });
  
  console.log('집중 모드가 시작되었습니다.');
}

// 집중 모드 중지
function stopFocusMode() {
  if (focusModeActive) {
    focusModeActive = false;
    
    // 세션 종료 시간
    const sessionEndTime = Date.now();
    const sessionDuration = sessionEndTime - sessionStartTime;
    
    // 세션 데이터 저장
    saveFocusSession(sessionStartTime, sessionEndTime, distractionCounter);
    
    // 상태 업데이트
    chrome.storage.local.set({ 
      focusModeActive: false,
      focusSessionStartTime: null
    });
    
    console.log(`집중 모드가 종료되었습니다. 지속 시간: ${Math.floor(sessionDuration / 60000)}분, 방해 요소: ${distractionCounter}회`);
  }
}

// 방해 요소 확인
function checkForDistraction(url) {
  try {
    const hostname = new URL(url).hostname;
    const category = getCategoryForUrl(url);
    
    // 방해 요소로 간주되는 카테고리
    const distractionCategories = ['Social Media', 'Entertainment'];
    
    if (distractionCategories.includes(category)) {
      distractionCounter++;
      console.log(`방해 요소 감지: ${hostname} (${category})`);
      
      // 알림 전송 (Chrome API 지원 시)
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'images/icon128.png',
          title: 'Focus Reminder',
          message: `${hostname}은(는) 집중을 방해할 수 있습니다.`
        });
      }
    }
  } catch (e) {
    console.error('방해 요소 확인 중 오류 발생:', e);
  }
}

// 집중 세션 저장
function saveFocusSession(startTime, endTime, distractions) {
  const sessionData = {
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    duration: endTime - startTime, // 밀리초 단위
    distractions: distractions
  };
  
  chrome.storage.local.get(['focusSessions'], (result) => {
    const sessions = result.focusSessions || [];
    sessions.push(sessionData);
    chrome.storage.local.set({ focusSessions: sessions });
  });
}

// 확장 프로그램 설치 또는 업데이트 시 초기화
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 초기 설정
    chrome.storage.local.set({
      visitHistory: [],
      focusSessions: [],
      focusModeActive: false,
      settings: {
        notificationsEnabled: true,
        focusThreshold: 20, // 분 단위
        distractionCategories: ['Social Media', 'Entertainment']
      }
    });
    
    console.log('FocusTrack가 설치되었습니다. 초기 설정이 완료되었습니다.');
  }
}); 