# VLESS Config Manager Frontend

A modern web interface for managing VLESS VPN configurations on your Oracle Cloud VPS server.

## Features

- **Real-time Server Monitoring**: View server status, V2Ray service status, and connection info
- **Configuration Management**: Create, edit, and delete VLESS client configurations
- **Ping Testing**: Automatic connectivity testing with color-coded status indicators
- **Export Options**: One-click VLESS URI copying and JSON config downloads
- **Modern UI**: Clean, responsive design with dark mode support
- **Toast Notifications**: User-friendly feedback for all operations

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **UI Components**: Custom components with Lucide React icons
- **State Management**: React hooks
- **Notifications**: React Hot Toast
- **SSH Integration**: Node-SSH for server communication

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment** (optional):
   Create a `.env.local` file with your VPS connection details:
   ```env
   VPS_HOST=your-server-ip
   VPS_USER=ubuntu
   SSH_KEY_PATH=/path/to/your/ssh/key
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** to `http://localhost:3000`

## API Endpoints

### Configurations
- `GET /api/configs` - Fetch all configurations
- `POST /api/configs` - Create new configuration
- `GET /api/configs/[id]` - Fetch single configuration
- `PUT /api/configs/[id]` - Update configuration
- `DELETE /api/configs/[id]` - Delete configuration

### Export
- `GET /api/export/uri/[id]` - Generate VLESS URI
- `GET /api/export/json/[id]` - Download JSON config

### Utilities
- `POST /api/ping` - Test connectivity
- `GET /api/server` - Get server status

## Security Notes

- SSH keys are handled securely on the server-side
- No sensitive information is exposed to the client
- All API routes validate input and sanitize commands
- Local development only (no authentication required)

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/              # Next.js API routes
│   │   ├── components/       # React components
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Main dashboard
│   ├── lib/                  # Utility libraries
│   │   ├── ssh.ts           # SSH connection management
│   │   ├── v2ray.ts         # V2Ray config parsing
│   │   ├── ping.ts          # Ping testing utilities
│   │   └── uri.ts           # VLESS URI generation
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
└── package.json
```

## Usage

1. **Server Setup**: Ensure your VLESS server is running on Oracle Cloud
2. **SSH Access**: Make sure your SSH key is properly configured
3. **Launch Frontend**: Start the development server
4. **Manage Configs**: Use the web interface to create, edit, and export configurations
5. **Monitor**: Keep track of server status and connection quality

## Troubleshooting

- **SSH Connection Issues**: Verify your SSH key path and server credentials
- **V2Ray Not Running**: Check server status and restart V2Ray if needed
- **Port Issues**: Ensure port 443 is accessible and not blocked by firewall
- **Permission Issues**: Make sure the SSH user has sudo access for V2Ray operations
