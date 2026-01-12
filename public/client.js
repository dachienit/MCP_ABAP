let sessionId = null;

// Initialize connection on load
window.addEventListener('load', () => {
    connectSSE();
    setupEventListeners();
});

function connectSSE() {
    const statusDot = document.getElementById('connection-status');
    const statusText = document.getElementById('status-text');

    log('System', 'Connecting to server...');

    // Connect to SSE endpoint relative to current origin
    const eventSource = new EventSource('/sse');

    eventSource.onopen = () => {
        statusDot.className = 'status-dot connected';
        statusText.textContent = 'Connected';
        log('System', 'SSE Connection established');
    };

    eventSource.onerror = (err) => {
        statusDot.className = 'status-dot';
        statusText.textContent = 'Disconnected (Retrying...)';
        log('Error', 'Connection lost');
    };

    // Listen for 'endpoint' event to get session ID
    eventSource.addEventListener('endpoint', (event) => {
        // Format: /messages?sessionId=...
        const urlParams = new URLSearchParams(event.data.split('?')[1]);
        sessionId = urlParams.get('sessionId');
        log('Info', `Session ID received: ${sessionId}`);
    });

    // Listen for 'message' event (responses from server)
    eventSource.addEventListener('message', (event) => {
        try {
            const data = JSON.parse(event.data);
            log('Response', JSON.stringify(data, null, 2));

            // Check if this is a login result
            if (data.result && data.result.content) {
                // Heuristic check for successful login
                const content = data.result.content[0].text;
                if (content.includes('Login successful') || content.includes('session initialized')) {
                    alert('Login Successful!');
                }
            }
        } catch (e) {
            log('Error', `Failed to parse message: ${event.data}`);
        }
    });
}

function setupEventListeners() {
    document.getElementById('btn-login').addEventListener('click', async () => {
        const url = document.getElementById('sap-url').value;
        const user = document.getElementById('sap-user').value;
        const pass = document.getElementById('sap-password').value;
        const client = document.getElementById('sap-client').value;
        const lang = document.getElementById('sap-language').value;
        const skipSSL = document.getElementById('skip-ssl').checked;

        if (!url || !user || !pass) {
            alert('Please fill in required fields');
            return;
        }

        const args = {
            SAP_URL: url,
            SAP_USER: user,
            SAP_PASSWORD: pass,
            SAP_CLIENT: client,
            SAP_LANGUAGE: lang,
            NODE_TLS_REJECT_UNAUTHORIZED: skipSSL ? '0' : '1'
        };

        callTool('login', args);
    });

    document.getElementById('btn-run').addEventListener('click', () => {
        const toolName = document.getElementById('tool-name').value;
        const argsStr = document.getElementById('tool-args').value;

        if (!toolName) {
            alert('Please enter a tool name');
            return;
        }

        try {
            const args = argsStr ? JSON.parse(argsStr) : {};
            callTool(toolName, args);
        } catch (e) {
            alert('Invalid JSON arguments');
        }
    });
}

async function callTool(name, args) {
    if (!sessionId) {
        alert('Not connected to server');
        return;
    }

    const payload = {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
            name: name,
            arguments: args
        },
        id: Date.now()
    };

    log('Request', `Calling tool: ${name}`);

    try {
        const response = await fetch(`/messages?sessionId=${sessionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(response.statusText);
        }
    } catch (err) {
        log('Error', `Failed to send request: ${err.message}`);
    }
}

function log(type, message) {
    const consoleOutput = document.getElementById('console-output');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type.toLowerCase()}`;

    const time = new Date().toLocaleTimeString();
    entry.textContent = `[${time}] [${type}] ${message}`;

    consoleOutput.appendChild(entry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function clearConsole() {
    document.getElementById('console-output').innerHTML = '';
}

// Make globally available for button onclick handlers
window.callTool = callTool;
window.clearConsole = clearConsole;
