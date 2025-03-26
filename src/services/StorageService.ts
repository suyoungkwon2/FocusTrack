import { PageVisit } from '../types/activity';

interface StoredHistory {
    visits: PageVisit[];
    lastUpdated: number;
    expiresAt: number;
}

export class StorageService {
    private static readonly HISTORY_KEY = 'focustrack_history';
    private static readonly HISTORY_EXPIRATION = 6 * 60 * 60 * 1000; // 6시간

    public static async saveVisitHistory(visits: PageVisit[]): Promise<void> {
        const history: StoredHistory = {
            visits,
            lastUpdated: Date.now(),
            expiresAt: Date.now() + this.HISTORY_EXPIRATION
        };
        
        await chrome.storage.local.set({ [this.HISTORY_KEY]: history });
    }

    public static async getVisitHistory(): Promise<PageVisit[]> {
        const result = await chrome.storage.local.get(this.HISTORY_KEY);
        const history: StoredHistory | undefined = result[this.HISTORY_KEY];
        
        if (!history || Date.now() > history.expiresAt) {
            return [];
        }
        
        return history.visits;
    }

    public static async clearHistory(): Promise<void> {
        await chrome.storage.local.remove(this.HISTORY_KEY);
    }

    public static async isHistoryValid(): Promise<boolean> {
        const result = await chrome.storage.local.get(this.HISTORY_KEY);
        const history: StoredHistory | undefined = result[this.HISTORY_KEY];
        
        return !!history && Date.now() <= history.expiresAt;
    }
} 