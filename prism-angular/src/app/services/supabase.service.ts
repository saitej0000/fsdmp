import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabaseClient: SupabaseClient;

  constructor() {
    if (!environment.supabaseUrl || !environment.supabaseAnonKey) {
       console.warn('Supabase URL and Anon Key not found!');
    }
    this.supabaseClient = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  get client(): SupabaseClient {
    return this.supabaseClient;
  }
}
