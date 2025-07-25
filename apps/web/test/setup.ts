// Global test setup
import { vi } from "vitest";

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};

// Mock TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock ReadableStream for Node.js environment
if (!global.ReadableStream) {
  global.ReadableStream = class ReadableStream {
    constructor(underlyingSource?: any) {
      // Basic mock implementation
    }
  } as any;
}
