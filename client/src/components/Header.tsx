import React from 'react';

interface HeaderProps {
    isConnected: boolean;
    sessionId: string | null;
}

export const Header: React.FC<HeaderProps> = ({ isConnected }) => {
    return (
        <header>
            <div className="logo">MCP ABAP</div>
            <div className="status-indicator">
                <span id="connection-status" className={`status-dot ${isConnected ? 'connected' : ''}`}></span>
                <span id="status-text">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
        </header>
    );
};
