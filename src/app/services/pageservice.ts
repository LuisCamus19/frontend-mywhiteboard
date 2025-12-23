import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pagina } from '../models/filesystem';
import { Estilo } from '../models/enums';
import { Trazo } from '../models/trazo';

@Injectable({
  providedIn: 'root',
})
export class Pageservice {
  private apiUrl = `${environment.apiUrl}/api/paginas`;

  constructor(private http: HttpClient) {}

  // 1. Ver todas las páginas de un cuaderno (miniatura)
  getByNotebook(cuadernoId: number): Observable<Pagina[]> {
    return this.http.get<Pagina[]>(`${this.apiUrl}/cuaderno/${cuadernoId}`);
  }

  // 2. Crear página (al final o insertada en medio)
  create(cuadernoId: number, estiloFondo: Estilo, numeroPagina?: number): Observable<Pagina> {
    const payload = {
      cuadernoId,
      estiloFondo,
      numeroPagina, // Si es null, va al final. Si tiene número, se inserta.
    };
    return this.http.post<Pagina>(this.apiUrl, payload);
  }

  // 3. Cambiar estilo
  changeStyle(paginaId: number, estiloFondo: Estilo): Observable<Pagina> {
    return this.http.put<Pagina>(`${this.apiUrl}/${paginaId}/estilo`, { estiloFondo });
  }

  // 4. Eliminar página (renumera las siguientes)
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getTrazosByPagina(paginaId: number): Observable<Trazo[]> {
    return this.http.get<Trazo[]>(`${environment.apiUrl}/api/trazos/pagina/${paginaId}`);
  }

  // Añade este método en tu Pageservice
  setVisibilidadGrupo(grupoId: string, visible: boolean): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/api/trazos/grupo/${grupoId}/visibilidad`, {
      visible,
    });
  }
}
