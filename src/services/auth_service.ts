import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import type { UserProfile } from '../types/interfaces';

export const authService = {
  /**
   * Check if user exists and create profile if not
   */
  async checkOrCreateUser(user: any, accessToken: string): Promise<void> {
    try {
      const email = user.email;
      console.log("🔍 Checking user profile for email:", email);
      
      // First, try to get user profile (backend extracts email from JWT)
      const checkResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.getClientProfile}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (checkResponse.ok) {
        // User exists
        const data = await checkResponse.json();
        console.log("✅ User profile found:", data.client);
        console.log("📧 Email in system:", data.client.email);
        try {
          localStorage.setItem("client_profile", JSON.stringify(data.client));
        } catch (_) {}
        return;
      }

      // User doesn't exist (404 or other error), create new profile
      console.log("➕ Creating new user profile for:", email);
      
      const newProfile: UserProfile = {
        name: user.name || user.nickname || email.split('@')[0],
        mobile_number: user.phone_number || '',
        email: email,
        zip_code: '',
        address: ''
      };

      console.log("📝 Profile data to create:", newProfile);

      const createResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.addNewClient}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProfile),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        console.error("❌ Failed to create user profile. Status:", createResponse.status);
        console.error("❌ Error response:", errorData);
        throw new Error('Failed to create user profile');
      }

      const createdUser = await createResponse.json();
      console.log("✅ User profile created successfully:", createdUser);
      console.log("📧 New user email in system:", email);
      try {
        const client = createdUser.client ?? createdUser;
        localStorage.setItem("client_profile", JSON.stringify(client));
      } catch (_) {}
    } catch (error) {
      console.error("❌ Error checking/creating user:", error);
      throw error;
    }
  },
  getClientId(): string | null {
    try {
      const raw = localStorage.getItem("client_profile");
      if (!raw) return null;
      const profile = JSON.parse(raw);
      return profile?.client_id ?? null;
    } catch (_) {
      return null;
    }
  },
  async fetchClientProfile(accessToken: string): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.getClientProfile}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const client = data?.client ?? data;
      try {
        localStorage.setItem("client_profile", JSON.stringify(client));
      } catch (_) {}
      return client;
    } catch (_) {
      return null;
    }
  },
};
