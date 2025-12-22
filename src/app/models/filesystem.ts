import { Estilo, Formato } from "./enums";
import { Trazo } from "./trazo";


export interface Pagina {
  id: number;
  numeroPagina: number;
  estiloFondo: Estilo;
  cuadernoId: number;
  // Opcional: Puede venir vacío al listar, o lleno al editar
  trazos?: Trazo[];
}

export interface Cuaderno {
  id: number;
  nombre: string;
  colorPortada: string;
  formato: Formato;
  estiloPredeterminado: Estilo;
  fechaCreacion?: string;
  fechaModificacion?: string;
  propietarioUsername?: string;
  carpetaId?: number;
  paginas?: Pagina[];
}

export interface Carpeta {
  id: number;
  nombre: string;
  color: string;
  fechaCreacion?: string;
  propietarioUsername?: string;
  carpetaPadreId?: number;

  // Recursividad: Una carpeta contiene listas de otras cosas
  subcarpetas?: Carpeta[];
  cuadernos?: Cuaderno[];
}
