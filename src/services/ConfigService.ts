export class ConfigService {
    private static instance: ConfigService;
    private apiKey: string = '';
    private apiEndpoint: string = 'https://api.openai.com/v1/chat/completions';
    private static readonly OPENAI_ORG_ID = 'org-KxJ9KFOXPBxZEXKTGPDPBPXF';  // OpenAI Organization ID

    private constructor() {}

    public static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    public setApiKey(key: string): void {
        this.apiKey = key;
    }

    public getApiKey(): string {
        return this.apiKey;
    }

    public getApiEndpoint(): string {
        return this.apiEndpoint;
    }

    public static async getOpenAIOrganizationId(): Promise<string> {
        return this.OPENAI_ORG_ID;
    }

    public static async setOpenAIApiKey(key: string): Promise<void> {
        // API 키는 하드코딩되어 있으므로 실제로는 아무것도 하지 않습니다
    }

    public static async setOpenAIEndpoint(endpoint: string): Promise<void> {
        // 엔드포인트는 하드코딩되어 있으므로 실제로는 아무것도 하지 않습니다
    }
} 