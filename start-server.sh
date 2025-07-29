#!/bin/bash
# Start Finnish Wealth Tracker Server

echo "🚀 Starting Finnish Wealth Tracker..."
echo "📱 Access on phone: http://10.0.0.1:8000"
echo "💻 Access on PC: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

cd /mnt/f/finance
python3 -m http.server 8000 --bind 0.0.0.0