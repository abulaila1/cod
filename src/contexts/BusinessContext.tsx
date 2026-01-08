import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/services/supabase';

interface Business {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: 'admin' | 'manager' | 'agent' | 'viewer';
  status: 'active' | 'suspended';
}

interface BusinessContextValue {
  currentBusiness: Business | null;
  businesses: Business[];
  membership: BusinessMember | null;
  isLoading: boolean;
  error: string | null;
  switchBusiness: (businessId: string) => void;
  refreshBusinesses: () => Promise<void>;
  ensureWorkspace: () => Promise<Business | null>;
}

const BusinessContext = createContext<BusinessContextValue | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [membership, setMembership] = useState<BusinessMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadBusinesses();
    } else {
      setCurrentBusiness(null);
      setBusinesses([]);
      setMembership(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadBusinesses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: memberships, error: memberError } = await supabase
        .from('business_members')
        .select('business_id, role, status, businesses(id, name, created_by, created_at)')
        .eq('user_id', user!.id)
        .eq('status', 'active');

      if (memberError) throw memberError;

      const businessList = memberships
        ?.map(m => m.businesses)
        .filter((b): b is Business => b !== null) || [];

      setBusinesses(businessList);

      const savedBusinessId = localStorage.getItem('currentBusinessId');
      const businessToSelect = businessList.find(b => b.id === savedBusinessId) || businessList[0];

      if (businessToSelect) {
        const selectedMembership = memberships?.find(m => m.business_id === businessToSelect.id);
        setCurrentBusiness(businessToSelect);
        setMembership(selectedMembership || null);
        localStorage.setItem('currentBusinessId', businessToSelect.id);
      }
    } catch (err) {
      console.error('Error loading businesses:', err);
      setError(err instanceof Error ? err.message : 'فشل تحميل بيانات العمل');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBusinesses = async () => {
    if (isAuthenticated && user) {
      await loadBusinesses();
    }
  };

  const ensureWorkspace = async (): Promise<Business | null> => {
    try {
      const { data: existingBusinesses } = await supabase
        .from('business_members')
        .select('business_id, businesses(id, name, created_by, created_at)')
        .eq('user_id', user!.id)
        .eq('status', 'active');

      if (existingBusinesses && existingBusinesses.length > 0) {
        const business = existingBusinesses[0].businesses as Business;
        return business;
      }

      const { data: businessId, error: rpcError } = await supabase
        .rpc('create_workspace', { p_name: 'متجري' });

      if (rpcError) throw rpcError;

      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data: checkBusinesses } = await supabase
          .from('business_members')
          .select('business_id, businesses(id, name, created_by, created_at)')
          .eq('user_id', user!.id)
          .eq('status', 'active');

        if (checkBusinesses && checkBusinesses.length > 0) {
          const business = checkBusinesses[0].businesses as Business;
          await refreshBusinesses();
          return business;
        }
      }

      throw new Error('انتهت مهلة انتظار إنشاء العمل');
    } catch (err) {
      console.error('Error ensuring workspace:', err);
      throw err;
    }
  };

  const switchBusiness = (businessId: string) => {
    const business = businesses.find(b => b.id === businessId);
    if (business) {
      setCurrentBusiness(business);
      localStorage.setItem('currentBusinessId', businessId);
    }
  };

  return (
    <BusinessContext.Provider
      value={{
        currentBusiness,
        businesses,
        membership,
        isLoading,
        error,
        switchBusiness,
        refreshBusinesses,
        ensureWorkspace,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within BusinessProvider');
  }
  return context;
}
