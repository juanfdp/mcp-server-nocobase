#!/usr/bin/env node

import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {APIClient} from '@nocobase/sdk';
import {Converter} from 'openapi2mcptools';

const url = process.env.MCP_NOCOBASE_URL;
const token = process.env.MCP_NOCOBASE_TOKEN;

// Server setup
const server = new Server(
  {
    name: 'mcp-server-nocobase',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      logging: {},
    },
  },
);

const client = new APIClient({
  baseURL: url,
});
client.auth.token = token;

const res = await client.resource('swagger').get();
const apis = res.data;
const converter = new Converter({
  httpClient: client,
});
await converter.load(apis);
const tools = converter.getToolsList();
const toolCaller = converter.getToolsCaller();

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return await toolCaller(request);
});


const transport = new StdioServerTransport();
await server.connect(transport);

