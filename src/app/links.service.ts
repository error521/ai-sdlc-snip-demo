import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Link {
  code: string;
  url: string;
  shortUrl: string;
  hits: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class LinksService {
  private http = inject(HttpClient);
  private base = 'http://localhost:3000';

  list(): Observable<Link[]> {
    return this.http.get<Link[]>(`${this.base}/api/links`);
  }

  create(url: string): Observable<Link> {
    return this.http.post<Link>(`${this.base}/api/links`, { url });
  }
}
