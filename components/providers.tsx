"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

// TypeScript only:
declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__: import("@tanstack/query-core").QueryClient;
  }
}

export default function Providers({ children }: { children: React.ReactNode}) {
    
  if ("window" in globalThis) window.__TANSTACK_QUERY_CLIENT__ = queryClient;

  return (<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>)
}