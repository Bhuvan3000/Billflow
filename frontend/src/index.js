import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#1c2333", color: "#e2e8f0", border: "1px solid #2a3348", fontSize: 13 },
          success: { iconTheme: { primary: "#10b981", secondary: "#1c2333" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#1c2333" } },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);
