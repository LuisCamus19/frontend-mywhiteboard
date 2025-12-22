import { Component, OnInit } from '@angular/core';
import { Carpeta, Cuaderno } from '../../models/filesystem';
import { Foldersevice } from '../../services/foldersevice';
import { Notebookservice } from '../../services/notebookservice';
import { Router } from '@angular/router';
import { Formato } from '../../models/enums';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InputDialog } from '../dialogs/input-dialog/input-dialog';
import {
  CreateNotebookDialog,
  NotebookData,
} from '../dialogs/create-notebook-dialog/create-notebook-dialog';
import { Pageservice } from '../../services/pageservice';

@Component({
  selector: 'app-file-explorer',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './file-explorer.html',
  styleUrl: './file-explorer.css',
})
export class FileExplorer implements OnInit {
  // Estado de navegación
  carpetaActualId: number | null = null;
  rutaNavegacion: { id: number | null; nombre: string }[] = [{ id: null, nombre: 'Inicio' }];

  // Datos y Estado UI
  carpetas: Carpeta[] = [];
  cuadernos: Cuaderno[] = [];
  loading = false;

  constructor(
    private folderService: Foldersevice,
    private notebookService: Notebookservice,
    private pageService: Pageservice,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.cargarContenido();
  }

  cargarContenido() {
    this.loading = true;

    if (this.carpetaActualId === null) {
      // Carga Raíz
      this.folderService.getRoots().subscribe((res) => (this.carpetas = res));
      this.notebookService.getRoots().subscribe((res) => {
        this.cuadernos = res;
        this.loading = false;
      });
    } else {
      // Carga Contenido de Carpeta
      this.folderService.getContent(this.carpetaActualId).subscribe({
        next: (carpeta) => {
          this.carpetas = carpeta.subcarpetas || [];
          this.cuadernos = carpeta.cuadernos || [];
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        },
      });
    }
  }

  // --- NAVEGACIÓN ---

  entrarEnCarpeta(carpeta: Carpeta) {
    this.carpetaActualId = carpeta.id;
    this.rutaNavegacion.push({ id: carpeta.id, nombre: carpeta.nombre });
    this.cargarContenido();
  }

  abrirCuaderno(id: number) {
    this.router.navigate(['/cuaderno', id]);
  }

  irAMigaja(index: number) {
    const destino = this.rutaNavegacion[index];
    this.carpetaActualId = destino.id;
    this.rutaNavegacion = this.rutaNavegacion.slice(0, index + 1);
    this.cargarContenido();
  }

  // --- ACCIONES ---

  crearCarpeta() {
    const dialogRef = this.dialog.open(InputDialog, {
      width: '400px',
      data: {
        titulo: 'Nueva Carpeta',
        mensaje: 'Ingresa un nombre para organizar tus archivos.',
      },
    });

    dialogRef.afterClosed().subscribe((nombre) => {
      if (nombre) {
        this.folderService
          .create(nombre, '#4fc3f7', this.carpetaActualId || undefined)
          .subscribe(() => this.cargarContenido());
      }
    });
  }

  crearCuaderno() {
    const dialogRef = this.dialog.open(CreateNotebookDialog, {
      width: '650px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result: NotebookData) => {
      if (result) {
        // 1. Creamos el cuaderno enviando el estilo inicial para que el objeto lo tenga
        this.notebookService
          .create(
            result.nombre,
            result.color,
            result.formato,
            this.carpetaActualId || undefined,
            result.estilo // <--- Pasa el estilo al servicio de cuaderno
          )
          .subscribe((nuevoCuaderno) => {
            // 2. Creamos la primera página con el estilo elegido
            this.pageService.create(nuevoCuaderno.id, result.estilo).subscribe(() => {
              this.router.navigate(['/cuaderno', nuevoCuaderno.id]);
            });
          });
      }
    });
  }

  borrarCarpeta(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Eliminar carpeta?')) {
      this.folderService.delete(id).subscribe(() => this.cargarContenido());
    }
  }

  borrarCuaderno(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Eliminar cuaderno?')) {
      this.notebookService.delete(id).subscribe(() => this.cargarContenido());
    }
  }
}
