import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';

export class AuthHandlers extends BaseHandler {
  private httpProxyAgent: any;
  private httpsProxyAgent: any;

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
  public setProxyAgents(httpAgent: any, httpsAgent: any) {
    this.httpProxyAgent = httpAgent;
    this.httpsProxyAgent = httpsAgent;
    console.log("[AuthHandlers] Proxy agents received (HTTP + HTTPS).");
  }

  // Probe method to check accessibility of common SAP paths
  private async runConnectivityProbe(baseUrl: string, adtClient: any, sapClient?: string) {
    if (!baseUrl) return;
    console.log(`[PROBE] Starting connectivity probe to ${baseUrl}...`);

    let agent: any;
    const isHttps = baseUrl.toLowerCase().startsWith('https:');

    if (isHttps) {
      agent = this.httpsProxyAgent;
    } else {
      agent = this.httpProxyAgent;
    }

    // Fallback if not set explicitly via setProxyAgents (e.g. legacy or uninitialized)
    if (!agent) {
      try {
        // @ts-ignore
        if (adtClient && adtClient.h && adtClient.h.httpclient && adtClient.h.httpclient.axios) {
          // @ts-ignore
          // Try to guess from defaults
          if (isHttps) {
            // @ts-ignore
            agent = adtClient.h.httpclient.axios.defaults.httpsAgent;
          } else {
            // @ts-ignore
            agent = adtClient.h.httpclient.axios.defaults.httpAgent;
          }
        }
      } catch (e) {
        console.warn("[PROBE] Could not retrieve proxy agent from ADT Client fallback.");
      }
    }

    if (agent) {
      console.log(`[PROBE] Using ${isHttps ? 'HTTPS' : 'HTTP'} Proxy Agent for probe requests.`);
    } else {
      console.warn(`[PROBE] No ${isHttps ? 'HTTPS' : 'HTTP'} Proxy Agent found! Probe to ${baseUrl} might fail.`);
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

    // [DIAGNOSTIC] Add a control path to distinguish between SCC blocking (405/403) and SAP handling (404)
    paths.push('/sap/nonexistent_test_12345');

    let results: any[] = [];

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
            timeout: 5000,
            validateStatus: () => true,
            responseType: 'text', // Force text to avoid parsing issues with error bodies
            transformResponse: [(data: any) => data] // Do not parse JSON
          });

          console.log(`[PROBE] ${method} ${path} -> Status: ${res.status} ${res.statusText}`);
          results.push({ path, method, status: res.status });

          // [AUTO-DISCOVERY] Found accessible endpoint
          if ((res.status === 200 || res.status === 401 || res.status === 403) && path !== '/sap/nonexistent_test_12345') {
            console.log(`[PROBE] HIT! Found accessible endpoint: ${path}`);
            process.env.MCP_ABAP_LOGIN_PATH = path;
            console.log(`[PROBE] Auto-configured login path to: ${process.env.MCP_ABAP_LOGIN_PATH}`);
            return;
          }

          // Detail logging
          if (res.status === 405 || res.status === 500) {
            if (res.headers['allow']) {
              console.log(`[PROBE] Allowed Methods for ${path}: ${res.headers['allow']}`);
            }
            if (res.data) {
              console.log(`[PROBE] Body: ${res.data.substring(0, 500)}`);
            }
          }
        } catch (err: any) {
          console.log(`[PROBE] ${method} ${path} -> FAILED: ${err.message}`);
          results.push({ path, method, error: err.message });
        }
      }
    }

    // [DIAGNOSIS REPORT]
    console.log(`\n=== PROBE DIAGNOSIS ===`);
    const sccBlock = results.some(r => r.path.includes('nonexistent') && (r.status === 403 || r.status === 405));
    const sapReachable = results.some(r => r.path.includes('nonexistent') && r.status === 404);

    if (sccBlock) {
      console.log(`[CONCLUSION] Cloud Connector is BLANKET BLOCKING requests.`);
      console.log(`Reason: Even the non-existent path returned 403/405 instead of 404.`);
      console.log(`ACTION: Please check Cloud Connector Access Control. Verify 'Path and all sub-paths' is selected and Methods (GET/POST) are checked.`);
    } else if (sapReachable) {
      console.log(`[CONCLUSION] SAP Backend IS Reachable (404 confirmed).`);
      console.log(`Reason: The non-existent path returned 404 as expected.`);
      console.log(`Issue: The valid ADT paths are returning 405. This implies SAP ICF nodes are active but rejecting methods, OR intermediate filter.`);
    } else {
      console.log(`[CONCLUSION] Indeterminate. Check individual logs above.`);
    }
    console.log(`=======================\n`);
  }
}
