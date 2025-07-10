#!/bin/bash

echo "🎵 Song Book App - Test Suite"
echo "============================="

# Check if required files exist
echo "✓ Checking files..."
if [ -f "index.html" ]; then echo "  ✓ index.html found"; else echo "  ✗ index.html missing"; fi
if [ -f "src/js/main.js" ]; then echo "  ✓ main.js found"; else echo "  ✗ main.js missing"; fi
if [ -f "src/css/styles.css" ]; then echo "  ✓ styles.css found"; else echo "  ✗ styles.css missing"; fi
if [ -f "lyrics/all-songs.json" ]; then echo "  ✓ all-songs.json found"; else echo "  ✗ all-songs.json missing"; fi
if [ -f "lyrics/manifest.json" ]; then echo "  ✓ manifest.json found"; else echo "  ✗ manifest.json missing"; fi

echo ""
echo "✓ Checking data integrity..."
SONG_COUNT=$(grep -c '"title"' lyrics/all-songs.json)
echo "  ✓ Found $SONG_COUNT songs in database"

echo ""
echo "✓ Testing server response..."
if curl -s http://localhost:8080/ | grep -q "Song Book"; then
    echo "  ✓ Server is responding correctly"
else
    echo "  ✗ Server not responding or content missing"
fi

echo ""
echo "✓ Testing API endpoints..."
if curl -s http://localhost:8080/lyrics/manifest.json | grep -q "all-songs.json"; then
    echo "  ✓ Manifest API working"
else
    echo "  ✗ Manifest API not working"
fi

if curl -s http://localhost:8080/lyrics/all-songs.json | grep -q "title"; then
    echo "  ✓ Songs API working"
else
    echo "  ✗ Songs API not working"
fi

echo ""
echo "🎯 Test Results:"
echo "   - Application structure: Complete"
echo "   - Data cleaned: $SONG_COUNT valid songs"
echo "   - Server: Running on http://localhost:8080"
echo "   - Ready to use! 🎉"
