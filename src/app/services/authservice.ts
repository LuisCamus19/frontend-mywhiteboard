import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Authservice {
  private URL_AUTH = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  login(credenciales: any) {
    return this.http.post<any>(`${this.URL_AUTH}/login`, credenciales).pipe(
      tap((response) => {
        localStorage.setItem('token_pizarra', response.token);
        // Guardamos el username también para facilitar las cosas
        localStorage.setItem('usuario_pizarra', credenciales.username);
      })
    );
  }

  register(usuario: any) {
    return this.http.post(`${this.URL_AUTH}/register`, usuario);
  }

  logout() {
    localStorage.removeItem('token_pizarra');
    localStorage.removeItem('usuario_pizarra');
    this.router.navigate(['/login']);
  }

  getToken() {
    return localStorage.getItem('token_pizarra');
  }

  getUsername() {
    // Retornamos el usuario guardado al login
    return localStorage.getItem('usuario_pizarra') || 'Anonimo';
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token_pizarra');
  }
}
