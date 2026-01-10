import { supabase } from './supabase';
import type { AllocationResult } from '@/types/advertising';

export class AdCostAllocationService {
  static async allocateCampaignCosts(
    campaignId: string,
    businessId: string
  ): Promise<AllocationResult> {
    try {
      const { data: campaign, error: campaignError } = await supabase
        .from('ad_campaigns')
        .select(
          `
          *,
          products:ad_campaign_products(
            *,
            product:products(id)
          )
        `
        )
        .eq('id', campaignId)
        .eq('business_id', businessId)
        .single();

      if (campaignError) throw campaignError;

      if (campaign.is_allocated) {
        throw new Error('تم توزيع تكاليف هذه الحملة من قبل');
      }

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(
          `
          id,
          order_date,
          items:order_items!inner(product_id, quantity)
        `
        )
        .eq('business_id', businessId)
        .eq('order_date', campaign.campaign_date);

      if (ordersError) throw ordersError;

      if (!orders || orders.length === 0) {
        return {
          success: true,
          orders_updated: 0,
          total_cost_allocated: 0,
        };
      }

      const productMap = new Map(
        campaign.products.map((p: any) => [p.product_id, p.cost_amount])
      );

      const ordersWithTargetedProducts = orders.filter((order: any) =>
        order.items.some((item: any) => productMap.has(item.product_id))
      );

      if (ordersWithTargetedProducts.length === 0) {
        return {
          success: true,
          orders_updated: 0,
          total_cost_allocated: 0,
        };
      }

      const totalProductQuantity = ordersWithTargetedProducts.reduce((sum, order: any) => {
        return (
          sum +
          order.items.reduce((itemSum: number, item: any) => {
            if (productMap.has(item.product_id)) {
              return itemSum + item.quantity;
            }
            return itemSum;
          }, 0)
        );
      }, 0);

      const costLogs: any[] = [];
      const orderUpdates: any[] = [];

      for (const order of ordersWithTargetedProducts) {
        let orderAdCost = 0;

        for (const item of order.items) {
          if (productMap.has(item.product_id)) {
            const productCost = productMap.get(item.product_id) || 0;
            const itemAdCost = (productCost * item.quantity) / totalProductQuantity;
            orderAdCost += itemAdCost;
          }
        }

        if (orderAdCost > 0) {
          costLogs.push({
            business_id: businessId,
            order_id: order.id,
            campaign_id: campaignId,
            allocated_cost: orderAdCost,
            allocation_method: 'product_based',
          });

          orderUpdates.push({
            id: order.id,
            ad_cost: orderAdCost,
          });
        }
      }

      if (costLogs.length > 0) {
        const { error: logsError } = await supabase.from('ad_cost_logs').insert(costLogs);
        if (logsError) throw logsError;

        for (const update of orderUpdates) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({ ad_cost: update.ad_cost })
            .eq('id', update.id)
            .eq('business_id', businessId);

          if (updateError) throw updateError;
        }

        await supabase
          .from('ad_campaigns')
          .update({
            is_allocated: true,
            allocated_at: new Date().toISOString(),
          })
          .eq('id', campaignId);
      }

      return {
        success: true,
        orders_updated: costLogs.length,
        total_cost_allocated: costLogs.reduce((sum, log) => sum + log.allocated_cost, 0),
      };
    } catch (error) {
      return {
        success: false,
        orders_updated: 0,
        total_cost_allocated: 0,
        errors: [error instanceof Error ? error.message : 'حدث خطأ غير متوقع'],
      };
    }
  }

  static async deallocateCampaignCosts(
    campaignId: string,
    businessId: string
  ): Promise<AllocationResult> {
    try {
      const { data: logs, error: logsError } = await supabase
        .from('ad_cost_logs')
        .select('order_id, allocated_cost')
        .eq('campaign_id', campaignId)
        .eq('business_id', businessId);

      if (logsError) throw logsError;

      if (!logs || logs.length === 0) {
        return {
          success: true,
          orders_updated: 0,
          total_cost_allocated: 0,
        };
      }

      for (const log of logs) {
        const { data: order } = await supabase
          .from('orders')
          .select('ad_cost')
          .eq('id', log.order_id)
          .single();

        if (order) {
          const newAdCost = Math.max(0, (order.ad_cost || 0) - log.allocated_cost);
          await supabase
            .from('orders')
            .update({ ad_cost: newAdCost })
            .eq('id', log.order_id);
        }
      }

      await supabase.from('ad_cost_logs').delete().eq('campaign_id', campaignId);

      await supabase
        .from('ad_campaigns')
        .update({
          is_allocated: false,
          allocated_at: null,
        })
        .eq('id', campaignId);

      return {
        success: true,
        orders_updated: logs.length,
        total_cost_allocated: logs.reduce((sum, log) => sum + log.allocated_cost, 0),
      };
    } catch (error) {
      return {
        success: false,
        orders_updated: 0,
        total_cost_allocated: 0,
        errors: [error instanceof Error ? error.message : 'حدث خطأ غير متوقع'],
      };
    }
  }

  static async reallocateCampaignCosts(
    campaignId: string,
    businessId: string
  ): Promise<AllocationResult> {
    const deallocationResult = await this.deallocateCampaignCosts(campaignId, businessId);

    if (!deallocationResult.success) {
      return deallocationResult;
    }

    return await this.allocateCampaignCosts(campaignId, businessId);
  }

  static async allocateAllPendingCampaigns(businessId: string): Promise<AllocationResult> {
    try {
      const { data: campaigns, error } = await supabase
        .from('ad_campaigns')
        .select('id')
        .eq('business_id', businessId)
        .eq('is_allocated', false);

      if (error) throw error;

      let totalOrdersUpdated = 0;
      let totalCostAllocated = 0;
      const errors: string[] = [];

      for (const campaign of campaigns || []) {
        const result = await this.allocateCampaignCosts(campaign.id, businessId);
        if (result.success) {
          totalOrdersUpdated += result.orders_updated;
          totalCostAllocated += result.total_cost_allocated;
        } else {
          errors.push(...(result.errors || []));
        }
      }

      return {
        success: errors.length === 0,
        orders_updated: totalOrdersUpdated,
        total_cost_allocated: totalCostAllocated,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        orders_updated: 0,
        total_cost_allocated: 0,
        errors: [error instanceof Error ? error.message : 'حدث خطأ غير متوقع'],
      };
    }
  }
}
