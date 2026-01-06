export interface RatingMove {
  type: 'upgrade' | 'downgrade';
  name: string;
  symbol: string;
  gradingCompany: string;
  previousGrade: string;
  newGrade: string;
  previousPrice: number | null;
  newPrice: number | null;
  currentPrice: number | null;
}

export interface FinancialAdvisorResponse {
  generatedAt: string;
  upgrades: RatingMove[];
  downgrades: RatingMove[];
  disclaimers: string[];
}
