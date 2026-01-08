const CURRENT_BUSINESS_KEY = 'codmeta_current_business_id';

export class TenantService {
  static getCurrentBusinessId(): string | null {
    return localStorage.getItem(CURRENT_BUSINESS_KEY);
  }

  static setCurrentBusinessId(businessId: string): void {
    localStorage.setItem(CURRENT_BUSINESS_KEY, businessId);
  }

  static clearCurrentBusinessId(): void {
    localStorage.removeItem(CURRENT_BUSINESS_KEY);
  }

  static requireCurrentBusinessId(): string {
    const businessId = this.getCurrentBusinessId();
    if (!businessId) {
      throw new Error('لم يتم تحديد وورك سبيس');
    }
    return businessId;
  }
}
