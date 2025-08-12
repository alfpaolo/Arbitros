import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

export type RefereeProfile = {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
};

type AuthState = {
  session: Session | null;
  user: User | null;
  referee: RefereeProfile | null;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
  ensureRefereeProfile: () => Promise<RefereeProfile | null>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  referee: null,
  initialized: false,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, referee: null });
  },
  ensureRefereeProfile: async () => {
    const user = get().user;
    if (!user?.email) return null;
    // Try to fetch existing
    const { data: existing } = await supabase
      .from("referees")
      .select("id,email,full_name,is_admin")
      .eq("email", user.email)
      .maybeSingle();
    if (existing) {
      const profile: RefereeProfile = {
        id: existing.id,
        email: existing.email,
        full_name: existing.full_name,
        is_admin: existing.is_admin ?? false,
      };
      set({ referee: profile });
      return profile;
    }
    // Create minimal profile
    const { data, error } = await supabase
      .from("referees")
      .insert({ email: user.email, full_name: user.user_metadata?.full_name ?? null })
      .select("id,email,full_name,is_admin")
      .single();
    if (error) {
      console.error("Failed to create referee profile", error);
      return null;
    }
    const profile: RefereeProfile = {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      is_admin: data.is_admin ?? false,
    };
    set({ referee: profile });
    return profile;
  },
}));

// Initialize auth listener
supabase.auth.getSession().then(({ data }) => {
  useAuthStore.getState().setSession(data.session ?? null);
  useAuthStore.setState({ initialized: true });
});

supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setSession(session ?? null);
});