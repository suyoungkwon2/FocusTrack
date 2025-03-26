export type Category = 'Growth' | 'Productivity' | 'Daily Life' | 'Entertainment';

export interface CategoryColors {
    Growth: '#007AFF';
    Productivity: '#34C759';
    'Daily Life': '#FF9500';
    Entertainment: '#FF2D55';
}

export interface PageVisit {
    url: string;
    title: string;
    category: Category;
    timestamp: number;
    duration: number;
    isActive: boolean;
    topic?: string;
    summary?: string;
    keywords?: string[];
    isCrawled?: boolean;
}

export interface TimeAllocation {
    Growth: string;
    Productivity: string;
    'Daily Life': string;
    Entertainment: string;
}

export interface TimeBlock {
    startTime: number;
    endTime: number;
    category: Category;
    duration: number;
}

export interface DailyRoutine {
    date: string;
    timeBlocks: TimeBlock[];
    totalDuration: number;
    categoryDistribution: Map<Category, number>;
} 