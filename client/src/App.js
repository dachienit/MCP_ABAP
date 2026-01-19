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
const react_1 = require("react");
const useMCP_1 = require("./hooks/useMCP");
const Console_1 = require("./components/Console");
const Header_1 = require("./components/Header");
const Login_1 = require("./components/Login");
const ToolRunner_1 = require("./components/ToolRunner");
function App() {
    const { sessionId, isConnected, logs, callTool, login, clearLogs } = (0, useMCP_1.useMCP)();
    const [user, setUser] = (0, react_1.useState)('');
    const handleLogin = (config) => __awaiter(this, void 0, void 0, function* () {
        setUser(config.SAP_USER);
        yield login(config);
    });
    return (<div className="app-container">
      <Header_1.Header isConnected={isConnected} sessionId={sessionId}/>

      <main>
        <Login_1.Login onLogin={handleLogin}/>
        <ToolRunner_1.ToolRunner onCallTool={callTool} user={user}/>
      </main>

      <Console_1.Console logs={logs} onClear={clearLogs}/>
    </div>);
}
exports.default = App;
