import { useState, useEffect, useCallback, useRef } from 'react';
import type { LogEntry, LoginConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const useMCP = () => {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const eventSourceRef = useRef<EventSource | null>(null);

    const addLog = useCallback((type: LogEntry['type'], message: string) => {
        setLogs((prev) => [
            ...prev,
            {
                id: uuidv4(),
                time: new Date().toLocaleTimeString(),
                type,
                message,
            },
        ]);
    }, []);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    useEffect(() => {
        addLog('System', 'Connecting to server...');
        const es = new EventSource('/sse');
        eventSourceRef.current = es;

        es.onopen = () => {
            setIsConnected(true);
            addLog('System', 'SSE Connection established');
        };

        es.onerror = (_err) => {
            setIsConnected(false);
            addLog('Error', 'Connection lost');
        };

        es.addEventListener('endpoint', (event: MessageEvent) => {
            const urlParams = new URLSearchParams(event.data.split('?')[1]);
            const sid = urlParams.get('sessionId');
            setSessionId(sid);
            addLog('Info', `Session ID received: ${sid}`);
        });

        es.addEventListener('message', (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                addLog('Response', JSON.stringify(data, null, 2));
            } catch (e) {
                addLog('Error', `Failed to parse message: ${event.data}`);
            }
        });

        return () => {
            es.close();
        };
    }, [addLog]);

    const callTool = useCallback(async (name: string, args: any) => {
        if (!sessionId) {
            alert('Not connected to server');
            return;
        }

        const payload = {
            jsonrpc: "2.0",
            method: "tools/call",
            params: {
                name,
                arguments: args
            },
            id: Date.now()
        };

        addLog('Request', `Calling tool: ${name}`);

        try {
            const response = await fetch(`/messages?sessionId=${sessionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(response.statusText);
            }
        } catch (err: any) {
            addLog('Error', `Failed to send request: ${err.message}`);
        }
    }, [sessionId, addLog]);

    const login = useCallback(async (config: LoginConfig) => {
        await callTool('login', config);
    }, [callTool]);

    return {
        sessionId,
        isConnected,
        logs,
        callTool,
        login,
        clearLogs
    };
};
