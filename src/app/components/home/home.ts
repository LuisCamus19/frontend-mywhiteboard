import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { Authservice } from '../../services/authservice';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Salasservice } from '../../services/salasservice';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DialogoColaboradores } from '../dialogo-colaboradores/dialogo-colaboradores';

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
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  public misSalas: any[] = [];
  public salasCompartidas: any[] = [];
  public seccionActual: string = 'MIS_SALAS';
  public nuevoNombre: string = '';
  public usuarioActual: string = '';
  public isMobile: boolean = false;

  constructor(
    private router: Router,
    private authService: Authservice,
    private salasService: Salasservice,
    private breakpointObserver: BreakpointObserver,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.usuarioActual = this.authService.getUsername();
  }

  ngOnInit() {
    this.cargarSalas();
    this.cargarCompartidas();

    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .subscribe((result) => (this.isMobile = result.matches));
  }

  cargarSalas() {
    this.salasService.listarMisSalas().subscribe({
      next: (data) => (this.misSalas = data),
      error: () => this.mostrarNotificacion('Error al cargar salas', '❌'),
    });
  }

  cargarCompartidas() {
    this.salasService.listarCompartidas().subscribe({
      next: (data) => (this.salasCompartidas = data),
      error: () => this.mostrarNotificacion('Error al cargar compartidas', '❌'),
    });
  }

  crearSala() {
    if (!this.nuevoNombre.trim()) return;
    const nuevaSala = { titulo: this.nuevoNombre };

    this.salasService.crearSala(nuevaSala).subscribe({
      next: () => {
        this.nuevoNombre = '';
        this.mostrarNotificacion('Pizarra creada con éxito', '✨');
        this.cargarSalas();
      },
      error: () => this.mostrarNotificacion('Error al crear pizarra', '⚠️'),
    });
  }

  borrarSala(salaId: string, event: Event) {
    event.stopPropagation();
    if (confirm('¿Eliminar esta pizarra permanentemente?')) {
      this.salasService.borrarSala(salaId).subscribe(() => {
        this.misSalas = this.misSalas.filter((s) => s.id !== salaId);
        this.mostrarNotificacion('Pizarra eliminada', '🗑️');
      });
    }
  }

  irASala(salaId: string) {
    // 🔥 DEBUG: Ver qué está llegando
    console.log('👉 Intentando entrar a sala con ID:', salaId);

    if (!salaId) {
      console.error('❌ Error: El ID de la sala es undefined o null');
      this.mostrarNotificacion('Error: ID de sala inválido', '⚠️');
      return;
    }

    // Si llega aquí, intenta navegar
    this.router
      .navigate(['/tablero', salaId])
      .then((success) => {
        if (success) {
          console.log('✅ Navegación exitosa');
        } else {
          console.error('❌ El Router no pudo navegar (¿Ruta protegida?)');
        }
      })
      .catch((err) => console.error('❌ Error crítico del router:', err));
  }

  // 🔥 CAMBIO PRINCIPAL: Abrir Diálogo
  abrirInvitar(salaId: string, event: Event) {
    event.stopPropagation();

    this.dialog.open(DialogoColaboradores, {
      width: '400px',
      data: { salaId: salaId },
      panelClass: 'glass-dialog',
      autoFocus: false,
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.mostrarNotificacion('Sesión cerrada', '👋');
  }

  private mostrarNotificacion(mensaje: string, icono: string) {
    this.snackBar.open(`${icono} ${mensaje}`, 'OK', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['glass-snackbar'],
    });
  }
}
