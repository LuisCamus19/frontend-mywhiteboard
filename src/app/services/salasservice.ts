import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Salasservice {
  private baseUrl = `${environment.apiUrl}/api/salas`;

  constructor(private http: HttpClient) {}

  listarMisSalas(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  listarCompartidas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/compartidas`);
  }

  crearSala(sala: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, sala);
  }

  borrarSala(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  agregarColaborador(salaId: string, username: string): Observable<void> {
    const url = `${this.baseUrl}/${salaId}/colaboradores`;
    return this.http.post<void>(url, { username }); // Enviamos como JSON
  }

  actualizarImagen(salaId: string, imagenBase64: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${salaId}/imagen`, { imagen: imagenBase64 });
  }

  buscarUsuarios(filtro: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/usuarios/buscar?filtro=${filtro}`);
  }
}
