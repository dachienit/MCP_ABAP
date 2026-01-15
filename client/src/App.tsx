import { useState } from 'react';
import { useMCP } from './hooks/useMCP';
import { Console } from './components/Console';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { ToolRunner } from './components/ToolRunner';
import type { LoginConfig } from './types';

function App() {
  const { sessionId, isConnected, logs, callTool, login, clearLogs } = useMCP();
  const [user, setUser] = useState('');

  const handleLogin = async (config: LoginConfig) => {
    setUser(config.SAP_USER);
    await login(config);
  };

  return (
    <div className="app-container">
      <Header isConnected={isConnected} sessionId={sessionId} />

      <main>
        <Login onLogin={handleLogin} />
        <ToolRunner onCallTool={callTool} user={user} />
      </main>

      <Console logs={logs} onClear={clearLogs} />
    </div>
  );
}

export default App;
