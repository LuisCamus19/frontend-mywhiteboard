import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Cuaderno } from '../models/filesystem';
import { Observable } from 'rxjs';
import { Estilo, Formato } from '../models/enums';

@Injectable({
  providedIn: 'root',
})
export class Notebookservice {
  private apiUrl = `${environment.apiUrl}/api/cuadernos`;

  constructor(private http: HttpClient) {}

  // 1. Obtener cuadernos sueltos (sin carpeta)
  getRoots(): Observable<Cuaderno[]> {
    return this.http.get<Cuaderno[]>(`${this.apiUrl}/raiz`);
  }

  // 2. Obtener un cuaderno por ID (detalles)
  getById(id: number): Observable<Cuaderno> {
    return this.http.get<Cuaderno>(`${this.apiUrl}/${id}`);
  }

  // 3. Crear Cuaderno
  create(
    nombre: string,
    color: string,
    formato: Formato,
    carpetaId?: number,
    estilo?: Estilo
  ): Observable<Cuaderno> {
    const payload = {
      nombre: nombre,
      colorPortada: color,
      formato: formato.toString(),
      estiloPredeterminado: estilo ? estilo.toString() : 'BLANCO',
      carpetaId: carpetaId,
    };

    return this.http.post<Cuaderno>(`${environment.apiUrl}/api/cuadernos`, payload);
  }

  // 4. Modificar
  update(id: number, nombre: string, colorPortada: string): Observable<Cuaderno> {
    return this.http.put<Cuaderno>(`${this.apiUrl}/${id}`, { nombre, colorPortada });
  }

  // 5. Eliminar
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
