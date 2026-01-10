export type AdPlatform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'google'
  | 'snapchat'
  | 'twitter'
  | 'linkedin'
  | 'other';

export interface AdCampaign {
  id: string;
  business_id: string;
  campaign_date: string;
  platform: AdPlatform;
  campaign_name: string | null;
  total_cost: number;
  notes: string | null;
  is_allocated: boolean;
  allocated_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdCampaignProduct {
  id: string;
  business_id: string;
  campaign_id: string;
  product_id: string;
  cost_amount: number;
  allocation_percentage: number;
  created_at: string;
}

export interface AdCostLog {
  id: string;
  business_id: string;
  order_id: string;
  campaign_id: string;
  allocated_cost: number;
  allocation_method: 'daily' | 'per_order' | 'product_based';
  created_at: string;
}

export interface CreateCampaignInput {
  campaign_date: string;
  platform: string;
  campaign_name: string | null;
  total_cost: number;
  notes: string | null;
  products: {
    product_id: string;
    allocation_percentage: number;
  }[];
}

export interface UpdateCampaignInput {
  campaign_date?: string;
  platform?: string;
  campaign_name?: string | null;
  total_cost?: number;
  notes?: string | null;
  products?: {
    product_id: string;
    allocation_percentage: number;
  }[];
}

export interface CampaignWithDetails extends AdCampaign {
  products?: (AdCampaignProduct & {
    product?: any;
  })[];
  orders_count: number;
  revenue_generated: number;
  roas: number;
}

export interface CampaignFilters {
  date_from?: string;
  date_to?: string;
  platform?: string;
  is_allocated?: boolean;
  search?: string;
}

export interface CampaignStats {
  total_campaigns: number;
  total_spent: number;
  total_revenue: number;
  total_orders: number;
  roas: number;
  avg_cost_per_order: number;
  avg_cost_per_day: number;
  by_platform: {
    platform: string;
    total_spent: number;
    total_revenue: number;
    orders_count: number;
    roas: number;
  }[];
}

export interface AllocationResult {
  success: boolean;
  orders_updated: number;
  total_cost_allocated: number;
  errors?: string[];
}
