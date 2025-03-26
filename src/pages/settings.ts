import { ConfigService } from '../services/ConfigService';

class SettingsPage {
    private apiKeyInput: HTMLInputElement;
    private apiEndpointInput: HTMLInputElement;
    private saveButton: HTMLButtonElement;
    private statusDiv: HTMLDivElement;

    constructor() {
        this.apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
        this.apiEndpointInput = document.getElementById('apiEndpoint') as HTMLInputElement;
        this.saveButton = document.getElementById('saveButton') as HTMLButtonElement;
        this.statusDiv = document.getElementById('status') as HTMLDivElement;

        this.loadSettings();
        this.setupEventListeners();
    }

    private async loadSettings() {
        const apiKey = await ConfigService.getOpenAIApiKey();
        const apiEndpoint = await ConfigService.getOpenAIEndpoint();

        if (apiKey) {
            this.apiKeyInput.value = apiKey;
        }
        if (apiEndpoint) {
            this.apiEndpointInput.value = apiEndpoint;
        }
    }

    private setupEventListeners() {
        this.saveButton.addEventListener('click', () => this.saveSettings());
    }

    private async saveSettings() {
        try {
            const apiKey = this.apiKeyInput.value.trim();
            const apiEndpoint = this.apiEndpointInput.value.trim();

            if (!apiKey) {
                this.showStatus('API 키를 입력해주세요.', false);
                return;
            }

            await ConfigService.setOpenAIApiKey(apiKey);
            
            if (apiEndpoint) {
                await ConfigService.setOpenAIEndpoint(apiEndpoint);
            }

            this.showStatus('설정이 저장되었습니다.', true);
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showStatus('설정 저장 중 오류가 발생했습니다.', false);
        }
    }

    private showStatus(message: string, isSuccess: boolean) {
        this.statusDiv.textContent = message;
        this.statusDiv.className = `status ${isSuccess ? 'success' : 'error'}`;
        this.statusDiv.style.display = 'block';

        setTimeout(() => {
            this.statusDiv.style.display = 'none';
        }, 3000);
    }
}

// 페이지 로드 시 초기화
new SettingsPage(); 