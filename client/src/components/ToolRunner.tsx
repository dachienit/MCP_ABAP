import React, { useState } from 'react';

interface ToolRunnerProps {
    onCallTool: (name: string, args: any) => Promise<void>;
    user: string;
}

export const ToolRunner: React.FC<ToolRunnerProps> = ({ onCallTool, user }) => {
    const [toolName, setToolName] = useState('');
    const [toolArgs, setToolArgs] = useState('');

    const handleRun = async () => {
        if (!toolName) {
            alert('Please enter a tool name');
            return;
        }

        try {
            const args = toolArgs ? JSON.parse(toolArgs) : {};
            await onCallTool(toolName, args);
        } catch (e) {
            alert('Invalid JSON arguments');
        }
    };

    return (
        <section className="card tools-card">
            <h2>Test Tools</h2>
            <div className="tool-actions">
                <button className="btn-secondary" onClick={() => onCallTool('healthcheck', {})}>Checking Health</button>
                <button className="btn-secondary" onClick={() => onCallTool('discovery/featureDetails', {})}>System Features</button>
                <button className="btn-secondary" onClick={() => onCallTool('transport/userTransports', { user })}>My Transports</button>
            </div>

            <h3>Custom Tool Call</h3>
            <div className="form-group">
                <input
                    type="text"
                    id="tool-name"
                    placeholder="Tool Name (e.g., object/searchObject)"
                    value={toolName}
                    onChange={(e) => setToolName(e.target.value)}
                />
            </div>
            <div className="form-group">
                <textarea
                    id="tool-args"
                    placeholder='{"query": "zcl_test"}'
                    rows={3}
                    value={toolArgs}
                    onChange={(e) => setToolArgs(e.target.value)}
                />
            </div>
            <button id="btn-run" className="btn-primary" onClick={handleRun}>Run Tool</button>
        </section>
    );
};
