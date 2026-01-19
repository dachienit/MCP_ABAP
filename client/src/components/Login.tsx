import React, { useState } from 'react';
import type { LoginConfig } from '../types';

interface LoginProps {
    onLogin: (config: LoginConfig) => Promise<void>;
    isLoading?: boolean;
}

export const Login: React.FC<LoginProps> = ({ onLogin, isLoading }) => {
    const [config, setConfig] = useState<LoginConfig>({
        SAP_URL: '',
        SAP_USER: '',
        SAP_PASSWORD: '',
        SAP_CLIENT: '100',
        SAP_LANGUAGE: 'EN',
        NODE_TLS_REJECT_UNAUTHORIZED: '1',
        HTTP_PROXY: '',
        NO_PROXY: ''
    });
    const [skipSSL, setSkipSSL] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        // Map id to config key (convert kebab-case to uppercase underscore if needed, or just handle manually)
        // The IDs in original HTML were sap-url, sap-user etc.
        // Let's use simple mapping or update state directly

        // Helper to map id to key
        let key: keyof LoginConfig | null = null;
        if (id === 'sap-url') key = 'SAP_URL';
        if (id === 'sap-user') key = 'SAP_USER';
        if (id === 'sap-password') key = 'SAP_PASSWORD';
        if (id === 'sap-client') key = 'SAP_CLIENT';
        if (id === 'sap-language') key = 'SAP_LANGUAGE';
        if (id === 'http-proxy') key = 'HTTP_PROXY';
        else if (id === 'no-proxy') key = 'NO_PROXY';

        if (key) {
            setConfig(prev => ({ ...prev, [key!]: value }));
        }
    };

    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSkipSSL(e.target.checked);
        setConfig(prev => ({ ...prev, NODE_TLS_REJECT_UNAUTHORIZED: e.target.checked ? '0' : '1' }));
    };

    const handleLogin = async () => {
        if (!config.SAP_URL || !config.SAP_USER) {
            alert('Please fill in required fields');
            return;
        }
        await onLogin(config);
    };

    return (
        <section className="card config-card">
            <h2>SAP Connection</h2>
            <div className="form-group">
                <label>SAP URL</label>
                <input type="text" id="sap-url" placeholder="https://example.com" value={config.SAP_URL} onChange={handleChange} />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Client</label>
                    <input type="text" id="sap-client" placeholder="100" value={config.SAP_CLIENT} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>User</label>
                    <input type="text" id="sap-user" placeholder="User" value={config.SAP_USER} onChange={handleChange} />
                </div>
            </div>
            <div className="form-group">
                <label>Password</label>
                <input type="password" id="sap-password" placeholder="********" value={config.SAP_PASSWORD} onChange={handleChange} />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>HTTP Proxy (Optional)</label>
                    <input type="text" id="http-proxy" placeholder="http://proxy:8080" value={config.HTTP_PROXY} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>No Proxy (Optional)</label>
                    <input type="text" id="no-proxy" placeholder="localhost, .internal" value={config.NO_PROXY} onChange={handleChange} />
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Language</label>
                    <input type="text" id="sap-language" value={config.SAP_LANGUAGE} onChange={handleChange} />
                </div>
                <div className="form-group checkbox-group">
                    <input type="checkbox" id="skip-ssl" checked={skipSSL} onChange={handleCheckbox} />
                    <label htmlFor="skip-ssl">Skip SSL Verify</label>
                </div>
            </div>
            <button id="btn-login" className="btn-primary" onClick={handleLogin} disabled={isLoading}>
                {isLoading ? 'Connecting...' : 'Connect to SAP'}
            </button>
        </section>
    );
};
