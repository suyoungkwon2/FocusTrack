document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const saveButton = document.getElementById('saveApiKey');
    const statusDiv = document.getElementById('apiKeyStatus');

    // Load saved API key
    chrome.storage.sync.get(['openaiApiKey'], (result) => {
        if (result.openaiApiKey) {
            apiKeyInput.value = result.openaiApiKey;
        }
    });

    // Save API key
    saveButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            showStatus('Please enter an API key', false);
            return;
        }

        chrome.storage.sync.set({ openaiApiKey: apiKey }, () => {
            showStatus('API key saved successfully', true);
        });
    });

    function showStatus(message, isSuccess) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${isSuccess ? 'success' : 'error'}`;
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'status';
        }, 3000);
    }
}); 