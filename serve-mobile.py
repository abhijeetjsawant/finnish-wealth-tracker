#!/usr/bin/env python3
"""
Mobile Server for Finnish Wealth Tracker
Starts a server and shows QR code for easy mobile access
"""

import http.server
import socketserver
import socket
import qrcode
import os
from io import StringIO

def get_local_ip():
    """Get local IP address"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "localhost"

def generate_qr_ascii(data):
    """Generate ASCII QR code"""
    qr = qrcode.QRCode(version=1, box_size=1, border=1)
    qr.add_data(data)
    qr.make(fit=True)
    
    # Create ASCII art
    f = StringIO()
    qr.print_ascii(out=f)
    f.seek(0)
    return f.read()

def main():
    PORT = 8000
    ip = get_local_ip()
    url = f"http://{ip}:{PORT}"
    
    print("\n" + "="*50)
    print("🚀 Finnish Wealth Tracker - Mobile Server")
    print("="*50)
    print(f"\n📱 Access on your phone at: {url}")
    print("\n🔍 Or scan this QR code:\n")
    
    # Generate and print QR code
    try:
        qr_code = generate_qr_ascii(url)
        print(qr_code)
    except ImportError:
        print("Install qrcode for QR display: pip install qrcode")
    
    print("\n" + "="*50)
    print("Press Ctrl+C to stop the server")
    print("="*50 + "\n")
    
    # Change to the app directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Start server
    Handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n✋ Server stopped")

if __name__ == "__main__":
    main()