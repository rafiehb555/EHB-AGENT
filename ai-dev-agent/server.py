import os
import sys
from pathlib import Path
import json
from datetime import datetime

#!/usr/bin/env python3
"""
EHB AI Dev Agent - Simple HTTP Server
Serves the dashboard and agent files in browser
"""



class EHBAgentServer:
    def __init__(self, port=8000):
        self.port = port
        self.project_root = Path(__file__).parent
        self.dashboard_file = self.project_root / "dashboard.html"

    def start_server(self):
        """Start the HTTP server and open browser"""
        print("EHB AI Starting EHB AI Dev Agent Server...")
        print(f"📁 Serving from: {self.project_root}")
        print(f"WEB Dashboard URL: http://localhost:{self.port}")
        print("=" * 50)

        # Change to project directory
        os.chdir(self.project_root)

        # Create custom handler
        project_root = self.project_root

        class EHBAgentHandler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=str(project_root), **kwargs)

            def end_headers(self):
                # Add CORS headers for development
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "Content-Type")
                super().end_headers()

            def do_GET(self):
                """Handle GET requests with better error handling"""
                try:
                    # Handle root path
                    if self.path == "/":
                        self.path = "/index.html"

                    # Handle common 404 cases
                    if self.path == "/favicon.ico":
                        self.send_response(204)  # No content
                        self.end_headers()
                        return

                    # Try to serve the file
                    super().do_GET()

                except Exception as e:
                    print(f"WARNING Error serving {self.path}: {e}")
                    self.send_error(404, f"File not found: {self.path}")

            def log_message(self, format, *args):
                # Custom logging with better formatting
                timestamp = datetime.now().strftime("%H:%M:%S")
                message = format % args
                if "404" in message:
                    print(f"[{timestamp}] WARNING {message}")
                elif "200" in message:
                    print(f"[{timestamp}] SUCCESS {message}")
                else:
                    print(f"[{timestamp}] {message}")

        try:
            # Create server
            with socketserver.TCPServer(("", self.port), EHBAgentHandler) as httpd:
                print(f"SUCCESS Server started on port {self.port}")
                print("🔄 Press Ctrl+C to stop server")
                print("=" * 50)

                # Open browser automatically
                self.open_browser()

                # Start serving
                httpd.serve_forever()

        except KeyboardInterrupt:
            print("\n🛑 Server stopped by user")
        except OSError as e:
            if e.errno == 48:  # Address already in use
                print(f"ERROR Port {self.port} is already in use")
                print("💡 Try a different port: python server.py --port 8001")
            else:
                print(f"ERROR Server error: {e}")
        except Exception as e:
            print(f"ERROR Unexpected error: {e}")

    def open_browser(self):
        """Open browser to dashboard"""
        try:
            url = f"http://localhost:{self.port}/dashboard.html"
            print(f"WEB Opening browser to: {url}")
            webbrowser.open(url)
        except Exception as e:
            print(f"WARNING Could not open browser automatically: {e}")
            print(
                f"💡 Please open manually: http://localhost:{self.port}/dashboard.html"
            )

    def create_index_page(self):
        """Create an index page that redirects to dashboard"""
        index_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EHB AI Dev Agent</title>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .container {
            text-align: center;
            max-width: 600px;
            padding: 40px;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 20px;
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        .buttons {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn {
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.2);
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s;
        }
        .btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }
        .status {
            margin-top: 40px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>EHB AI EHB AI Dev Agent</h1>
        <p>Healthcare Technology Development Manager</p>
        
        <div class="buttons">
            <a href="dashboard.html" class="btn">REPORT Dashboard</a>
            <a href="README.md" class="btn">📖 Documentation</a>
            <a href="cli.py" class="btn">CODE CLI Interface</a>
        </div>
        
        <div class="status">
            <h3>ROCKET Server Status</h3>
            <p>SUCCESS EHB AI Dev Agent is running</p>
            <p>📁 Serving files from project directory</p>
            <p>TOOLS Ready for development and testing</p>
        </div>
    </div>
    
    <script>
        // Auto-redirect to dashboard after 3 seconds
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 3000);
    </script>
</body>
</html>"""

        with open(self.project_root / "index.html", "w", encoding="utf-8") as f:
            f.write(index_content)
        print("SUCCESS Created index.html with auto-redirect")


def main():
    """Main entry point"""

    parser = argparse.ArgumentParser(description="EHB AI Dev Agent Server")
    parser.add_argument("--port", type=int, default=8000, help="Port to run server on")
    parser.add_argument(
        "--no-browser", action="store_true", help="Don't open browser automatically"
    )

    args = parser.parse_args()

    server = EHBAgentServer(args.port)

    # Create index page
    server.create_index_page()

    # Start server
    server.start_server()


if __name__ == "__main__":
    main()
