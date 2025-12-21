import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { Subject } from 'rxjs';
import SockJS from 'sockjs-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebSocketservice {
  private clienteStomp!: Client;

  // Canales observables para que el Tablero se suscriba
  public trazos$ = new Subject<any>();
  public cursores$ = new Subject<any>();

  /**
   * Conecta al WebSocket y se suscribe a los canales de la sala.
   * @param salaId
   */
  conectar(salaId: string) {
    const socketUrl = `${environment.apiUrl}/ws-pizarra`;

    this.clienteStomp = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log(`✅ Conectado a WebSocket en sala: ${salaId}`);

        // 1. Suscripción al canal principal (Dibujos, Borrados, Undo/Redo)
        this.clienteStomp.subscribe(`/tema/tablero/${salaId}`, (mensaje) => {
          if (mensaje.body) {
            this.trazos$.next(JSON.parse(mensaje.body));
          }
        });

        this.clienteStomp.subscribe(`/tema/cursores/${salaId}`, (mensaje) => {
          if (mensaje.body) {
            this.cursores$.next(JSON.parse(mensaje.body));
          }
        });
      },
      onStompError: (frame) => {
        console.error('❌ Error de STOMP:', frame);
      },
    });

    this.clienteStomp.activate();
  }

  enviarTrazo(salaId: string, trazo: any) {
    if (this.clienteStomp && this.clienteStomp.connected) {
      this.clienteStomp.publish({
        destination: `/app/dibujar/${salaId}`,
        body: JSON.stringify(trazo),
      });
    }
  }

  enviarCursor(salaId: string, data: any) {
    if (this.clienteStomp && this.clienteStomp.connected) {
      this.clienteStomp.publish({
        destination: `/app/cursor/${salaId}`,
        body: JSON.stringify(data),
      });
    }
  }

  enviarDeshacer(salaId: string, usuario: string) {
    if (this.clienteStomp && this.clienteStomp.connected) {
      this.clienteStomp.publish({
        destination: `/app/deshacer/${salaId}`,
        body: JSON.stringify({ usuario }), // Enviamos quién pide deshacer
      });
    }
  }


  enviarRehacer(salaId: string, usuario: string) {
    if (this.clienteStomp && this.clienteStomp.connected) {
      this.clienteStomp.publish({
        destination: `/app/rehacer/${salaId}`,
        body: JSON.stringify({ usuario }),
      });
    }
  }


  borrarPizarra(salaId: string) {
    return { subscribe: () => {} } as any;
  }

  desconectar() {
    if (this.clienteStomp) {
      this.clienteStomp.deactivate();
      console.log('🔌 WebSocket desconectado');
    }
  }
}
