import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import importSockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import SockJS from 'sockjs-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebSocketservice {
  private clienteStomp!: Client;

  public trazos$ = new Subject<any>();
  public cursores$ = new Subject<any>(); // 🔥 NUEVO: Canal de cursores

  conectar(salaId: string) {

    const socketUrl = `${environment.apiUrl}/ws-pizarra`;

    this.clienteStomp = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      onConnect: () => {
        console.log('✅ Conectado a WebSocket en la nube');

        this.clienteStomp.subscribe(`/tema/tablero/${salaId}`, (mensaje) => {
          this.trazos$.next(JSON.parse(mensaje.body));
        });

        this.clienteStomp.subscribe(`/tema/cursores/${salaId}`, (mensaje) => {
          this.cursores$.next(JSON.parse(mensaje.body));
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

  // 🔥 NUEVO: Enviar mi posición
  enviarCursor(salaId: string, data: any) {
    if (this.clienteStomp && this.clienteStomp.connected) {
      this.clienteStomp.publish({
        destination: `/app/cursor/${salaId}`,
        body: JSON.stringify(data),
      });
    }
  }

  borrarPizarra(salaId: string) {
    // Retornamos un observable dummy o implementas la llamada HTTP aquí si prefieres
    // Pero como lo haces desde el componente con HttpClient, esto es solo para cumplir tipado si lo usabas
    return { subscribe: () => {} } as any;
  }

  obtenerHistorial(salaId: string) {
    // Este método lo reemplazamos por HTTP directo en el componente,
    // pero si lo usas aquí, necesitarías inyectar HttpClient.
    // Para simplificar, dejaremos que el componente haga el GET HTTP.
    // Retorno un observable vacio para que no rompa si lo llamas.
    const subject = new Subject<any[]>();
    setTimeout(() => subject.next([]), 100);
    return subject;
  }
}
