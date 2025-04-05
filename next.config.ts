import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Resolve the 'three' import issue
    config.resolve.alias = {
      ...config.resolve.alias,
      'three': path.resolve('./node_modules/three'),
    };
    
    // Make sure to resolve .js extension for ESM imports
    config.resolve.extensions = [...(config.resolve.extensions || []), '.js'];
    
    return config;
  },
  transpilePackages: ['three'],
};

export default nextConfig;