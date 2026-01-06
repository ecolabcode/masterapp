import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';

import { ToastStore } from '../../core/toast/toast.store';
import { AuthStore } from '../../stores/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthStore);
  private toast = inject(ToastStore);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  signupForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async submitLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toast.error('Invalid login input.');
      return;
    }

    const v = this.loginForm.value;

    try {
      await this.auth.login(v.email!, v.password!);

      // ✅ redirect to Home after successful login
      await this.router.navigateByUrl('/');
    } catch (e: any) {
      this.toast.error(e?.message ?? 'Login failed.');
    }
  }

  async submitSignup() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      this.toast.error('Invalid signup input.');
      return;
    }

    const v = this.signupForm.value;

    try {
      await this.auth.signup(v.name!, v.email!, v.password!);

      // ✅ redirect to Home after successful signup/login
      await this.router.navigateByUrl('/');
    } catch (e: any) {
      this.toast.error(e?.message ?? 'Signup failed.');
    }
  }
}
