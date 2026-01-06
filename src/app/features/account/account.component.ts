import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ToastStore } from '../../core/toast/toast.store';
import { AuthStore } from '../../stores/auth.store';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
})
export class AccountComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthStore);
  private toast = inject(ToastStore);

  profile = computed(() => this.auth.profile());

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    description: ['', [Validators.maxLength(800)]],
    newPassword: ['', [Validators.minLength(6)]],
  });

  ngOnInit() {
    const p = this.profile();
    if (p) {
      this.form.patchValue({
        name: p.name,
        email: p.email,
        description: p.description,
      });
    }
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Invalid account input.');
      return;
    }

    const v = this.form.value;

    try {
      await this.auth.updateAccount({
        name: v.name!.trim(),
        email: v.email!.trim(),
        description: (v.description ?? '').trim(),
      });

      if (v.newPassword && v.newPassword.trim().length >= 6) {
        await this.auth.changePassword(v.newPassword.trim());
        this.form.patchValue({ newPassword: '' });
      }
    } catch (e: any) {
      this.toast.error(e?.message ?? 'Account update failed.');
    }
  }

  logout() {
    this.auth.logout();
  }
}
