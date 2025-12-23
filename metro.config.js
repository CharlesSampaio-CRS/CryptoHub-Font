const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ignore web-only files and node_modules that have window references
config.resolver.blockList = [
  // Ignore app directory (Next.js)
  /app\/.*\.tsx?$/,
  /app\/.*\.jsx?$/,
  // Ignore web-only components
  /\.web\.tsx?$/,
  /\.web\.jsx?$/,
  // Ignore specific problematic packages
  /node_modules\/(next|sonner|recharts|next-themes|react-dom)\//,
];

// Don't process node_modules except for what Expo needs
config.resolver.useWatchman = true;

module.exports = config;
