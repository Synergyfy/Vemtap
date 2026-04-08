import { ProfilingLogicHelper } from './profiling-logic.helper';
import { ProfilePriority } from './entities/business-profile.entity';

describe('ProfilingLogicHelper', () => {
  describe('calculateRetail', () => {
    it('should correctly identify problems and recommendations for a high-problem retail business', () => {
      const data = {
        businessName: 'Test Retail',
        retailType: 'Clothing / Fashion',
        customerTraffic: 'High', // 3
        productDiscovery: 'Hard', // 3
        customerQuestions: 'High', // 3
        waitingTime: 'High', // 3
        collectsData: 'No', // 3
        entranceVisibility: 'No', // 3
        followUp: 'No', // 3
        productKnowledge: 'No', // 3
        marketingAwareness: 'No', // 3
        purchaseAbandonment: 'High', // 3
        outOfStockLoss: 'High', // 3
      };

      const result = ProfilingLogicHelper.calculateRetail(data);

      expect(result.insights.problems!).toContain('Customers struggle to find or understand products easily.');
      expect(result.insights.problems!).toContain('High service delay noticed during customer interactions.');
      expect(result.insights.problems!).toContain('No structured customer database for re-marketing.');
      expect(result.insights.suggestedPackage).toBe('Platinum');
      expect(result.priority).toBe(ProfilePriority.HIGH);
    });

    it('should recommend Silver package for low traffic retail with no problems', () => {
      const data = {
        businessName: 'Small Shop',
        retailType: 'Other',
        customerTraffic: 'Low',
        productDiscovery: 'Easy',
        customerQuestions: 'Low',
        waitingTime: 'Low',
        collectsData: 'Yes',
      };

      const result = ProfilingLogicHelper.calculateRetail(data);

      expect(result.insights.problems!.length).toBe(0);
      expect(result.insights.suggestedPackage).toBe('Silver');
      expect(result.priority).toBe(ProfilePriority.LOW);
    });
  });

  describe('calculateFood', () => {
    it('should recommend QR ordering for busy restaurants with waiting issues', () => {
      const data = {
        businessName: 'Busy Buka',
        foodType: 'Restaurant',
        customerTraffic: 'High',
        waitingTime: 'High',
        complaints: 'High',
        menuVisibility: 'No',
      };

      const result = ProfilingLogicHelper.calculateFood(data);

      expect(result.insights.problems!).toContain('Service delays and customer wait-time friction.');
      expect(result.insights.problems!).toContain('Menu confusion and low offering visibility.');
      expect(result.insights.recommendations!).toContain('Implement a Digital QR Ordering system to speed up the process and reduce staff load.');
      expect(result.insights.suggestedPackage).toBe('Platinum');
    });
  });

  describe('calculateRealEstate', () => {
    it('should recommend digital listings for real estate with visibility issues', () => {
      const data = {
        businessName: 'Prime Lands',
        propertyType: 'Real Estate Agency',
        monthlyLeads: 'Medium',
        propertyVisibility: 'No',
        responseTime: 'Slow',
      };

      const result = ProfilingLogicHelper.calculateRealEstate(data);

      expect(result.insights.problems!).toContain('Property information gap and low listing visibility.');
      expect(result.insights.recommendations!).toContain('Deploy a Digital Property Listing system via QR to provide instant access to high-quality photos and specs.');
    });
  });

  describe('calculateGov', () => {
    it('should always suggest Platinum for government agencies', () => {
      const data = {
        citizenVolume: 'High',
        queueTime: 'High',
      };

      const result = ProfilingLogicHelper.calculateGov(data);
      expect(result.insights.suggestedPackage).toBe('Platinum');
    });
  });
});
