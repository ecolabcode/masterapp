import { NgFor } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ToastStore } from './toast.store';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgFor, MatCardModule, MatButtonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
})
export class ToastComponent {
  toast = inject(ToastStore);
}
