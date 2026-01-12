import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';

export class AuthHandlers extends BaseHandler {
  constructor(adtclient: any, private readonly onLogin?: (config: any) => Promise<any>) {
    super(adtclient);
  }

  getTools(): ToolDefinition[] {
    return [
      {
        name: 'login',
        description: 'Authenticate with ABAP system',
        inputSchema: {
          type: 'object',
          properties: {
            SAP_URL: { type: 'string', description: 'SAP System URL' },
            SAP_USER: { type: 'string', description: 'SAP Username' },
            SAP_PASSWORD: { type: 'string', description: 'SAP Password' },
            SAP_CLIENT: { type: 'string', description: 'SAP Client' },
            SAP_LANGUAGE: { type: 'string', description: 'Language' },
            NODE_TLS_REJECT_UNAUTHORIZED: { type: 'string', description: '0 to disable SSL verification' },
            NO_PROXY: { type: 'string', description: 'No proxy list' }
          },
          required: ['SAP_URL', 'SAP_USER', 'SAP_PASSWORD']
        }
      },
      {
        name: 'logout',
        description: 'Terminate ABAP session',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'dropSession',
        description: 'Clear local session cache',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  async handle(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case 'login':
        return this.handleLogin(args);
      case 'logout':
        return this.handleLogout(args);
      case 'dropSession':
        return this.handleDropSession(args);
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown auth tool: ${toolName}`);
    }
  }

  private async handleLogin(args: any) {
    const startTime = performance.now();
    try {
      if (args && args.SAP_URL && this.onLogin) {
        await this.onLogin(args);
        this.trackRequest(startTime, true);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ message: "Login configuration updated and session initialized." })
            }
          ]
        };
      }

      const loginResult = await this.adtclient.login();
      this.trackRequest(startTime, true);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(loginResult)
          }
        ]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Login failed: ${error.message || 'Unknown error'}`
      );
    }
  }

  private async handleLogout(args: any) {
    const startTime = performance.now();
    try {
      await this.adtclient.logout();
      this.trackRequest(startTime, true);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ status: 'Logged out successfully' })
          }
        ]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Logout failed: ${error.message || 'Unknown error'}`
      );
    }
  }

  private async handleDropSession(args: any) {
    const startTime = performance.now();
    try {
      await this.adtclient.dropSession();
      this.trackRequest(startTime, true);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ status: 'Session cleared' })
          }
        ]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Drop session failed: ${error.message || 'Unknown error'}`
      );
    }
  }
}
