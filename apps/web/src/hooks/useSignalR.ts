'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as signalR from '@microsoft/signalr';
import { API_URL } from '@/lib/api-client';

/** Live-sync zleceń między stanowiskami (web) i przyszłą aplikacją mobilną instalatora —
 * jeden hub, jedno zdarzenie 'RequestsChanged', frontend po prostu invaliduje cache zamiast
 * próbować scalać częściowe payloady. Podpięte raz w (main)/layout.tsx, żywotność połączenia
 * = żywotność zalogowanej sesji. */
export function useRequestsRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('monterio_token');
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/monterio`, {
        accessTokenFactory: () => localStorage.getItem('monterio_token') ?? '',
        withCredentials: false, // auth przez token w query stringu, nie przez cookies — CORS bez AllowCredentials
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('RequestsChanged', () => {
      qc.invalidateQueries({ queryKey: ['requests'] });
    });

    connection.start().catch(err => console.error('SignalR: nie udało się połączyć', err));

    return () => {
      connection.stop();
    };
  }, [qc]);
}
