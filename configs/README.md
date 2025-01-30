# MCP Server Configurations

This directory contains configuration templates and examples for the MCP servers.

## Configuration Format

Each server's configuration should be added to the VSCode settings file:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["path/to/server/build/index.js"],
      "env": {
        "API_KEY": "your-api-key"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Available Configurations

(Add server configurations as they are implemented)
