import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "./App";
import theme from "./styles/theme";
import { WalletProvider } from "./context/WalletContext";
import "./index.css";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (was previously cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Application entry point.
 * Sets up:
 * - React strict mode
 * - Light color mode with Chakra UI
 * - Wallet context for blockchain integration
 * - Browser routing for navigation
 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Force light mode */}
    <ColorModeScript initialColorMode="light" />
    <QueryClientProvider client={queryClient}>
      <ChakraProvider
        theme={theme}
        colorModeManager={{
          get: () => "light",
          set: () => {},
          type: "localStorage",
        }}
      >
        <WalletProvider>
          <BrowserRouter>
            <App />
            <ReactQueryDevtools initialIsOpen={false} />
          </BrowserRouter>
        </WalletProvider>
      </ChakraProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
