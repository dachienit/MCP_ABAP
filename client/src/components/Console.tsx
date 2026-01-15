import React, { useEffect, useRef } from 'react';
import type { LogEntry } from '../types';

interface ConsoleProps {
    logs: LogEntry[];
    onClear: () => void;
}

export const Console: React.FC<ConsoleProps> = ({ logs, onClear }) => {
    const outputRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <section className="console-section">
            <div className="console-header">
                <h3>Console Output</h3>
                <button className="btn-text" onClick={onClear}>Clear</button>
            </div>
            <div id="console-output" className="console-body" ref={outputRef}>
                {logs.length === 0 && <div className="log-entry system">Waiting for connection...</div>}
                {logs.map((log) => (
                    <div key={log.id} className={`log-entry ${log.type.toLowerCase()}`}>
                        [{log.time}] [{log.type}] {log.message}
                    </div>
                ))}
            </div>
        </section>
    );
};
