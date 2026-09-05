import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/**
 * Runtime configuration service: fetches environment config at runtime,
 * overriding the build-time environment files.
 */
@Injectable({ providedIn: 'root' })
export class AppEnvironmentService {
  private config: Record<string, string> = {};

  constructor(private http: HttpClient) {}

  load(): Promise<void> {
    return this.http
      .get<Record<string, string>>('assets/config/env.config.json')
      .toPromise()
      .then((c) => { this.config = c || {}; });
  }

  get(key: string): string {
    return this.config[key];
  }
}
