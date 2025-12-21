import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { Authservice } from '../../services/authservice';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DialogoColaboradores } from '../dialogo-colaboradores/dialogo-colaboradores';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatSidenavModule,
    MatListModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  misSalas: any[] = [];
  salasCompartidas: any[] = [];
  nuevoNombre: string = '';
  seccionActual: 'MIS_SALAS' | 'COMPARTIDAS' = 'MIS_SALAS';

  // ✅ CAMBIO: Usar la URL del environment en lugar de localhost
  private URL_API = `${environment.apiUrl}/api/salas`;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: Authservice,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.cargarMisSalas();
    this.cargarCompartidas();
  }

  cargarMisSalas() {
    this.http.get<any[]>(this.URL_API).subscribe({
      next: (data) => (this.misSalas = data),
      error: (err) => console.error('Error cargando mis salas', err),
    });
  }

  cargarCompartidas() {
    this.http.get<any[]>(`${this.URL_API}/compartidas`).subscribe({
      next: (data) => (this.salasCompartidas = data),
      error: (err) => console.error('Error cargando compartidas', err),
    });
  }

  crearSala() {
    if (!this.nuevoNombre.trim()) return;
    this.http.post<any>(this.URL_API, { titulo: this.nuevoNombre }).subscribe((sala) => {
      this.router.navigate(['/pizarra', sala.id]);
    });
  }

  irASala(id: string) {
    this.router.navigate(['/pizarra', id]);
  }

  abrirInvitar(salaId: string, event: Event) {
    event.stopPropagation();
    this.dialog.open(DialogoColaboradores, {
      width: '400px',
      data: { salaId: salaId },
    });
  }

  borrarSala(id: string, event: Event) {
    event.stopPropagation();
    if (!confirm('⚠️ ¿Borrar pizarra permanentemente?')) return;

    // ✅ CAMBIO: Aquí también usamos environment.apiUrl
    this.http.delete(`${environment.apiUrl}/api/salas/${id}`).subscribe({
      next: () => {
        this.snackBar.open('🗑️ Eliminada', 'Ok', { duration: 3000 });
        this.cargarMisSalas();
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('❌ Error al borrar', 'Cerrar', { duration: 3000 });
      },
    });
  }

  logout() {
    this.authService.logout();
  }
}
