import { PageVisit } from './types/activity';

class BackgroundScript {
    constructor() {
        this.initialize();
    }

    private initialize(): void {
        // 확장 프로그램 설치/업데이트 시
        chrome.runtime.onInstalled.addListener(() => {
            console.log('FocusTrack extension installed/updated');
        });

        // 탭 업데이트 이벤트 처리
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                console.log('Tab updated:', tab.url);
            }
        });

        // 메시지 리스너 설정
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'SAVE_VISIT') {
                this.saveVisitData(message.data);
            }
        });

        console.log('FocusTrack 백그라운드 스크립트가 로드되었습니다.');
    }

    private async saveVisitData(visitData: PageVisit): Promise<void> {
        try {
            // Chrome Storage에서 기존 방문 데이터 가져오기
            const result = await chrome.storage.local.get('visits');
            const visits: PageVisit[] = result.visits || [];

            // 새로운 방문 데이터 추가
            visits.push(visitData);

            // 최근 24시간 데이터만 유지
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            const recentVisits = visits.filter(visit => visit.timestamp >= oneDayAgo);

            // 데이터 저장
            await chrome.storage.local.set({ visits: recentVisits });

            console.log('Visit data saved successfully');
        } catch (error) {
            console.error('Error saving visit data:', error);
        }
    }
}

// Background script 초기화
new BackgroundScript(); 