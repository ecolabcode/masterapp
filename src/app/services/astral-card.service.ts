import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AstralCard } from '../models/astral-card';

export interface AstralCardInput {
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTimeApprox: string; // HH:mm (approx)
  country: string;
  city: string;
}

@Injectable({ providedIn: 'root' })
export class AstralCardService {
  private readonly baseUrl = '/api'; // dev proxy -> backend

  constructor(private http: HttpClient) {}

  generate(input: AstralCardInput): Observable<AstralCard> {
    return this.http.post<AstralCard>(`${this.baseUrl}/astral-card`, input);
  }
}
