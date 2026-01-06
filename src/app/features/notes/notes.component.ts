import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ToastStore } from '../../core/toast/toast.store';
import { AuthStore } from '../../stores/auth.store';
import { NoteItem } from './notes.model';
import { NotesService } from './notes.service';

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss'],
})
export class NotesComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthStore);
  private api = inject(NotesService);
  private toast = inject(ToastStore);

  uid = computed(() => this.auth.user()?.uid ?? null);
  notes = signal<NoteItem[]>([]);
  editingId = signal<string | null>(null);

  form = this.fb.group({
    notes: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  ngOnInit() {
    const uid = this.uid();
    if (!uid) return;

    this.api.list(uid).subscribe({
      next: (items) => this.notes.set(items),
    });
  }

  async submit() {
    const uid = this.uid();
    if (!uid) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Notes required (max 1000 chars).');
      return;
    }

    const text = this.form.value.notes!.trim();
    if (!text) {
      this.toast.error('Notes cannot be empty.');
      return;
    }

    try {
      const id = this.editingId();
      if (id) {
        await this.api.update(id, text);
        this.toast.success('Note updated.');
      } else {
        await this.api.create(uid, todayISO(), text);
        this.toast.success('Note created.');
      }

      this.form.reset({ notes: '' });
      this.editingId.set(null);
    } catch (e: any) {
      this.toast.error(e?.message ?? 'Notes operation failed.');
    }
  }

  startEdit(n: NoteItem) {
    this.editingId.set(n.id);
    this.form.patchValue({ notes: n.notes });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.form.reset({ notes: '' });
  }

  async remove(id: string) {
    try {
      await this.api.remove(id);
      this.toast.success('Note deleted.');
    } catch (e: any) {
      this.toast.error(e?.message ?? 'Delete failed.');
    }
  }
}
