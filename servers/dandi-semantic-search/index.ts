#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

const API_KEY = process.env.DANDI_SEMANTIC_SEARCH_API_KEY;
if (!API_KEY) {
  throw new Error('DANDI_SEMANTIC_SEARCH_API_KEY environment variable is required');
}

const isValidSearchArgs = (
  args: any
): args is { query: string; limit?: number } =>
  typeof args === 'object' &&
  args !== null &&
  typeof args.query === 'string' &&
  (args.limit === undefined || (typeof args.limit === 'number' && args.limit > 0));

class DandiSemanticSearchServer {
  private server: Server;
  private axiosInstance;

  constructor() {
    this.server = new Server(
      {
        name: 'dandi-semantic-search',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      baseURL: 'https://dandi-semantic-search.vercel.app/api',
      headers: {
        'x-secret-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    this.setupHandlers();

    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'search_datasets',
          description: 'Perform semantic search on DANDI datasets',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query text',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results to return (default: 10)',
                minimum: 1,
              },
            },
            required: ['query'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'search_datasets') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      if (!isValidSearchArgs(request.params.arguments)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Invalid search arguments'
        );
      }

      try {
        const response = await this.axiosInstance.post('/semanticSearch', {
          query: request.params.arguments.query,
        });

        // Ensure we have an array of results
        const results = Array.isArray(response.data) ? response.data :
                       Array.isArray(response.data.similarDandisetIds) ? response.data.similarDandisetIds :
                       ["error-in-response"];

        // Extract the most relevant results (default: 10)
        const limit = request.params.arguments.limit ?? 10;
        const topResults = results.slice(0, limit);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(topResults, null, 2),
            },
          ],
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          return {
            content: [
              {
                type: 'text',
                text: `API error: ${
                  error.response?.data?.message ?? error.message
                }`,
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('DANDI Semantic Search MCP server running on stdio');
  }
}

const server = new DandiSemanticSearchServer();
server.run().catch(console.error);
