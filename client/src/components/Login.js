"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.Login = void 0;
const react_1 = __importStar(require("react"));
const Login = ({ onLogin, isLoading }) => {
    const [config, setConfig] = (0, react_1.useState)({
        SAP_URL: '',
        SAP_USER: '',
        SAP_PASSWORD: '',
        SAP_CLIENT: '100',
        SAP_LANGUAGE: 'EN',
        NODE_TLS_REJECT_UNAUTHORIZED: '1',
        HTTP_PROXY: '',
        NO_PROXY: ''
    });
    const [skipSSL, setSkipSSL] = (0, react_1.useState)(false);
    const handleChange = (e) => {
        const { id, value } = e.target;
        // Map id to config key (convert kebab-case to uppercase underscore if needed, or just handle manually)
        // The IDs in original HTML were sap-url, sap-user etc.
        // Let's use simple mapping or update state directly
        // Helper to map id to key
        let key = null;
        if (id === 'sap-url')
            key = 'SAP_URL';
        if (id === 'sap-user')
            key = 'SAP_USER';
        if (id === 'sap-password')
            key = 'SAP_PASSWORD';
        if (id === 'sap-client')
            key = 'SAP_CLIENT';
        if (id === 'sap-language')
            key = 'SAP_LANGUAGE';
        if (id === 'http-proxy')
            key = 'HTTP_PROXY';
        else if (id === 'no-proxy')
            key = 'NO_PROXY';
        if (key) {
            setConfig(prev => (Object.assign(Object.assign({}, prev), { [key]: value })));
        }
    };
    const handleCheckbox = (e) => {
        setSkipSSL(e.target.checked);
        setConfig(prev => (Object.assign(Object.assign({}, prev), { NODE_TLS_REJECT_UNAUTHORIZED: e.target.checked ? '0' : '1' })));
    };
    const handleLogin = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!config.SAP_URL || !config.SAP_USER || !config.SAP_PASSWORD) {
            alert('Please fill in required fields');
            return;
        }
        yield onLogin(config);
    });
    return (<section className="card config-card">
            <h2>SAP Connection</h2>
            <div className="form-group">
                <label>SAP URL</label>
                <input type="text" id="sap-url" placeholder="https://example.com" value={config.SAP_URL} onChange={handleChange}/>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Client</label>
                    <input type="text" id="sap-client" placeholder="100" value={config.SAP_CLIENT} onChange={handleChange}/>
                </div>
                <div className="form-group">
                    <label>User</label>
                    <input type="text" id="sap-user" placeholder="User" value={config.SAP_USER} onChange={handleChange}/>
                </div>
            </div>
            <div className="form-group">
                <label>Password</label>
                <input type="password" id="sap-password" placeholder="********" value={config.SAP_PASSWORD} onChange={handleChange}/>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>HTTP Proxy (Optional)</label>
                    <input type="text" id="http-proxy" placeholder="http://proxy:8080" value={config.HTTP_PROXY} onChange={handleChange}/>
                </div>
                <div className="form-group">
                    <label>No Proxy (Optional)</label>
                    <input type="text" id="no-proxy" placeholder="localhost, .internal" value={config.NO_PROXY} onChange={handleChange}/>
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Language</label>
                    <input type="text" id="sap-language" value={config.SAP_LANGUAGE} onChange={handleChange}/>
                </div>
                <div className="form-group checkbox-group">
                    <input type="checkbox" id="skip-ssl" checked={skipSSL} onChange={handleCheckbox}/>
                    <label htmlFor="skip-ssl">Skip SSL Verify</label>
                </div>
            </div>
            <button id="btn-login" className="btn-primary" onClick={handleLogin} disabled={isLoading}>
                {isLoading ? 'Connecting...' : 'Connect to SAP'}
            </button>
        </section>);
};
exports.Login = Login;
