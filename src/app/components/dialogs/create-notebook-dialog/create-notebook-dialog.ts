import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Estilo, Formato } from '../../../models/enums';

export interface NotebookData {
  nombre: string;
  color: string;
  formato: Formato;
  estilo: Estilo;
}

@Component({
  selector: 'app-create-notebook-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatButtonToggleModule,
  ],
  templateUrl: './create-notebook-dialog.html',
  styleUrl: './create-notebook-dialog.css',
})
export class CreateNotebookDialog {
  nombre: string = '';
  colorSeleccionado: string = '#3F51B5'; // Azul por defecto
  formatoSeleccionado: Formato = Formato.A4;
  estiloSeleccionado: Estilo = Estilo.RAYADO;

  // Paleta de colores estilo GoodNotes
  coloresDisponibles = [
    '#3F51B5', // Azul
    '#F44336', // Rojo
    '#4CAF50', // Verde
    '#212121', // Negro
    '#FF9800', // Naranja
    '#9C27B0', // Púrpura
    '#009688', // Turquesa
    '#5D4037', // Café
  ];

  formatos = Object.values(Formato);
  estilos = Object.values(Estilo);

  constructor(
    public dialogRef: MatDialogRef<CreateNotebookDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  cancelar(): void {
    this.dialogRef.close();
  }

  crear(): void {
    if (this.nombre.trim()) {
      const resultado: NotebookData = {
        nombre: this.nombre,
        color: this.colorSeleccionado,
        formato: this.formatoSeleccionado,
        estilo: this.estiloSeleccionado,
      };
      this.dialogRef.close(resultado);
    }
  }
}
