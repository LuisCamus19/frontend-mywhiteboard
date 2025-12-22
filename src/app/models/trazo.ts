export interface Trazo {
  id?: string;
  grupoId?: string;
  usuario?: string;

  visible: boolean;
  xInicial: number;
  yInicial: number;
  xFinal: number;
  yFinal: number;

  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;

  color: string;
  grosor: number;

  // Contexto
  salaId?: string; // Para Pizarra Infinita
  paginaId?: number; // Para Cuadernos
}
