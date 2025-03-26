import { format } from 'date-fns';
import { PageVisit, TimeAllocation, TimeBlock, DailyRoutine, Category } from '../types/activity';

export class TimeAllocationService {
    private static readonly BLOCK_DURATION = 15 * 60 * 1000; // 15분
    private static readonly BLOCKS_PER_DAY = 96; // 24시간 * 4 (15분 간격)
    private static instance: TimeAllocationService;
    private readonly BLOCK_SIZE = 15 * 60 * 1000; // 15분

    private constructor() {}

    public static getInstance(): TimeAllocationService {
        if (!TimeAllocationService.instance) {
            TimeAllocationService.instance = new TimeAllocationService();
        }
        return TimeAllocationService.instance;
    }

    public calculateDailyRoutine(visits: PageVisit[]): DailyRoutine {
        const date = format(new Date(), 'yyyy-MM-dd');
        const timeBlocks = this.createTimeBlocks(visits);
        const totalDuration = visits.reduce((sum, visit) => sum + visit.duration, 0);
        const categoryDistribution = this.calculateCategoryDistribution(visits);

        return {
            date,
            timeBlocks,
            totalDuration,
            categoryDistribution
        };
    }

    private calculateCategoryDistribution(visits: PageVisit[]): Map<Category, number> {
        const distribution = new Map<Category, number>();
        visits.forEach(visit => {
            const count = distribution.get(visit.category) || 0;
            distribution.set(visit.category, count + 1);
        });
        return distribution;
    }

    public createTimeBlocks(visits: PageVisit[]): TimeBlock[] {
        const blocks: TimeBlock[] = [];
        const sortedVisits = [...visits].sort((a, b) => a.timestamp - b.timestamp);

        for (let i = 0; i < sortedVisits.length; i++) {
            const visit = sortedVisits[i];
            const nextVisit = sortedVisits[i + 1];
            
            blocks.push({
                startTime: visit.timestamp,
                endTime: nextVisit ? nextVisit.timestamp : Date.now(),
                category: visit.category,
                duration: nextVisit ? nextVisit.timestamp - visit.timestamp : Date.now() - visit.timestamp
            });
        }

        return blocks;
    }

    private getCategoriesInBlock(visits: PageVisit[]): Category[] {
        const categoryCounts = new Map<Category, number>();
        
        visits.forEach(visit => {
            const count = categoryCounts.get(visit.category) || 0;
            categoryCounts.set(visit.category, count + 1);
        });

        return Array.from(categoryCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([category]) => category);
    }

    private calculateCategoryDurations(visits: PageVisit[]): Map<Category, number> {
        const durations = new Map<Category, number>();

        visits.forEach(visit => {
            const current = durations.get(visit.category) || 0;
            durations.set(visit.category, current + visit.duration);
        });

        return durations;
    }

    private findDominantCategory(durations: Map<Category, number>): Category {
        let maxDuration = 0;
        let dominantCategory: Category = 'Daily Life';

        durations.forEach((duration, category) => {
            if (duration > maxDuration) {
                maxDuration = duration;
                dominantCategory = category;
            }
        });

        return dominantCategory;
    }

    private calculateTotalAllocation(visits: PageVisit[]): TimeAllocation {
        const durations = this.calculateCategoryDurations(visits);

        return {
            Growth: this.formatDuration(durations.get('Growth') || 0),
            Productivity: this.formatDuration(durations.get('Productivity') || 0),
            'Daily Life': this.formatDuration(durations.get('Daily Life') || 0),
            Entertainment: this.formatDuration(durations.get('Entertainment') || 0)
        };
    }

    private formatDuration(ms: number): string {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    private getStartOfDay(): number {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    }
} 