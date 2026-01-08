import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/services/supabase';

interface Business {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  status?: 'active' | 'suspended';
}

interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: 'admin' | 'manager' | 'agent' | 'viewer';
  status: 'active' | 'suspended';
}

interface WorkspaceCountry {
  id: string;
  name_ar: string;
  name_en?: string;
  code: string;
  currency: string;
  currency_symbol: string;
}

interface BusinessContextValue {
  currentBusiness: Business | null;
  businesses: Business[];
  membership: BusinessMember | null;
  country: WorkspaceCountry | null;
  isLoading: boolean;
  error: string | null;
  isSuspended: boolean;
  switchBusiness: (businessId: string) => void;
  refreshBusinesses: () => Promise<void>;
  refreshCountry: () => Promise<void>;
  ensureWorkspace: () => Promise<Business | null>;
  formatCurrency: (amount: number) => string;
  getCurrencySymbol: () => string;
}

const BusinessContext = createContext<BusinessContextValue | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [membership, setMembership] = useState<BusinessMember | null>(null);
  const [country, setCountry] = useState<WorkspaceCountry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCountry = useCallback(async (businessId: string) => {
    try {
      const { data, error: countryError } = await supabase
        .from('countries')
        .select('id, name_ar, name_en, code, currency, currency_symbol')
        .eq('business_id', businessId)
        .limit(1)
        .maybeSingle();

      if (countryError) {
        console.error('Error loading country:', countryError);
        setCountry(null);
        return;
      }

      setCountry(data);
    } catch (err) {
      console.error('Error loading country:', err);
      setCountry(null);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadBusinesses();
    } else {
      setCurrentBusiness(null);
      setBusinesses([]);
      setMembership(null);
      setCountry(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (currentBusiness) {
      loadCountry(currentBusiness.id);
    } else {
      setCountry(null);
    }
  }, [currentBusiness, loadCountry]);

  const loadBusinesses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: memberships, error: memberError } = await supabase
        .from('business_members')
        .select('business_id, role, status, businesses(id, name, created_by, created_at, status)')
        .eq('user_id', user!.id)
        .eq('status', 'active');

      if (memberError) {
        console.error('Error querying business_members:', memberError);

        if (memberError.code === 'PGRST116') {
          setError('لم يتم العثور على أي بيانات. سيتم إنشاء عمل جديد تلقائياً.');
        } else if (memberError.message.includes('permission')) {
          setError('خطأ في الأذونات. يرجى تسجيل الخروج ثم الدخول مرة أخرى.');
        } else {
          setError(`خطأ في تحميل البيانات: ${memberError.message}`);
        }

        setBusinesses([]);
        setCurrentBusiness(null);
        setMembership(null);
        setIsLoading(false);
        return;
      }

      if (!memberships || memberships.length === 0) {
        console.warn('User has no business memberships');
        setError('لم يتم العثور على أي عمل. سيتم إنشاء عمل جديد تلقائياً.');
        setBusinesses([]);
        setCurrentBusiness(null);
        setMembership(null);
        setIsLoading(false);
        return;
      }

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
      console.error('Unexpected error loading businesses:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      setBusinesses([]);
      setCurrentBusiness(null);
      setMembership(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBusinesses = async () => {
    if (isAuthenticated && user) {
      await loadBusinesses();
    }
  };

  const refreshCountry = async () => {
    if (currentBusiness) {
      await loadCountry(currentBusiness.id);
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

  const formatCurrency = useCallback((amount: number): string => {
    const formatted = new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);

    const symbol = country?.currency_symbol || '';
    return symbol ? `${formatted} ${symbol}` : formatted;
  }, [country]);

  const getCurrencySymbol = useCallback((): string => {
    return country?.currency_symbol || '';
  }, [country]);

  const isSuspended = currentBusiness?.status === 'suspended';

  return (
    <BusinessContext.Provider
      value={{
        currentBusiness,
        businesses,
        membership,
        country,
        isLoading,
        error,
        isSuspended,
        switchBusiness,
        refreshBusinesses,
        refreshCountry,
        ensureWorkspace,
        formatCurrency,
        getCurrencySymbol,
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
