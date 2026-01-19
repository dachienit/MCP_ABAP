"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMCP = void 0;
const react_1 = require("react");
const uuid_1 = require("uuid");
const useMCP = () => {
    const [sessionId, setSessionId] = (0, react_1.useState)(null);
    const [isConnected, setIsConnected] = (0, react_1.useState)(false);
    const [logs, setLogs] = (0, react_1.useState)([]);
    const eventSourceRef = (0, react_1.useRef)(null);
    const addLog = (0, react_1.useCallback)((type, message) => {
        setLogs((prev) => [
            ...prev,
            {
                id: (0, uuid_1.v4)(),
                time: new Date().toLocaleTimeString(),
                type,
                message,
            },
        ]);
    }, []);
    const clearLogs = (0, react_1.useCallback)(() => {
        setLogs([]);
    }, []);
    (0, react_1.useEffect)(() => {
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
        es.addEventListener('endpoint', (event) => {
            const urlParams = new URLSearchParams(event.data.split('?')[1]);
            const sid = urlParams.get('sessionId');
            setSessionId(sid);
            addLog('Info', `Session ID received: ${sid}`);
        });
        es.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                addLog('Response', JSON.stringify(data, null, 2));
            }
            catch (e) {
                addLog('Error', `Failed to parse message: ${event.data}`);
            }
        });
        return () => {
            es.close();
        };
    }, [addLog]);
    const callTool = (0, react_1.useCallback)((name, args) => __awaiter(void 0, void 0, void 0, function* () {
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
            const response = yield fetch(`/messages?sessionId=${sessionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error(response.statusText);
            }
        }
        catch (err) {
            addLog('Error', `Failed to send request: ${err.message}`);
        }
    }), [sessionId, addLog]);
    const login = (0, react_1.useCallback)((config) => __awaiter(void 0, void 0, void 0, function* () {
        yield callTool('login', config);
    }), [callTool]);
    return {
        sessionId,
        isConnected,
        logs,
        callTool,
        login,
        clearLogs
    };
};
exports.useMCP = useMCP;
