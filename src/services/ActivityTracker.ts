import { PageVisit } from '../types/activity';

export class ActivityTracker {
    private static instance: ActivityTracker;
    private currentVisit: PageVisit | null = null;
    private startTime: number = 0;
    private updateInterval: number | null = null;
    private isTracking: boolean = false;

    private constructor() {
        this.initializeTracking();
    }

    public static getInstance(): ActivityTracker {
        if (!ActivityTracker.instance) {
            ActivityTracker.instance = new ActivityTracker();
        }
        return ActivityTracker.instance;
    }

    private initializeTracking(): void {
        // 1초마다 duration 업데이트 (더 정확한 추적을 위해)
        this.updateInterval = window.setInterval(() => {
            if (!document.hidden && this.currentVisit && this.isTracking) {
                this.updateDuration();
            }
        }, 1000);

        // 페이지 포커스 변경 감지
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.isTracking = false;
                this.updateDuration();
            } else {
                if (this.currentVisit) {
                    this.isTracking = true;
                    this.startTime = Date.now();
                }
            }
        });

        // 페이지 언로드 시 최종 시간 업데이트
        window.addEventListener('beforeunload', () => {
            this.isTracking = false;
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
            this.updateDuration();
        });
    }

    public updatePageInfo(url: string, title: string): void {
        this.updateDuration();
        this.currentVisit = {
            url,
            title,
            category: 'Daily Life',
            timestamp: Date.now(),
            duration: 0,
            isActive: true
        };
        this.startTime = Date.now();
        this.isTracking = true;
    }

    private updateDuration(): void {
        if (this.currentVisit && this.startTime > 0 && this.isTracking) {
            const currentTime = Date.now();
            const timeDiff = currentTime - this.startTime;
            if (timeDiff > 0) {
                this.currentVisit.duration += timeDiff;
                console.log(`Duration updated: ${this.currentVisit.duration}ms for ${this.currentVisit.url}`);
                this.startTime = currentTime;
            }
        }
    }

    public getVisitData(): PageVisit | null {
        this.updateDuration(); // 현재 상태의 최종 duration 업데이트
        return this.currentVisit;
    }

    public resetTracking(): void {
        this.currentVisit = null;
        this.startTime = 0;
        this.isTracking = false;
    }
} 