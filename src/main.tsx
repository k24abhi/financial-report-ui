import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { Auth0Provider } from "@auth0/auth0-react";
import "./index.css";

const domain = "dev-i2ijpwtje7bwegl8.us.auth0.com";
const clientId = "YDi2Dp5F3Pz42OZEq92Wg1thXJCVVcR8";

console.log("Auth0 Config:", { domain, clientId, redirectUri: window.location.origin });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{ 
        redirect_uri: window.location.origin,
        audience: "financial-report-api",
        scope: "openid profile email"
      }}
    >
      <App />
    </Auth0Provider>
  </StrictMode>,
);
  