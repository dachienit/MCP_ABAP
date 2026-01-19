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
exports.ToolRunner = void 0;
const react_1 = __importStar(require("react"));
const ToolRunner = ({ onCallTool, user }) => {
    const [toolName, setToolName] = (0, react_1.useState)('');
    const [toolArgs, setToolArgs] = (0, react_1.useState)('');
    const handleRun = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!toolName) {
            alert('Please enter a tool name');
            return;
        }
        try {
            const args = toolArgs ? JSON.parse(toolArgs) : {};
            yield onCallTool(toolName, args);
        }
        catch (e) {
            alert('Invalid JSON arguments');
        }
    });
    return (<section className="card tools-card">
            <h2>Test Tools</h2>
            <div className="tool-actions">
                <button className="btn-secondary" onClick={() => onCallTool('healthcheck', {})}>Checking Health</button>
                <button className="btn-secondary" onClick={() => onCallTool('discovery/featureDetails', {})}>System Features</button>
                <button className="btn-secondary" onClick={() => onCallTool('transport/userTransports', { user })}>My Transports</button>
            </div>

            <h3>Custom Tool Call</h3>
            <div className="form-group">
                <input type="text" id="tool-name" placeholder="Tool Name (e.g., object/searchObject)" value={toolName} onChange={(e) => setToolName(e.target.value)}/>
            </div>
            <div className="form-group">
                <textarea id="tool-args" placeholder='{"query": "zcl_test"}' rows={3} value={toolArgs} onChange={(e) => setToolArgs(e.target.value)}/>
            </div>
            <button id="btn-run" className="btn-primary" onClick={handleRun}>Run Tool</button>
        </section>);
};
exports.ToolRunner = ToolRunner;
