# Development Guide

## Running the Application

### For Active Development (with auto-restart)
```bash
npm run dev
```
- Uses nodemon with file watching
- Automatically restarts when you modify source files
- **Note**: Will interrupt ongoing analysis if server restarts

### For Testing Analysis (stable server)
```bash
npm run dev:stable
```
- Runs server without auto-restart
- Use this when testing full repository analysis
- Server won't restart when you modify files
- Better for debugging long-running operations

## Avoiding EventSource Connection Issues

### The Problem
When nodemon restarts the server during an active analysis:
- EventSource connection gets reset
- Browser shows: `ERR_CONNECTION_RESET`
- Analysis gets interrupted
- Progress is lost

### The Solution

#### Option 1: Use Stable Development Server
```bash
# Stop current server (Ctrl+C)
npm run dev:stable
```

#### Option 2: Configure File Watching
The `nodemon.json` config now ignores:
- All files in `logs/` directory
- `*.log` files
- Test files
- Dist directory

#### Option 3: Avoid Editing During Analysis
- Start your repository analysis
- Avoid editing source files until analysis completes
- Make changes between analysis runs

## Log Files Management

### Log Directory Structure
```
logs/
├── combined.log          # All logs in JSON format
├── error.log            # Error logs only
└── agent-io/           # Detailed I/O logs
    ├── architecture-inference-agent-analyze-input-*.json
    ├── architecture-inference-agent-analyze-output-*.json
    ├── code-flow-agent-analyze-input-*.json
    └── code-flow-agent-analyze-output-*.json
```

### Log File Cleanup
Log files can grow large during development:
```bash
# Clear all logs
rm -rf logs/*

# Clear just I/O logs
rm -rf logs/agent-io/*

# Clear just winston logs
rm logs/*.log
```

## Development Workflow

### 1. Code Changes
```bash
# Use auto-restart for quick development
npm run dev

# Make your changes
# Test basic functionality
```

### 2. Testing Analysis
```bash
# Stop auto-restart server
Ctrl+C

# Start stable server
npm run dev:stable

# Run full repository analysis
# Check detailed logs in logs/agent-io/
```

### 3. Debugging
```bash
# Check application logs
tail -f logs/combined.log

# Check error logs
tail -f logs/error.log

# Check specific agent I/O
ls logs/agent-io/
cat logs/agent-io/architecture-inference-agent-analyze-input-*.json
```

## Environment Variables

### Development
```bash
# Set detailed logging
LOG_LEVEL=debug

# Disable I/O logging for performance
DISABLE_AGENT_IO_LOGGING=true

# Use production mode (no console colors)
NODE_ENV=production
```

### Example .env file
```
GOOGLE_API_KEY=your_gemini_api_key_here
LOG_LEVEL=info
NODE_ENV=development
PORT=3000
```

## Troubleshooting

### Server Won't Start
```bash
# Check if port is in use
lsof -i :3000

# Kill existing process
pkill -f "node.*src/index.ts"

# Restart clean
npm run dev:stable
```

### Analysis Fails Immediately
1. Check error logs: `tail -f logs/error.log`
2. Verify API key is set: `echo $GOOGLE_API_KEY`
3. Check input data in `logs/agent-io/`
4. Test with simple repository first

### EventSource Connection Issues
1. Use `npm run dev:stable` instead of `npm run dev`
2. Refresh browser page after server restart
3. Check browser console for connection errors
4. Verify server is responding: `curl http://localhost:3000/health`

### Large Log Files
```bash
# Monitor log file sizes
du -sh logs/*

# Rotate logs manually
mv logs/combined.log logs/combined.log.old
touch logs/combined.log

# Clean up I/O logs older than 1 day
find logs/agent-io/ -name "*.json" -mtime +1 -delete
```

## Performance Tips

### For Large Repositories
- Use `DISABLE_AGENT_IO_LOGGING=true` to reduce disk I/O
- Monitor memory usage: `top -p $(pgrep -f "node.*src/index.ts")`
- Consider increasing Node.js memory: `node --max-old-space-size=4096 src/index.ts`

### For Development Speed
- Use `npm run dev` for quick iterations
- Use `npm run dev:stable` for testing complete flows
- Clear logs regularly to improve I/O performance
- Use `npm run typecheck` before committing changes

## Testing Different Repository Types

### Small Test Repositories
- Personal GitHub repos with <50 files
- Quick analysis for testing changes

### Medium Repositories  
- Popular open source projects (100-500 files)
- Good for testing architecture detection

### Large Repositories
- Major frameworks (React, Angular, etc.)
- Test performance and memory usage
- May require stable server mode

This guide helps you develop efficiently while avoiding common pitfalls with the EventSource connections and auto-restart issues.