import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Building2 } from "lucide-react";
import { authService } from "../../services/auth_service";

interface InitializeUserProps {
  onUserReady: () => void;
}

/**
 * InitializeUser Component
 * Handles checking if user exists and creating profile if needed
 * Only calls onUserReady when user is fully initialized in backend
 */
export const InitializeUser: React.FC<InitializeUserProps> = ({ onUserReady }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeUser = async () => {
      if (!isAuthenticated || !user) {
        setIsInitializing(false);
        return;
      }

      try {
        setIsInitializing(true);
        console.log("🔄 Initializing user...");
        
        const token = await getAccessTokenSilently();
        
        // This will check if user exists and create if needed
        await authService.checkOrCreateUser(user, token);
        
        console.log("✅ User initialization complete");
        onUserReady();
      } catch (err) {
        console.error("❌ User initialization failed:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize user");
      } finally {
        setIsInitializing(false);
      }
    };

    initializeUser();
  }, [isAuthenticated, user, getAccessTokenSilently, onUserReady]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <p className="text-neutral-600">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center space-y-4">
          <Building2 className="h-12 w-12 text-red-600 mx-auto" />
          <p className="text-red-600 font-semibold">Error initializing profile</p>
          <p className="text-neutral-600 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return null; // Component disappears once user is initialized
};
