import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';

export class AuthHandlers extends BaseHandler {
  private proxyAgent: any;

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
          required: ['SAP_URL', 'SAP_USER']
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
        // [PROBE] Run connectivity probe with user-provided URL before login
        // This helps debug 405 errors by checking which paths are accessible
        await this.runConnectivityProbe(args.SAP_URL, this.adtclient, args.SAP_CLIENT);

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

  // Method to receive proxy agent from main server
  public setProxyAgent(agent: any) {
    this.proxyAgent = agent;
    console.log("[AuthHandlers] Proxy agent received.");
  }

  // Probe method to check accessibility of common SAP paths
  private async runConnectivityProbe(baseUrl: string, adtClient: any, sapClient?: string) {
    if (!baseUrl) return;
    console.log(`[PROBE] Starting connectivity probe to ${baseUrl}...`);

    // Prefer explicitly passed proxy agent, fall back to brute-force extraction
    let agent: any = this.proxyAgent;

    if (!agent) {
      try {
        // @ts-ignore
        if (adtClient && adtClient.h && adtClient.h.httpclient && adtClient.h.httpclient.axios) {
          // @ts-ignore
          agent = adtClient.h.httpclient.axios.defaults.httpAgent;
        }
      } catch (e) {
        console.warn("[PROBE] Could not retrieve proxy agent from ADT Client, probe might fail if proxy is required.");
      }
    }

    if (agent) {
      console.log("[PROBE] Using Proxy Agent for probe requests.");
    } else {
      console.warn("[PROBE] No Proxy Agent found! Probe will likely fail with ENOTFOUND.");
    }

    const paths = [
      '/sap/public/ping',
      '/sap/bc/ping',
      '/sap/bc/adt/discovery',
      '/sap/bc/adt/compatibility/graph',
      '/sap/bc/adt/core/discovery',
      '/sap/bc/adt/oo/classes',
      '/sap/bc/adt/programs/programs',
      '/sap/public/info',
    ];

    const axios = require('axios');
    const methods = ['GET', 'POST', 'HEAD', 'OPTIONS'];

    // Log the exact URL and Port being used
    console.log(`[PROBE] Target Base URL: '${baseUrl}'`);

    for (const path of paths) {
      for (const method of methods) {
        try {
          let url = `${baseUrl}${path}`;
          if (sapClient) {
            const urlObj = new URL(url);
            urlObj.searchParams.set('sap-client', sapClient);
            url = urlObj.toString();
          }
          console.log(`[PROBE] Checking ${method} ${url} ...`);
          const res = await axios({
            method: method,
            url: url,
            httpsAgent: agent,
            httpAgent: agent,
            timeout: 5000, // Reduced timeout for faster loop
            validateStatus: () => true
          });

          console.log(`[PROBE] ${method} ${path} -> Status: ${res.status} ${res.statusText}`);

          // [AUTO-DISCOVERY] If we find a reachable endpoint (200 OK or 401/403 Auth Error but reachable)
          // We consider this a candidate for login.
          if (res.status === 200 || res.status === 401 || res.status === 403) {
            console.log(`[PROBE] HIT! Found accessible endpoint: ${path}`);
            process.env.MCP_ABAP_LOGIN_PATH = path;
            console.log(`[PROBE] Auto-configured login path to: ${process.env.MCP_ABAP_LOGIN_PATH}`);
            return; // Stop probing, we found a winner
          }

          // Probe logic for failures
          if (res.status === 405 || res.status === 500) {
            // Just log brief info for 405 to keep logs clean during auto-discovery
            if (res.headers['allow']) {
              console.log(`[PROBE] Allowed Methods for ${path}: ${res.headers['allow']}`);
            }
          }
        } catch (err: any) {
          console.log(`[PROBE] ${method} ${path} -> FAILED: ${err.message}`);
        }
      }
    }
    console.log(`[PROBE] Probe completed. No specific working endpoint configuration applied.`);
  }
}
