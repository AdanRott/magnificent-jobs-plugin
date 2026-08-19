# Runs the Magnificent Jobs MCP server over stdio by proxying to the hosted
# Streamable-HTTP endpoint (https://magnificentjobs.com/mcp). Used by Glama's
# build/introspection checks and by clients that only speak stdio.
FROM node:22-alpine
WORKDIR /app
COPY cli/ ./
ENTRYPOINT ["node", "bin/magnificentjobs.mjs", "mcp"]
