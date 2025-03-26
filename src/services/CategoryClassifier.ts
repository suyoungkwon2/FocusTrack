import { Category } from '../types/activity';
import { ConfigService } from './ConfigService';

interface ContentAnalysis {
    category: Category;
    topic: string;
    summary: string;
    keywords: string[];
    isCrawled: boolean;
}

export class CategoryClassifier {
    constructor() {}

    public async classifyUrl(url: string, title: string): Promise<Category> {
        const urlCategory = this.checkUrlRules(url);
        if (urlCategory) {
            return urlCategory;
        }
        const analysis = await this.classifyByKeywords(url, title);
        return analysis.category;
    }

    public async classifyContent(url: string, title: string, content?: string): Promise<ContentAnalysis> {
        const apiKey = await ConfigService.getOpenAIApiKey();
        const apiEndpoint = await ConfigService.getOpenAIEndpoint();
        const orgId = await ConfigService.getOpenAIOrganizationId();

        if (!apiKey || apiKey.trim() === '') {
            console.log('OpenAI API key not found, using keyword-based classification');
            return this.classifyByKeywords(url, title);
        }

        try {
            const prompt = this.createAnalysisPrompt(url, title, content);
            console.log('Sending request to OpenAI API...', {
                endpoint: apiEndpoint,
                hasOrgId: !!orgId,
                promptLength: prompt.length
            });

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'OpenAI-Organization': orgId,
                    'OpenAI-Beta': 'assistants=v1'
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a web content analyzer. Analyze the given content and provide:
1. Category (one of: Growth, Productivity, Daily Life, Entertainment)
2. Main topic (max 30 characters)
3. Content summary (max 200 characters)
4. Key keywords (max 5)

Format your response as JSON:
{
  "category": "Category",
  "topic": "Main topic",
  "summary": "Content summary",
  "keywords": ["keyword1", "keyword2", ...]
}`
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 150
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData,
                    endpoint: apiEndpoint
                });
                return this.classifyByKeywords(url, title);
            }

            const data = await response.json();
            console.log('API Response:', data);

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error('Invalid API response format:', data);
                return this.classifyByKeywords(url, title);
            }

            const result = JSON.parse(data.choices[0].message.content);
            if (!this.isValidCategory(result.category)) {
                console.error('Invalid category in API response:', result);
                return this.classifyByKeywords(url, title);
            }
            
            return {
                category: result.category as Category,
                topic: result.topic || title.substring(0, 30),
                summary: result.summary || `Content analysis for ${title}`,
                keywords: result.keywords || [],
                isCrawled: true
            };
        } catch (error) {
            console.error('Content analysis failed:', error);
            return this.classifyByKeywords(url, title);
        }
    }

    private createAnalysisPrompt(url: string, title: string, content?: string): string {
        if (content) {
            return `URL: ${url}
Title: ${title}
Content: ${content.substring(0, 2000)}...`;
        } else {
            return `URL: ${url}
Title: ${title}
Note: No content available, analyze based on URL and title only.`;
        }
    }

    private checkUrlRules(url: string): Category | null {
        try {
            const hostname = new URL(url).hostname.toLowerCase();

            for (const [category, rules] of Object.entries(CategoryClassifier.CATEGORY_RULES)) {
                if (rules.domains.some(domain => hostname.includes(domain))) {
                    return category as Category;
                }
            }
        } catch (error) {
            console.error('Error parsing URL:', error);
        }

        return null;
    }

    private classifyByKeywords(url: string, title: string): ContentAnalysis {
        const text = `${url} ${title}`.toLowerCase();
        
        const keywords = {
            'Growth': ['course', 'tutorial', 'learn', 'education', 'study', 'academy', 'university', 'school'],
            'Productivity': ['calendar', 'task', 'todo', 'project', 'work', 'office', 'business', 'productivity'],
            'Entertainment': ['game', 'video', 'movie', 'music', 'sport', 'entertainment', 'fun', 'play'],
            'Daily Life': ['news', 'weather', 'shopping', 'food', 'recipe', 'health', 'fitness', 'lifestyle']
        };

        for (const [category, words] of Object.entries(keywords)) {
            if (words.some(word => text.includes(word))) {
                return {
                    category: category as Category,
                    topic: title.substring(0, 30),
                    summary: `URL-based classification for ${title}`,
                    keywords: words.filter(word => text.includes(word)).slice(0, 5),
                    isCrawled: false
                };
            }
        }

        return {
            category: 'Daily Life',
            topic: title.substring(0, 30),
            summary: `URL-based classification for ${title}`,
            keywords: ['general', 'webpage'],
            isCrawled: false
        };
    }

    private isValidCategory(category: string): category is Category {
        return ['Growth', 'Productivity', 'Daily Life', 'Entertainment'].includes(category);
    }

    private static readonly CATEGORY_RULES = {
        Growth: {
            domains: [
                'coursera.org',
                'edx.org',
                'udemy.com',
                'github.com',
                'stackoverflow.com',
                'arxiv.org',
                'scholar.google.com',
                'books.google.com',
                'medium.com',
                'dev.to'
            ],
            keywords: [
                'learn',
                'course',
                'study',
                'education',
                'tutorial',
                'documentation',
                'guide',
                'research',
                'paper',
                'science'
            ]
        },
        Productivity: {
            domains: [
                'gmail.com',
                'outlook.com',
                'calendar.google.com',
                'docs.google.com',
                'drive.google.com',
                'notion.so',
                'trello.com',
                'asana.com',
                'slack.com',
                'zoom.us'
            ],
            keywords: [
                'mail',
                'calendar',
                'task',
                'project',
                'document',
                'spreadsheet',
                'presentation',
                'meeting',
                'collaborate',
                'work'
            ]
        },
        Entertainment: {
            domains: [
                'youtube.com',
                'netflix.com',
                'twitch.tv',
                'instagram.com',
                'facebook.com',
                'twitter.com',
                'tiktok.com',
                'reddit.com',
                'pinterest.com',
                'spotify.com'
            ],
            keywords: [
                'game',
                'play',
                'watch',
                'video',
                'stream',
                'music',
                'movie',
                'social',
                'fun',
                'entertainment'
            ]
        },
        'Daily Life': {
            domains: [
                'google.com',
                'amazon.com',
                'wikipedia.org',
                'weather.com',
                'maps.google.com',
                'news.google.com',
                'nytimes.com',
                'cnn.com',
                'bbc.com',
                'webmd.com'
            ],
            keywords: [
                'news',
                'weather',
                'shop',
                'store',
                'health',
                'food',
                'travel',
                'map',
                'search',
                'info'
            ]
        }
    };
} 