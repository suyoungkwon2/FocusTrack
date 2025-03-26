import { ActivityTracker } from './services/ActivityTracker';
import { CategoryClassifier } from './services/CategoryClassifier';
import { ConfigService } from './services/ConfigService';

class ContentScript {
  private activityTracker: ActivityTracker;
  private categoryClassifier: CategoryClassifier;

  constructor() {
    this.activityTracker = ActivityTracker.getInstance();
    this.categoryClassifier = new CategoryClassifier();
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    // 페이지 로드 시 초기화
    window.addEventListener('load', () => {
      console.log('Page loaded, initializing tracking...');
      this.activityTracker.updatePageInfo(window.location.href, document.title);
      this.analyzePage();
    });

    // 페이지 가시성 변경 시
    document.addEventListener('visibilitychange', () => {
      console.log('Visibility changed:', !document.hidden);
      const visitData = this.activityTracker.getVisitData();
      if (visitData) {
        console.log('Current duration:', visitData.duration);
      }
    });

    // 페이지 언로드 시
    window.addEventListener('beforeunload', async () => {
      console.log('Page unloading, saving visit data...');
      const visitData = this.activityTracker.getVisitData();
      if (visitData) {
        try {
          const analysis = await this.categoryClassifier.classifyContent(
            visitData.url,
            visitData.title,
            document.body.innerText
          );
          
          const finalVisitData = {
            ...visitData,
            category: analysis.category,
            topic: analysis.topic,
            summary: analysis.summary,
            keywords: analysis.keywords,
            isCrawled: analysis.isCrawled
          };

          console.log('Saving visit data:', finalVisitData);
          chrome.runtime.sendMessage({
            type: 'SAVE_VISIT',
            data: finalVisitData
          });
        } catch (error) {
          console.error('Error saving visit data:', error);
        }
      }
    });
  }

  private async analyzePage(): Promise<void> {
    const url = window.location.href;
    const title = document.title;
    const content = document.body.innerText;

    try {
      console.log('Analyzing page content...');
      const analysis = await this.categoryClassifier.classifyContent(url, title, content);
      console.log('Page analysis result:', analysis);
      
      chrome.runtime.sendMessage({
        type: 'PAGE_ANALYSIS',
        data: {
          url,
          title,
          category: analysis.category,
          topic: analysis.topic,
          summary: analysis.summary,
          keywords: analysis.keywords,
          isCrawled: analysis.isCrawled
        }
      });
    } catch (error) {
      console.error('Error analyzing page:', error);
    }
  }
}

// 콘텐츠 스크립트 초기화
console.log('Content script starting...');
new ContentScript(); 