import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LinksService, Link } from './links.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private svc = inject(LinksService);

  inputUrl = signal('');
  allLinks = signal<Link[]>([]);
  lastCreated = signal<Link | null>(null);
  formError = signal<string | null>(null);
  busy = signal(false);

  ngOnInit() {
    this.loadLinks();
  }

  private loadLinks() {
    this.svc.list().subscribe({
      next: (data) => this.allLinks.set(data),
    });
  }

  submit() {
    const raw = this.inputUrl().trim();
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      this.formError.set('Enter a valid URL (including https://).');
      return;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      this.formError.set('URL must start with http:// or https://');
      return;
    }

    this.formError.set(null);
    this.busy.set(true);

    this.svc.create(raw).subscribe({
      next: (link) => {
        this.lastCreated.set(link);
        this.inputUrl.set('');
        this.busy.set(false);
        this.loadLinks();
      },
      error: (err) => {
        this.formError.set(
          err?.error?.error ?? 'Network error – is the backend running?'
        );
        this.busy.set(false);
      },
    });
  }
}
