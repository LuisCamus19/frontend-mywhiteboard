import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Carpeta } from '../models/filesystem';

@Injectable({
  providedIn: 'root',
})
export class Foldersevice {
  // Ajusta esto si tu environment tiene otro nombre, pero suele ser apiUrl
  private apiUrl = `${environment.apiUrl}/api/carpetas`;

  constructor(private http: HttpClient) {}

  // 1. Obtener carpetas que están en el "Inicio" (sin padre)
  getRoots(): Observable<Carpeta[]> {
    return this.http.get<Carpeta[]>(`${this.apiUrl}/raiz`);
  }

  // 2. Entrar a una carpeta (trae subcarpetas y cuadernos)
  getContent(id: number): Observable<Carpeta> {
    return this.http.get<Carpeta>(`${this.apiUrl}/${id}/contenido`);
  }

  // 3. Crear Carpeta (padreId es opcional)
  create(nombre: string, color: string, carpetaPadreId?: number): Observable<Carpeta> {
    const payload = { nombre, color, carpetaPadreId };
    return this.http.post<Carpeta>(this.apiUrl, payload);
  }

  // 4. Modificar nombre/color
  update(id: number, nombre: string, color: string): Observable<Carpeta> {
    return this.http.put<Carpeta>(`${this.apiUrl}/${id}`, { nombre, color });
  }

  // 5. Eliminar (Borra todo lo de adentro recursivamente)
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
