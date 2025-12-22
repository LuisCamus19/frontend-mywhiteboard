import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface DialogData {
  titulo: string;
  mensaje: string;
  valorInicial?: string;
}

@Component({
  selector: 'app-input-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './input-dialog.html',
  styleUrl: './input-dialog.css',
})
export class InputDialog {
  valor: string = '';

  constructor(
    public dialogRef: MatDialogRef<InputDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    // Si queremos editar nombre, aquí vendría el valor inicial
    this.valor = data.valorInicial || '';
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  aceptar(): void {
    if (this.valor.trim()) {
      this.dialogRef.close(this.valor);
    }
  }
}
