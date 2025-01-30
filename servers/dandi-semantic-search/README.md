# DANDI Semantic Search MCP Server

This MCP server provides semantic search functionality for DANDI datasets.

This is based on embedding vectors for [these summaries](https://github.com/magland/ai_generated_dandiset_summaries). Right now there is no mechanism to automatically update the embeddings based on new dandisets being added or dandisets being updated.

## Overview

The server connects to the DANDI Semantic Search API endpoint to find datasets based on natural language queries. It returns a list of DANDI dataset IDs ordered by relevance to the query.

## Configuration

Add the following to your MCP settings:

```json
{
  "mcpServers": {
    "dandi-semantic-search": {
      "command": "node",
      "args": ["/path/to/dandi-semantic-search/build/index.js"],
      "env": {
        "DANDI_SEMANTIC_SEARCH_API_KEY": "<GET SECRET FROM JFM>"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Available Tools

### search_datasets

Search DANDI datasets using natural language queries.

#### Parameters

- `query` (string): Natural language search query (e.g., "decision making rodent")

#### Returns

JSON object containing an array of DANDI dataset IDs ordered by relevance:

```json
{
  "similarDandisetIds": ["000952", "000045", ...]
}
```

## Usage Example

```typescript
const result = await useMcpTool("dandi-semantic-search", "search_datasets", {
  query: "decision making rodent"
});

// Returns dataset IDs ordered by relevance
console.log(result.similarDandisetIds);
```

## Building

```bash
npm install
npm run build
```

## Running

```bash
npm start
