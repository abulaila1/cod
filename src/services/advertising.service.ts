import { supabase } from './supabase';
import type {
  AdCampaign,
  AdCampaignProduct,
  CreateCampaignInput,
  UpdateCampaignInput,
  CampaignStats,
  CampaignWithDetails,
  CampaignFilters,
} from '@/types/advertising';

export class AdvertisingService {
  static async createCampaign(
    businessId: string,
    input: CreateCampaignInput,
    userId: string
  ): Promise<AdCampaign> {
    const totalPercentage = input.products.reduce((sum, p) => sum + p.allocation_percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('مجموع نسب التوزيع يجب أن يساوي 100%');
    }

    const { data: campaign, error: campaignError } = await supabase
      .from('ad_campaigns')
      .insert({
        business_id: businessId,
        campaign_date: input.campaign_date,
        platform: input.platform,
        campaign_name: input.campaign_name,
        total_cost: input.total_cost,
        notes: input.notes,
        created_by: userId,
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    const productAllocations = input.products.map((p) => ({
      business_id: businessId,
      campaign_id: campaign.id,
      product_id: p.product_id,
      cost_amount: (input.total_cost * p.allocation_percentage) / 100,
      allocation_percentage: p.allocation_percentage,
    }));

    const { error: productsError } = await supabase
      .from('ad_campaign_products')
      .insert(productAllocations);

    if (productsError) {
      await supabase.from('ad_campaigns').delete().eq('id', campaign.id);
      throw productsError;
    }

    return campaign;
  }

  static async updateCampaign(
    campaignId: string,
    businessId: string,
    input: UpdateCampaignInput
  ): Promise<AdCampaign> {
    const updates: any = {};
    if (input.campaign_date) updates.campaign_date = input.campaign_date;
    if (input.platform) updates.platform = input.platform;
    if (input.campaign_name !== undefined) updates.campaign_name = input.campaign_name;
    if (input.total_cost !== undefined) updates.total_cost = input.total_cost;
    if (input.notes !== undefined) updates.notes = input.notes;

    const { data: campaign, error: updateError } = await supabase
      .from('ad_campaigns')
      .update(updates)
      .eq('id', campaignId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (updateError) throw updateError;

    if (input.products) {
      const totalPercentage = input.products.reduce((sum, p) => sum + p.allocation_percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error('مجموع نسب التوزيع يجب أن يساوي 100%');
      }

      await supabase
        .from('ad_campaign_products')
        .delete()
        .eq('campaign_id', campaignId);

      const productAllocations = input.products.map((p) => ({
        business_id: businessId,
        campaign_id: campaignId,
        product_id: p.product_id,
        cost_amount: (campaign.total_cost * p.allocation_percentage) / 100,
        allocation_percentage: p.allocation_percentage,
      }));

      const { error: productsError } = await supabase
        .from('ad_campaign_products')
        .insert(productAllocations);

      if (productsError) throw productsError;
    }

    return campaign;
  }

  static async deleteCampaign(campaignId: string, businessId: string): Promise<void> {
    const { error } = await supabase
      .from('ad_campaigns')
      .delete()
      .eq('id', campaignId)
      .eq('business_id', businessId);

    if (error) throw error;
  }

  static async getCampaign(campaignId: string, businessId: string): Promise<CampaignWithDetails> {
    const { data: campaign, error: campaignError } = await supabase
      .from('ad_campaigns')
      .select(
        `
        *,
        products:ad_campaign_products(
          *,
          product:products(*)
        )
      `
      )
      .eq('id', campaignId)
      .eq('business_id', businessId)
      .single();

    if (campaignError) throw campaignError;

    const { data: logs } = await supabase
      .from('ad_cost_logs')
      .select(
        `
        order_id,
        orders!inner(revenue)
      `
      )
      .eq('campaign_id', campaignId);

    const orders_count = logs?.length || 0;
    const revenue_generated = logs?.reduce((sum, log: any) => sum + (log.orders?.revenue || 0), 0) || 0;
    const roas = campaign.total_cost > 0 ? revenue_generated / campaign.total_cost : 0;

    return {
      ...campaign,
      orders_count,
      revenue_generated,
      roas,
    };
  }

  static async listCampaigns(
    businessId: string,
    filters?: CampaignFilters
  ): Promise<CampaignWithDetails[]> {
    let query = supabase
      .from('ad_campaigns')
      .select(
        `
        *,
        products:ad_campaign_products(
          *,
          product:products(*)
        )
      `
      )
      .eq('business_id', businessId)
      .order('campaign_date', { ascending: false });

    if (filters?.date_from) {
      query = query.gte('campaign_date', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('campaign_date', filters.date_to);
    }
    if (filters?.platform) {
      query = query.eq('platform', filters.platform);
    }
    if (filters?.is_allocated !== undefined) {
      query = query.eq('is_allocated', filters.is_allocated);
    }
    if (filters?.search) {
      query = query.ilike('campaign_name', `%${filters.search}%`);
    }

    const { data: campaigns, error } = await query;
    if (error) throw error;

    const campaignIds = campaigns?.map((c) => c.id) || [];
    if (campaignIds.length === 0) {
      return campaigns?.map((c) => ({
        ...c,
        orders_count: 0,
        revenue_generated: 0,
        roas: 0,
      })) || [];
    }

    const { data: logs } = await supabase
      .from('ad_cost_logs')
      .select(
        `
        campaign_id,
        order_id,
        orders!inner(revenue)
      `
      )
      .in('campaign_id', campaignIds);

    const logsByCampaign = (logs || []).reduce((acc: any, log: any) => {
      if (!acc[log.campaign_id]) {
        acc[log.campaign_id] = { count: 0, revenue: 0 };
      }
      acc[log.campaign_id].count++;
      acc[log.campaign_id].revenue += log.orders?.revenue || 0;
      return acc;
    }, {});

    return campaigns?.map((campaign) => {
      const stats = logsByCampaign[campaign.id] || { count: 0, revenue: 0 };
      return {
        ...campaign,
        orders_count: stats.count,
        revenue_generated: stats.revenue,
        roas: campaign.total_cost > 0 ? stats.revenue / campaign.total_cost : 0,
      };
    }) || [];
  }

  static async getCampaignStats(
    businessId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<CampaignStats> {
    let query = supabase
      .from('ad_campaigns')
      .select('*')
      .eq('business_id', businessId);

    if (dateFrom) query = query.gte('campaign_date', dateFrom);
    if (dateTo) query = query.lte('campaign_date', dateTo);

    const { data: campaigns, error } = await query;
    if (error) throw error;

    const total_campaigns = campaigns?.length || 0;
    const total_spent = campaigns?.reduce((sum, c) => sum + c.total_cost, 0) || 0;

    const campaignIds = campaigns?.map((c) => c.id) || [];
    let total_revenue = 0;
    let total_orders = 0;

    if (campaignIds.length > 0) {
      const { data: logs } = await supabase
        .from('ad_cost_logs')
        .select(
          `
          campaign_id,
          orders!inner(revenue)
        `
        )
        .in('campaign_id', campaignIds);

      total_orders = logs?.length || 0;
      total_revenue = logs?.reduce((sum, log: any) => sum + (log.orders?.revenue || 0), 0) || 0;
    }

    const roas = total_spent > 0 ? total_revenue / total_spent : 0;
    const avg_cost_per_order = total_orders > 0 ? total_spent / total_orders : 0;
    const avg_cost_per_day = total_campaigns > 0 ? total_spent / total_campaigns : 0;

    const platformStats = campaigns?.reduce((acc: any, campaign) => {
      if (!acc[campaign.platform]) {
        acc[campaign.platform] = {
          platform: campaign.platform,
          total_spent: 0,
          total_revenue: 0,
          orders_count: 0,
          roas: 0,
        };
      }
      acc[campaign.platform].total_spent += campaign.total_cost;
      return acc;
    }, {});

    if (campaignIds.length > 0) {
      const { data: logs } = await supabase
        .from('ad_cost_logs')
        .select(
          `
          campaign_id,
          orders!inner(revenue)
        `
        )
        .in('campaign_id', campaignIds);

      logs?.forEach((log: any) => {
        const campaign = campaigns?.find((c) => c.id === log.campaign_id);
        if (campaign && platformStats[campaign.platform]) {
          platformStats[campaign.platform].orders_count++;
          platformStats[campaign.platform].total_revenue += log.orders?.revenue || 0;
        }
      });
    }

    const by_platform = Object.values(platformStats).map((stats: any) => ({
      ...stats,
      roas: stats.total_spent > 0 ? stats.total_revenue / stats.total_spent : 0,
    }));

    return {
      total_campaigns,
      total_spent,
      total_revenue,
      total_orders,
      roas,
      avg_cost_per_order,
      avg_cost_per_day,
      by_platform,
    };
  }
}
