#!/bin/bash

echo "=========================================="
echo "Server Network Information"
echo "=========================================="
echo ""

echo "Checking if server is running..."
if ss -tulpn 2>/dev/null | grep -q ":3000"; then
    echo "✓ Server is running on port 3000"
else
    echo "✗ Server is NOT running"
    echo ""
    echo "Start server with: npm run server"
    exit 1
fi

echo ""
echo "Server is accessible at:"
echo ""
echo "  Local Access:"
echo "    http://localhost:3000"
echo "    http://127.0.0.1:3000"
echo ""

echo "  Network Access (from other devices):"
ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d'/' -f1 | while read ip; do
    echo "    http://$ip:3000"
done

echo ""
echo "=========================================="
echo "Testing Local Connection..."
echo "=========================================="
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✓ Local connection successful"
    curl -s http://localhost:3000
else
    echo "✗ Local connection failed"
fi

echo ""
echo ""
echo "=========================================="
echo "To access from another device:"
echo "=========================================="
echo "1. Make sure both devices are on same network"
echo "2. Use one of the Network URLs above"
echo "3. Check firewall settings if it doesn't work"
echo ""
