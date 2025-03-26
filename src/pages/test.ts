import { PageVisit, Category } from '../types/activity';
import { TimeAllocationService } from '../services/TimeAllocationService';
import { StorageService } from '../services/StorageService';

class TestPage {
    private historyData: PageVisit[] = [];
    private timeAllocationService: TimeAllocationService;
    
    constructor() {
        this.timeAllocationService = TimeAllocationService.getInstance();
        this.initializeUI();
        this.loadSavedHistory();
    }

    private async loadSavedHistory(): Promise<void> {
        const savedHistory = await StorageService.getVisitHistory();
        if (savedHistory.length > 0) {
            this.historyData = savedHistory;
            this.displayResults();
        }
    }

    private initializeUI(): void {
        const testHistoryButton = document.getElementById('testHistory');
        const clearButton = document.getElementById('clearResults');
        const exportButton = document.getElementById('exportToCsv');

        if (testHistoryButton) {
            testHistoryButton.addEventListener('click', () => this.testHistory());
        }
        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearResults());
        }
        if (exportButton) {
            exportButton.addEventListener('click', () => this.exportToCsv());
        }
    }

    private async testHistory(): Promise<void> {
        try {
            const tabs = await chrome.tabs.query({});
            this.historyData = [];

            for (const tab of tabs) {
                if (tab.url && tab.title) {
                    const visitData: PageVisit = {
                        url: tab.url,
                        title: tab.title,
                        category: this.determineCategory(tab.url),
                        timestamp: Date.now(),
                        duration: 0,
                        isActive: true
                    };
                    this.historyData.push(visitData);
                }
            }

            await StorageService.saveVisitHistory(this.historyData);
            this.displayResults();
        } catch (error) {
            console.error('Error in testHistory:', error);
        }
    }

    private determineCategory(url: string): Category {
        const hostname = new URL(url).hostname.toLowerCase();
        
        if (hostname.includes('github.com') || hostname.includes('stackoverflow.com')) {
            return 'Growth';
        } else if (hostname.includes('gmail.com') || hostname.includes('docs.google.com')) {
            return 'Productivity';
        } else if (hostname.includes('youtube.com') || hostname.includes('netflix.com')) {
            return 'Entertainment';
        }
        
        return 'Daily Life';
    }

    private displayResults(): void {
        const container = document.querySelector('.site-statistics');
        if (!container) return;

        // 카테고리 분포 표시
        const categoryDistribution = this.calculateCategoryDistribution();
        const categoryHtml = Object.entries(categoryDistribution)
            .map(([category, count]) => `
                <div class="category-item">
                    <span class="category-name">${category}</span>
                    <span class="category-count">${count}개</span>
                </div>
            `).join('');

        // 방문 기록 표시
        const visitsHtml = this.historyData
            .map(visit => `
                <div class="visit-item">
                    <div class="visit-title">${visit.title}</div>
                    <div class="visit-url">${visit.url}</div>
                    <div class="visit-category category-${visit.category.toLowerCase()}">${visit.category}</div>
                    <div class="visit-duration">${this.formatDuration(visit.duration)}</div>
                </div>
            `).join('');

        container.innerHTML = `
            <div class="statistics-section">
                <h3>카테고리 분포</h3>
                <div class="category-distribution">
                    ${categoryHtml}
                </div>
            </div>
            <div class="visits-section">
                <h3>방문 기록</h3>
                <div class="visit-list">
                    ${visitsHtml}
                </div>
            </div>
        `;
    }

    private calculateCategoryDistribution(): Record<Category, number> {
        const distribution: Partial<Record<Category, number>> = {};
        
        this.historyData.forEach(visit => {
            distribution[visit.category] = (distribution[visit.category] || 0) + 1;
        });
        
        return distribution as Record<Category, number>;
    }

    private formatDuration(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        return hours > 0 
            ? `${hours}시간 ${minutes % 60}분`
            : minutes > 0
                ? `${minutes}분 ${seconds % 60}초`
                : `${seconds}초`;
    }

    private async clearResults(): Promise<void> {
        this.historyData = [];
        await StorageService.clearHistory();
        this.displayResults();
    }

    private exportToCsv(): void {
        const headers = ['Title', 'URL', 'Category', 'Duration', 'Timestamp'];
        const csvContent = [
            headers.join(','),
            ...this.historyData.map(visit => [
                `"${visit.title.replace(/"/g, '""')}"`,
                `"${visit.url}"`,
                visit.category,
                this.formatDuration(visit.duration),
                new Date(visit.timestamp).toLocaleString()
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `focustrack_history_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
    }
}

// 페이지 초기화
new TestPage();