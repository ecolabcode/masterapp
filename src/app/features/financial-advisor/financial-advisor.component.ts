import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ToastStore } from '../../core/toast/toast.store';
import { FinancialAdvisorResponse } from './financial-advisor.model';
import { FinancialAdvisorService } from './financial-advisor.service';

@Component({
  selector: 'app-financial-advisor',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './financial-advisor.component.html',
  styleUrls: ['./financial-advisor.component.scss'],
})
export class FinancialAdvisorComponent {
  private api = inject(FinancialAdvisorService);
  private toast = inject(ToastStore);

  data = signal<FinancialAdvisorResponse | null>(null);

  ngOnInit() {
    this.api.getToday().subscribe({
      next: (res) => {
        this.data.set(res);
        this.toast.success('Loaded analyst rating changes.');
      },
    });
  }
}
