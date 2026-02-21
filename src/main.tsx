import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { Auth0Provider } from "@auth0/auth0-react";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import "./index.css";

// Read Auth0 config from environment variables (set in .env.local for local dev,
// injected as VITE_ vars at build time for staging/prod — never hardcoded).
const domain = import.meta.env.VITE_AUTH0_DOMAIN as string;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE as string;

if (!domain || !clientId) {
  throw new Error(
    "Auth0 configuration missing. " +
      "Set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID in your .env.local file."
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: audience || "financial-report-api",
          scope: "openid profile email",
        }}
      >
        <App />
      </Auth0Provider>
    </ErrorBoundary>
  </StrictMode>,
);
