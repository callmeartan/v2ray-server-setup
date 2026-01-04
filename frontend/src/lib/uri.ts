// VLESS URI generation utilities

export interface VLESSUriOptions {
  uuid: string;
  host: string;
  port: number;
  name: string;
  path?: string;
  security?: 'none' | 'tls';
  type?: string;
}

/**
 * Generate a VLESS URI for client import
 */
export function generateVLESSUri(options: VLESSUriOptions): string {
  const {
    uuid,
    host,
    port,
    name,
    path = '/vless',
    security = 'none',
    type = 'ws',
  } = options;

  // Build the base URI
  let uri = `vless://${uuid}@${host}:${port}`;

  // Build query parameters
  const params: string[] = [];

  if (type !== 'tcp') {
    params.push(`type=${type}`);
  }

  if (security !== 'none') {
    params.push(`security=${security}`);
  }

  if (path !== '/') {
    params.push(`path=${encodeURIComponent(path)}`);
  }

  // Add host header for WebSocket
  if (type === 'ws') {
    params.push(`host=${encodeURIComponent(host)}`);
  }

  // Add query string if there are parameters
  if (params.length > 0) {
    uri += `?${params.join('&')}`;
  }

  // Add fragment (name)
  uri += `#${encodeURIComponent(name)}`;

  return uri;
}

/**
 * Parse a VLESS URI back into options
 */
export function parseVLESSUri(uri: string): VLESSUriOptions | null {
  try {
    // Remove the vless:// prefix
    if (!uri.startsWith('vless://')) {
      return null;
    }

    const withoutPrefix = uri.slice(8);

    // Split by # for fragment (name)
    const [mainPart, fragment] = withoutPrefix.split('#');
    const name = fragment ? decodeURIComponent(fragment) : '';

    // Parse the main part: uuid@host:port?query
    const [credentials, queryString] = mainPart.split('?');
    const [uuidHostPort] = credentials.split('@');

    if (!uuidHostPort || !credentials.includes('@')) {
      return null;
    }

    const [uuid, hostPort] = credentials.split('@');
    const [host, portStr] = hostPort.split(':');
    const port = parseInt(portStr, 10);

    if (!uuid || !host || isNaN(port)) {
      return null;
    }

    // Parse query parameters
    const params: Record<string, string> = {};
    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
          params[key] = decodeURIComponent(value);
        }
      });
    }

    return {
      uuid,
      host,
      port,
      name,
      path: params.path || '/vless',
      security: (params.security as 'none' | 'tls') || 'none',
      type: params.type || 'ws',
    };
  } catch (error) {
    console.error('Failed to parse VLESS URI:', error);
    return null;
  }
}

/**
 * Validate a VLESS URI
 */
export function isValidVLESSUri(uri: string): boolean {
  return parseVLESSUri(uri) !== null;
}

/**
 * Extract UUID from VLESS URI
 */
export function extractUuidFromUri(uri: string): string | null {
  const parsed = parseVLESSUri(uri);
  return parsed?.uuid || null;
}

/**
 * Extract name from VLESS URI
 */
export function extractNameFromUri(uri: string): string | null {
  const parsed = parseVLESSUri(uri);
  return parsed?.name || null;
}
