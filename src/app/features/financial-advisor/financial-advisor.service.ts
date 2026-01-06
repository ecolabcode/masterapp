import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { FinancialAdvisorResponse } from './financial-advisor.model';

@Injectable({ providedIn: 'root' })
export class FinancialAdvisorService {
  private http = inject(HttpClient);
  getToday() {
    return this.http.get<FinancialAdvisorResponse>('/api/financial-advisor');
  }
}
