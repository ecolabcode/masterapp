import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AstralCard } from '../../models/astral-card';
import { AstralCardService } from '../../services/astral-card.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  private fb = inject(FormBuilder);
  private api = inject(AstralCardService);

  loading = signal(false);
  error = signal<string | null>(null);
  result = signal<AstralCard | null>(null);

  // Auto-detect user timezone (IANA format)
  readonly detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    birthDate: ['', [Validators.required]],

    // checkbox toggles whether time is required
    unknownBirthTime: [false],

    // time field: only required if unknownBirthTime=false
    birthTimeApprox: this.fb.control(
      { value: '', disabled: false },
      { validators: [Validators.required] }
    ),

    country: ['', [Validators.required, Validators.minLength(2)]],
    city: ['', [Validators.required, Validators.minLength(2)]],

    // send timezone to backend
    timezone: [this.detectedTimezone, [Validators.required]],
  });

  // For UI: whether time is considered required
  isTimeRequired = computed(() => !this.unknownBirthTime);

  constructor() {
    // Set up dynamic validation for birthTimeApprox
    this.form.controls.unknownBirthTime.valueChanges.subscribe((unknown) => {
      const timeCtrl = this.form.controls.birthTimeApprox;

      if (unknown) {
        timeCtrl.disable({ emitEvent: false });
        timeCtrl.setValue('', { emitEvent: false });
        timeCtrl.clearValidators();
      } else {
        timeCtrl.enable({ emitEvent: false });
        timeCtrl.setValidators([Validators.required]);
      }

      timeCtrl.updateValueAndValidity({ emitEvent: false });
    });
  }

  private buildPayload() {
    const raw = this.form.getRawValue();

    return {
      name: raw.name!.trim(),
      birthDate: raw.birthDate!,
      unknownBirthTime: !!raw.unknownBirthTime,
      birthTimeApprox: raw.unknownBirthTime ? null : raw.birthTimeApprox!,
      country: raw.country!.trim(),
      city: raw.city!.trim(),
      timezone: raw.timezone!,
    };
  }

  submit() {
    this.error.set(null);
    this.result.set(null);

    // make sure disabled controls don’t break validation logic
    if (this.form.invalid) {
      this.error.set('Please complete the required fields.');
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.api.generate(this.buildPayload() as any).subscribe({
      next: (res) => {
        this.result.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to generate astral card.');
        this.loading.set(false);
      },
    });
  }
  get unknownBirthTime(): boolean {
    return !!this.form.controls.unknownBirthTime.value;
  }
}
