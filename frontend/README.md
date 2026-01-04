# VLESS VPN Config Manager Frontend

A modern Next.js web interface for managing VLESS VPN server configurations on Oracle Cloud.

## Features

- **Server Monitoring**: Real-time server status and V2Ray service monitoring
- **Config Management**: View server configuration and client details
- **VLESS URI Generator**: One-click generation and copying of VLESS URIs for V2Box
- **Config Downloader**: Download V2Box-compatible JSON configuration files
- **Connectivity Testing**: Automatic ping tests with visual status indicators
- **Dark Mode**: Modern UI with dark theme support
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp env-example.txt .env.local
   # Edit .env.local with your server details
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** to `http://localhost:3000`

## Environment Configuration

Create a `.env.local` file with your server connection details:

```env
# Server Connection Details
SERVER_IP=217.142.186.18
SSH_KEY=~/.ssh/oracle-vless-key.pem
SSH_USER=ubuntu
```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/              # Next.js API routes
│   │   │   ├── server-status/ # Server status endpoint
│   │   │   ├── config/        # Config reading endpoint
│   │   │   ├── uris/          # VLESS URI generation
│   │   │   ├── download/      # Config download endpoint
│   │   │   └── ping/          # Connectivity testing
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Main dashboard
│   │   └── providers.tsx      # React Query provider
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── dashboard/         # Dashboard components
│   │   └── uris/              # URI management
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and API hooks
│   └── types/                 # TypeScript type definitions
└── README.md
```

## API Endpoints

### GET /api/server-status
Returns server status information including SSH connection, V2Ray service status, and system info.

### GET /api/config
Retrieves the current V2Ray server configuration and client details.

### GET /api/uris?clientNames=name1,name2,name3
Generates VLESS URIs for all clients. Optional custom client names.

### GET /api/download?client=index
Downloads a specific client configuration as JSON.

### GET /api/ping
Runs connectivity tests (ping, WebSocket, port checks) and returns results.

## Technology Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query (TanStack Query)
- **Icons**: Lucide React
- **Forms**: React Hook Form (planned for future config editing)
- **Backend**: Next.js API routes with SSH integration

## Security Notes

- SSH keys are used for secure server communication
- No sensitive data is stored on the frontend
- All API calls require valid SSH access to your server
- Environment variables should be kept secure

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Adding New Features

1. **API Routes**: Add new endpoints in `src/app/api/`
2. **Components**: Create reusable components in `src/components/`
3. **Hooks**: Add custom hooks in `src/hooks/`
4. **Types**: Define new types in `src/types/`

## Deployment

The frontend can be deployed to Vercel, Netlify, or any platform supporting Next.js:

```bash
npm run build
npm run start
```

Make sure to set environment variables in your deployment platform.

## Contributing

1. Ensure SSH access to your VLESS server
2. Test all API endpoints
3. Follow the existing code patterns
4. Update this README for any new features

## License

This project is part of the VLESS VPN setup and follows the same licensing terms.