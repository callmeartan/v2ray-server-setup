#!/usr/bin/env python3
"""
Convert V2Ray client configs to V2Box-compatible format
Usage: python convert_to_v2box.py input.json > output.json
"""

import json
import sys
import re

def convert_to_v2box(config_data):
    """Convert V2Ray format to V2Box format"""

    # Extract the UUID from the original config
    uuid_match = re.search(r'"uuid":\s*"([^"]+)"', config_data)
    if not uuid_match:
        print("Error: Could not find UUID in config", file=sys.stderr)
        return None

    uuid = uuid_match.group(1)

    # Extract client name
    name_match = re.search(r'"name":\s*"([^"]+)"', config_data)
    client_name = name_match.group(1) if name_match else "VLESS-Client"

    # Build V2Box-compatible config
    v2box_config = {
        "remarks": client_name,
        "server": "217.142.186.18",
        "server_port": 443,
        "protocol": "vless",
        "settings": {
            "vnext": [
                {
                    "address": "217.142.186.18",
                    "port": 443,
                    "users": [
                        {
                            "id": uuid,
                            "alterId": 0,
                            "security": "auto",
                            "level": 0
                        }
                    ]
                }
            ]
        },
        "streamSettings": {
            "network": "ws",
            "security": "none",
            "wsSettings": {
                "path": "/vless",
                "headers": {
                    "Host": "217.142.186.18"
                }
            }
        },
        "mux": {
            "enabled": False,
            "concurrency": 8
        }
    }

    return v2box_config

def main():
    if len(sys.argv) != 2:
        print("Usage: python convert_to_v2box.py input.json", file=sys.stderr)
        sys.exit(1)

    input_file = sys.argv[1]

    try:
        with open(input_file, 'r') as f:
            config_data = f.read()

        v2box_config = convert_to_v2box(config_data)
        if v2box_config:
            print(json.dumps(v2box_config, indent=2))
        else:
            sys.exit(1)

    except FileNotFoundError:
        print(f"Error: File '{input_file}' not found", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
