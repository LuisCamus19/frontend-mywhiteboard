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

  URL_API = 'http://localhost:8080/api/salas';

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
    this.http.get<any[]>(this.URL_API).subscribe((data) => (this.misSalas = data));
  }

  cargarCompartidas() {
    this.http
      .get<any[]>(`${this.URL_API}/compartidas`)
      .subscribe((data) => (this.salasCompartidas = data));
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
    event.stopPropagation(); // Evitar entrar a la sala
    this.dialog.open(DialogoColaboradores, {
      width: '400px',
      data: { salaId: salaId },
    });
  }

  borrarSala(id: string, event: Event) {
    event.stopPropagation();
    if (!confirm('⚠️ ¿Borrar pizarra permanentemente?')) return;
    this.http.delete(`http://localhost:8080/api/pizarra/${id}`).subscribe({
      next: () => {
        this.snackBar.open('🗑️ Eliminada', 'Ok');
        this.cargarMisSalas();
      },
      error: () => this.snackBar.open('❌ Error al borrar', 'Cerrar'),
    });
  }

  logout() {
    this.authService.logout();
  }
}
