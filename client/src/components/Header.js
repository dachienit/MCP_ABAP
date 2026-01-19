"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = void 0;
const react_1 = __importDefault(require("react"));
const Header = ({ isConnected }) => {
    return (<header>
            <div className="logo">MCP ABAP</div>
            <div className="status-indicator">
                <span id="connection-status" className={`status-dot ${isConnected ? 'connected' : ''}`}></span>
                <span id="status-text">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
        </header>);
};
exports.Header = Header;
