#!/usr/bin/env node

import { config } from 'dotenv';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode
} from "@modelcontextprotocol/sdk/types.js";
import { ADTClient, session_types } from "abap-adt-api";
import path from 'path';
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { AuthHandlers } from './handlers/AuthHandlers.js';
import { TransportHandlers } from './handlers/TransportHandlers.js';
import { ObjectHandlers } from './handlers/ObjectHandlers.js';
import { ClassHandlers } from './handlers/ClassHandlers.js';
import { CodeAnalysisHandlers } from './handlers/CodeAnalysisHandlers.js';
import { ObjectLockHandlers } from './handlers/ObjectLockHandlers.js';
import { ObjectSourceHandlers } from './handlers/ObjectSourceHandlers.js';
import { ObjectDeletionHandlers } from './handlers/ObjectDeletionHandlers.js';
import { ObjectManagementHandlers } from './handlers/ObjectManagementHandlers.js';
import { ObjectRegistrationHandlers } from './handlers/ObjectRegistrationHandlers.js';
import { NodeHandlers } from './handlers/NodeHandlers.js';
import { DiscoveryHandlers } from './handlers/DiscoveryHandlers.js';
import { UnitTestHandlers } from './handlers/UnitTestHandlers.js';
import { PrettyPrinterHandlers } from './handlers/PrettyPrinterHandlers.js';
import { GitHandlers } from './handlers/GitHandlers.js';
import { DdicHandlers } from './handlers/DdicHandlers.js';
import { ServiceBindingHandlers } from './handlers/ServiceBindingHandlers.js';
import { QueryHandlers } from './handlers/QueryHandlers.js';
import { FeedHandlers } from './handlers/FeedHandlers.js';
import { DebugHandlers } from './handlers/DebugHandlers.js';
import { RenameHandlers } from './handlers/RenameHandlers.js';
import { AtcHandlers } from './handlers/AtcHandlers.js';
import { TraceHandlers } from './handlers/TraceHandlers.js';
import { RefactorHandlers } from './handlers/RefactorHandlers.js';
import { RevisionHandlers } from './handlers/RevisionHandlers.js';

process.env.NO_PROXY = process.env.NO_PROXY || 'localhost,127.0.0.1,hc1srv02,.bosch.com';
process.env.no_proxy = process.env.NO_PROXY;
process.env.HTTP_PROXY = '';
process.env.HTTPS_PROXY = '';

config({ path: path.resolve(__dirname, '../.env') });

export class AbapAdtServer extends Server {
  private adtClient!: ADTClient;
  private authHandlers!: AuthHandlers;
  private transportHandlers!: TransportHandlers;
  private objectHandlers!: ObjectHandlers;
  private classHandlers!: ClassHandlers;
  private codeAnalysisHandlers!: CodeAnalysisHandlers;
  private objectLockHandlers!: ObjectLockHandlers;
  private objectSourceHandlers!: ObjectSourceHandlers;
  private objectDeletionHandlers!: ObjectDeletionHandlers;
  private objectManagementHandlers!: ObjectManagementHandlers;
  private objectRegistrationHandlers!: ObjectRegistrationHandlers;
  private nodeHandlers!: NodeHandlers;
  private discoveryHandlers!: DiscoveryHandlers;
  private unitTestHandlers!: UnitTestHandlers;
  private prettyPrinterHandlers!: PrettyPrinterHandlers;
  private gitHandlers!: GitHandlers;
  private ddicHandlers!: DdicHandlers;
  private serviceBindingHandlers!: ServiceBindingHandlers;
  private queryHandlers!: QueryHandlers;
  private feedHandlers!: FeedHandlers;
  private debugHandlers!: DebugHandlers;
  private renameHandlers!: RenameHandlers;
  private atcHandlers!: AtcHandlers;
  private traceHandlers!: TraceHandlers;
  private refactorHandlers!: RefactorHandlers;
  private revisionHandlers!: RevisionHandlers;

  constructor() {
    super(
      {
        name: "mcp-abap-abap-adt-api",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initial config from environment
    const config = {
      SAP_URL: process.env.SAP_URL || '',
      SAP_USER: process.env.SAP_USER || '',
      SAP_PASSWORD: process.env.SAP_PASSWORD || '',
      SAP_CLIENT: process.env.SAP_CLIENT || '',
      SAP_LANGUAGE: process.env.SAP_LANGUAGE || ''
    };

    // Environment variables checking is now optional to allow login via parameters
    const missingVars = ['SAP_URL', 'SAP_USER', 'SAP_PASSWORD'].filter(v => !process.env[v]);
    if (missingVars.length > 0) {
      console.error(`Note: Missing environment variables: ${missingVars.join(', ')}. Waiting for login parameters.`);
    }

    this.adtClient = new ADTClient(
      config.SAP_URL,
      config.SAP_USER,
      config.SAP_PASSWORD,
      config.SAP_CLIENT,
      config.SAP_LANGUAGE
    );
    this.adtClient.stateful = session_types.stateful

    this.initializeHandlers(this.adtClient);
  }

  private initializeHandlers(client: ADTClient) {
    // Initialize handlers
    this.authHandlers = new AuthHandlers(client, this.reLogin.bind(this));
    this.transportHandlers = new TransportHandlers(client);
    this.objectHandlers = new ObjectHandlers(client);
    this.classHandlers = new ClassHandlers(client);
    this.codeAnalysisHandlers = new CodeAnalysisHandlers(client);
    this.objectLockHandlers = new ObjectLockHandlers(client);
    this.objectSourceHandlers = new ObjectSourceHandlers(client);
    this.objectDeletionHandlers = new ObjectDeletionHandlers(client);
    this.objectManagementHandlers = new ObjectManagementHandlers(client);
    this.objectRegistrationHandlers = new ObjectRegistrationHandlers(client);
    this.nodeHandlers = new NodeHandlers(client);
    this.discoveryHandlers = new DiscoveryHandlers(client);
    this.unitTestHandlers = new UnitTestHandlers(client);
    this.prettyPrinterHandlers = new PrettyPrinterHandlers(client);
    this.gitHandlers = new GitHandlers(client);
    this.ddicHandlers = new DdicHandlers(client);
    this.serviceBindingHandlers = new ServiceBindingHandlers(client);
    this.queryHandlers = new QueryHandlers(client);
    this.feedHandlers = new FeedHandlers(client);
    this.debugHandlers = new DebugHandlers(client);
    this.renameHandlers = new RenameHandlers(client);
    this.atcHandlers = new AtcHandlers(client);
    this.traceHandlers = new TraceHandlers(client);
    this.refactorHandlers = new RefactorHandlers(client);
    this.revisionHandlers = new RevisionHandlers(client);


    // Setup tool handlers
    this.setupToolHandlers();
  }

  private serializeResult(result: any) {
    try {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
          )
        }]
      };
    } catch (error) {
      return this.handleError(new McpError(
        ErrorCode.InternalError,
        'Failed to serialize result'
      ));
    }
  }

  private handleError(error: unknown) {
    if (!(error instanceof Error)) {
      error = new Error(String(error));
    }
    if (error instanceof McpError) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: error.message,
            code: error.code
          })
        }],
        isError: true
      };
    }
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: 'Internal server error',
          code: ErrorCode.InternalError
        })
      }],
      isError: true
    };
  }

  private setupToolHandlers() {
    this.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          ...this.authHandlers.getTools(),
          ...this.transportHandlers.getTools(),
          ...this.objectHandlers.getTools(),
          ...this.classHandlers.getTools(),
          ...this.codeAnalysisHandlers.getTools(),
          ...this.objectLockHandlers.getTools(),
          ...this.objectSourceHandlers.getTools(),
          ...this.objectDeletionHandlers.getTools(),
          ...this.objectManagementHandlers.getTools(),
          ...this.objectRegistrationHandlers.getTools(),
          ...this.nodeHandlers.getTools(),
          ...this.discoveryHandlers.getTools(),
          ...this.unitTestHandlers.getTools(),
          ...this.prettyPrinterHandlers.getTools(),
          ...this.gitHandlers.getTools(),
          ...this.ddicHandlers.getTools(),
          ...this.serviceBindingHandlers.getTools(),
          ...this.queryHandlers.getTools(),
          ...this.feedHandlers.getTools(),
          ...this.debugHandlers.getTools(),
          ...this.renameHandlers.getTools(),
          ...this.atcHandlers.getTools(),
          ...this.traceHandlers.getTools(),
          ...this.refactorHandlers.getTools(),
          ...this.revisionHandlers.getTools(),
          {
            name: 'healthcheck',
            description: 'Check server health and connectivity',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]
      };
    });

    this.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        let result: any;

        switch (request.params.name) {
          case 'login':
          case 'logout':
          case 'dropSession':
            result = await this.authHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'transportInfo':
          case 'createTransport':
          case 'hasTransportConfig':
          case 'transportConfigurations':
          case 'getTransportConfiguration':
          case 'setTransportsConfig':
          case 'createTransportsConfig':
          case 'userTransports':
          case 'transportsByConfig':
          case 'transportDelete':
          case 'transportRelease':
          case 'transportSetOwner':
          case 'transportAddUser':
          case 'systemUsers':
          case 'transportReference':
            result = await this.transportHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'lock':
          case 'unLock':
            result = await this.objectLockHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'objectStructure':
          case 'searchObject':
          case 'findObjectPath':
          case 'objectTypes':
          case 'reentranceTicket':
            result = await this.objectHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'classIncludes':
          case 'classComponents':
            result = await this.classHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'syntaxCheckCode':
          case 'syntaxCheckCdsUrl':
          case 'codeCompletion':
          case 'findDefinition':
          case 'usageReferences':
          case 'syntaxCheckTypes':
          case 'codeCompletionFull':
          case 'runClass':
          case 'codeCompletionElement':
          case 'usageReferenceSnippets':
          case 'fixProposals':
          case 'fixEdits':
          case 'fragmentMappings':
          case 'abapDocumentation':
            result = await this.codeAnalysisHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'getObjectSource':
          case 'setObjectSource':
            result = await this.objectSourceHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'deleteObject':
            result = await this.objectDeletionHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'activateObjects':
          case 'activateByName':
          case 'inactiveObjects':
            result = await this.objectManagementHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'objectRegistrationInfo':
          case 'validateNewObject':
          case 'createObject':
            result = await this.objectRegistrationHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'nodeContents':
          case 'mainPrograms':
            result = await this.nodeHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'featureDetails':
          case 'collectionFeatureDetails':
          case 'findCollectionByUrl':
          case 'loadTypes':
          case 'adtDiscovery':
          case 'adtCoreDiscovery':
          case 'adtCompatibiliyGraph':
            result = await this.discoveryHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'unitTestRun':
          case 'unitTestEvaluation':
          case 'unitTestOccurrenceMarkers':
          case 'createTestInclude':
            result = await this.unitTestHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'prettyPrinterSetting':
          case 'setPrettyPrinterSetting':
          case 'prettyPrinter':
            result = await this.prettyPrinterHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'gitRepos':
          case 'gitExternalRepoInfo':
          case 'gitCreateRepo':
          case 'gitPullRepo':
          case 'gitUnlinkRepo':
          case 'stageRepo':
          case 'pushRepo':
          case 'checkRepo':
          case 'remoteRepoInfo':
          case 'switchRepoBranch':
            result = await this.gitHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'annotationDefinitions':
          case 'ddicElement':
          case 'ddicRepositoryAccess':
          case 'packageSearchHelp':
            result = await this.ddicHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'publishServiceBinding':
          case 'unPublishServiceBinding':
          case 'bindingDetails':
            result = await this.serviceBindingHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'tableContents':
          case 'runQuery':
            result = await this.queryHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'feeds':
          case 'dumps':
            result = await this.feedHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'debuggerListeners':
          case 'debuggerListen':
          case 'debuggerDeleteListener':
          case 'debuggerSetBreakpoints':
          case 'debuggerDeleteBreakpoints':
          case 'debuggerAttach':
          case 'debuggerSaveSettings':
          case 'debuggerStackTrace':
          case 'debuggerVariables':
          case 'debuggerChildVariables':
          case 'debuggerStep':
          case 'debuggerGoToStack':
          case 'debuggerSetVariableValue':
            result = await this.debugHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'renameEvaluate':
          case 'renamePreview':
          case 'renameExecute':
            result = await this.renameHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'atcCustomizing':
          case 'atcCheckVariant':
          case 'createAtcRun':
          case 'atcWorklists':
          case 'atcUsers':
          case 'atcExemptProposal':
          case 'atcRequestExemption':
          case 'isProposalMessage':
          case 'atcContactUri':
          case 'atcChangeContact':
            result = await this.atcHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'tracesList':
          case 'tracesListRequests':
          case 'tracesHitList':
          case 'tracesDbAccess':
          case 'tracesStatements':
          case 'tracesSetParameters':
          case 'tracesCreateConfiguration':
          case 'tracesDeleteConfiguration':
          case 'tracesDelete':
            result = await this.traceHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'extractMethodEvaluate':
          case 'extractMethodPreview':
          case 'extractMethodExecute':
            result = await this.refactorHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'revisions':
            result = await this.revisionHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'healthcheck':
            result = { status: 'healthy', timestamp: new Date().toISOString() };
            break;
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        }

        return this.serializeResult(result);
      } catch (error) {
        return this.handleError(error);
      }
    });
  }

  async reLogin(config: any) {
    const newConfig = {
      SAP_URL: config.SAP_URL || process.env.SAP_URL || '',
      SAP_USER: config.SAP_USER || process.env.SAP_USER || '',
      SAP_PASSWORD: config.SAP_PASSWORD || process.env.SAP_PASSWORD || '',
      SAP_CLIENT: config.SAP_CLIENT || process.env.SAP_CLIENT || '',
      SAP_LANGUAGE: config.SAP_LANGUAGE || process.env.SAP_LANGUAGE || ''
    };

    if (config.NODE_TLS_REJECT_UNAUTHORIZED) process.env.NODE_TLS_REJECT_UNAUTHORIZED = config.NODE_TLS_REJECT_UNAUTHORIZED;
    if (config.NO_PROXY) {
      process.env.NO_PROXY = config.NO_PROXY;
      process.env.no_proxy = config.NO_PROXY;
    }

    this.adtClient = new ADTClient(
      newConfig.SAP_URL,
      newConfig.SAP_USER,
      newConfig.SAP_PASSWORD,
      newConfig.SAP_CLIENT,
      newConfig.SAP_LANGUAGE
    );
    this.adtClient.stateful = session_types.stateful;

    // Re-initialize handlers with new client
    this.initializeHandlers(this.adtClient);

    // Attempt login with new client to verify and establish session
    return await this.adtClient.login();
  }

  async run() {
    const args = process.argv.slice(2);
    const forceStdio = args.includes('--stdio');

    if (process.env.PORT && !forceStdio) {
      const app = express();
      app.use(cors());

      // Serve static files from 'public' directory
      app.use(express.static(path.join(__dirname, '../public')));

      const port = process.env.PORT;

      const sessions = new Map<string, { server: AbapAdtServer, transport: SSEServerTransport }>();

      app.get('/sse', async (req, res) => {
        const sessionId = uuidv4();
        const transport = new SSEServerTransport(`/messages?sessionId=${sessionId}`, res);
        const server = new AbapAdtServer();

        sessions.set(sessionId, { server, transport });

        console.error(`New session: ${sessionId}`);

        res.on('close', () => {
          console.error(`Session closed: ${sessionId}`);
          sessions.delete(sessionId);
        });

        await server.connect(transport);
      });

      app.post('/messages', async (req, res) => {
        const sessionId = req.query.sessionId as string;
        if (!sessionId) {
          res.status(400).send("Missing sessionId");
          return;
        }

        const session = sessions.get(sessionId);

        if (!session) {
          res.status(404).send("Session not found");
          return;
        }

        await session.transport.handlePostMessage(req, res);
      });

      app.listen(port, () => {
        console.error(`MCP Server running on port ${port}`);
      });
    } else {
      const transport = new StdioServerTransport();
      await this.connect(transport);
      console.error('MCP ABAP ADT API server running on stdio');

      // Handle shutdown
      process.on('SIGINT', async () => {
        await this.close();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await this.close();
        process.exit(0);
      });

      // Handle errors
      this.onerror = (error) => {
        console.error('[MCP Error]', error);
      };
    }
  }
}

// Create and run server instance
const server = new AbapAdtServer();
server.run().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
