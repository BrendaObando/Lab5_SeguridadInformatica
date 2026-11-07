import { useEffect, useMemo, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { io } from 'socket.io-client';

function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const socket = useMemo(() => io(import.meta.env.DEV ? 'http://localhost:3000' : undefined), []);
  useEffect(() => {
    const receive = (raw) => setMessages((current) => [...current, JSON.parse(raw)]);
    socket.on('Evento-Mensaje-Server', receive);
    return () => { socket.off('Evento-Mensaje-Server', receive); socket.close(); };
  }, [socket]);
  const send = (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    socket.emit('Evento-Mensaje-Server', JSON.stringify({ nombre: user.name || user.email || 'Usuario', mensaje: message, color: '#244c70' }));
    setMessage('');
  };
  return <><main className="chat-shell"><ul id="messages" aria-live="polite">{messages.map((item, index) => <li className="chat-message" key={`${index}-${item.mensaje}`}><b className="message-author" style={{ color: item.color }}>{item.nombre}: </b><span className="message-text">{item.mensaje}</span></li>)}</ul></main><form className="chat-composer" onSubmit={send} aria-label="Compositor de mensajes"><label className="field" htmlFor="message">Mensaje<input id="message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Escriba un mensaje" autoComplete="off" /></label><button type="submit">Enviar</button></form></>;
}

export default function App() {
  const { isLoading, isAuthenticated, error, user, loginWithRedirect, logout } = useAuth0();
  if (isLoading) return <p className="centered">Cargando autenticación…</p>;
  if (!isAuthenticated) return <main className="centered"><h1>Chat seguro UNA</h1>{error && <p role="alert">{error.message}</p>}<button onClick={() => loginWithRedirect()}>Iniciar sesión</button><button onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}>Registrarse</button></main>;
  return <><header className="chat-header"><div><p className="chat-kicker">UNA</p><h1>Chat seguro</h1><p className="chat-subtitle">Comparte mensajes, imágenes y videos validados.</p></div><div className="account"><span className="account-name">{user.name || user.email}</span><button className="logout" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>Cerrar sesión</button></div></header><Chat user={user} /></>;
}
