// 백그라운드 스크립트 - 브라우저가 열려있는 동안 계속 실행됩니다.
console.log('FocusTrack 백그라운드 스크립트가 로드되었습니다.');

// 초기 상태 설정
let focusModeActive = false;
let distractionCounter = 0;
let sessionStartTime = null;
let lastActiveTime = Date.now();

// 탭별 활동 시간 추적을 위한 객체
let tabActivity = {};
let activeTabId = null;
let lastActivityTime = null;
let isUserActive = false;

// 활동 감지 간격 (밀리초)
const ACTIVITY_CHECK_INTERVAL = 1000; // 1초
const INACTIVITY_THRESHOLD = 60000; // 60초 동안 활동이 없으면 비활성 상태로 간주

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

// 활동 추적을 위한 콘텐츠 스크립트 삽입
function injectActivityTracker(tabId, url) {
  // chrome:, chrome-extension: 등의 URL에는 콘텐츠 스크립트 삽입 불가
  if (!url || url.startsWith('chrome:') || url.startsWith('chrome-extension:') || url.startsWith('data:')) {
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: setupActivityTracking
  }).catch(err => {
    console.error('콘텐츠 스크립트 삽입 중 오류:', err);
  });
}

// 웹 페이지에 삽입될 활동 추적 스크립트
function setupActivityTracking() {
  // 이미 설정되어 있는 경우 중복 설정 방지
  if (window._focusTrackActivitySetup) return;
  window._focusTrackActivitySetup = true;
  
  console.log('FocusTrack 활동 추적 스크립트가 로드되었습니다.');
  
  // 활동 이벤트 발생 시 백그라운드로 메시지 전송
  function sendActivityEvent(eventType) {
    chrome.runtime.sendMessage({
      action: 'userActivity',
      eventType: eventType,
      timestamp: Date.now(),
      url: window.location.href
    });
  }
  
  // 이벤트 리스너 등록
  window.addEventListener('mousemove', () => sendActivityEvent('mousemove'), { passive: true });
  window.addEventListener('keydown', () => sendActivityEvent('keydown'), { passive: true });
  window.addEventListener('keypress', () => sendActivityEvent('keypress'), { passive: true });
  window.addEventListener('scroll', () => sendActivityEvent('scroll'), { passive: true });
  window.addEventListener('click', () => sendActivityEvent('click'), { passive: true });
  
  // 문서 가시성 상태 변화 감지
  document.addEventListener('visibilitychange', () => {
    sendActivityEvent(document.hidden ? 'hidden' : 'visible');
  });
  
  // 탭 포커스 변화 감지
  window.addEventListener('focus', () => sendActivityEvent('focus'));
  window.addEventListener('blur', () => sendActivityEvent('blur'));
  
  // 초기 상태 전송
  sendActivityEvent(document.hidden ? 'hidden' : 'visible');
}

// 브라우징 히스토리 추적
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // URL 변경이 완료된 경우
    console.log(`탭 ${tabId}에서 페이지 로드 완료: ${tab.url}`);
    
    // 방문 URL 저장 및 분석
    trackVisitedUrl(tab.url, tabId);
    
    // 활동 추적 스크립트 삽입
    injectActivityTracker(tabId, tab.url);
    
    // 집중 모드가 활성화된 경우 방해 요소 체크
    if (focusModeActive) {
      checkForDistraction(tab.url);
    }
  }
});

// 탭 활성화 감지
chrome.tabs.onActivated.addListener((activeInfo) => {
  const tabId = activeInfo.tabId;
  const previousTabId = activeTabId;
  activeTabId = tabId;
  
  // 이전 탭의 활성 시간 기록
  if (previousTabId && previousTabId !== tabId && lastActivityTime) {
    updateTabActivityTime(previousTabId);
  }
  
  // 현재 탭의 활동 시작 시간 설정
  if (!tabActivity[tabId]) {
    tabActivity[tabId] = {
      activeTime: 0,
      lastStart: Date.now(),
      url: null,
      domain: null,
      category: null
    };
  } else {
    tabActivity[tabId].lastStart = Date.now();
  }
  
  // 현재 활성 탭 URL 정보 가져오기
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      console.error('탭 정보 가져오기 오류:', chrome.runtime.lastError);
      return;
    }
    
    if (tab && tab.url) {
      try {
        const urlObj = new URL(tab.url);
        const domain = urlObj.hostname;
        const category = getCategoryForUrl(tab.url);
        
        tabActivity[tabId].url = tab.url;
        tabActivity[tabId].domain = domain;
        tabActivity[tabId].category = category;
      } catch (e) {
        console.error('URL 파싱 오류:', e);
      }
    }
  });
});

// 주기적으로 활성 탭의 활동 시간 업데이트
setInterval(() => {
  if (activeTabId && isUserActive && lastActivityTime) {
    // 마지막 활동 이후 일정 시간이 지나면 비활성 상태로 간주
    const inactiveTime = Date.now() - lastActivityTime;
    if (inactiveTime > INACTIVITY_THRESHOLD) {
      isUserActive = false;
      updateTabActivityTime(activeTabId);
    }
  }
}, ACTIVITY_CHECK_INTERVAL);

// 탭 활동 시간 업데이트
function updateTabActivityTime(tabId) {
  if (!tabActivity[tabId] || !tabActivity[tabId].lastStart) return;
  
  const now = Date.now();
  const activeTime = isUserActive ? (now - tabActivity[tabId].lastStart) : 0;
  
  if (activeTime > 0) {
    tabActivity[tabId].activeTime += activeTime;
    tabActivity[tabId].lastStart = now;
    
    // 스토리지에 활동 시간 저장
    saveTabActivityToStorage(tabId);
  }
}

// 탭 활동 정보를 스토리지에 저장
function saveTabActivityToStorage(tabId) {
  const tab = tabActivity[tabId];
  if (!tab || !tab.url) return;
  
  chrome.storage.local.get(['siteActivity'], (result) => {
    let siteActivity = result.siteActivity || {};
    const domain = tab.domain;
    
    if (!domain) return;
    
    if (!siteActivity[domain]) {
      siteActivity[domain] = {
        totalActiveTime: 0,
        lastVisit: new Date().toISOString(),
        category: tab.category,
        url: tab.url
      };
    }
    
    // 활성 시간 누적
    siteActivity[domain].totalActiveTime += tab.activeTime;
    siteActivity[domain].lastVisit = new Date().toISOString();
    
    // 일일 활동 기록
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
    if (!siteActivity[domain].dailyActivity) {
      siteActivity[domain].dailyActivity = {};
    }
    
    if (!siteActivity[domain].dailyActivity[today]) {
      siteActivity[domain].dailyActivity[today] = 0;
    }
    
    siteActivity[domain].dailyActivity[today] += tab.activeTime;
    
    // 저장
    chrome.storage.local.set({ siteActivity: siteActivity });
    
    // 탭의 활성 시간 초기화
    tab.activeTime = 0;
  });
}

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
  } else if (message.action === 'userActivity') {
    // 사용자 활동 이벤트 처리
    handleUserActivity(message.eventType, message.timestamp, sender.tab?.id);
    sendResponse({ success: true });
  } else if (message.action === 'getSiteActivity') {
    // 사이트별 활동 시간 가져오기
    chrome.storage.local.get(['siteActivity'], (result) => {
      sendResponse({ siteActivity: result.siteActivity || {} });
    });
    return true; // 비동기 응답을 위해 true 반환
  }
  
  // 비동기 응답을 위해 true 반환
  return true;
});

// 사용자 활동 이벤트 처리
function handleUserActivity(eventType, timestamp, tabId) {
  lastActivityTime = timestamp || Date.now();
  lastActiveTime = lastActivityTime; // 집중 모드에서도 동일하게 사용
  
  // 활동 유형에 따른 처리
  switch (eventType) {
    case 'focus':
    case 'visible':
      isUserActive = true;
      break;
    case 'blur':
    case 'hidden':
      isUserActive = false;
      if (tabId) {
        updateTabActivityTime(tabId);
      }
      break;
    default:
      // 마우스 움직임, 키보드 입력, 스크롤, 클릭 등의 활동
      isUserActive = true;
  }
}

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
    
    // 탭 활동 정보 초기화
    if (!tabActivity[tabId]) {
      tabActivity[tabId] = {
        activeTime: 0,
        lastStart: Date.now(),
        url: url,
        domain: urlObj.hostname,
        category: visitData.category
      };
    } else {
      tabActivity[tabId].url = url;
      tabActivity[tabId].domain = urlObj.hostname;
      tabActivity[tabId].category = visitData.category;
    }
    
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
      siteActivity: {},
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