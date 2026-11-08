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
  if (!isAuthenticated) return <main className="login-page">
    <div className="login-orb login-orb-one" aria-hidden="true" />
    <div className="login-orb login-orb-two" aria-hidden="true" />
    <section className="login-card" aria-labelledby="login-title">
      <div className="brand-row"><span className="brand-mark" aria-hidden="true">UNA</span><span>Seguridad Informática</span></div>
      <div className="shield-icon" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M24 4 40 10v11c0 10.2-6.8 18.8-16 23-9.2-4.2-16-12.8-16-23V10l16-6Z" stroke="currentColor" strokeWidth="3"/><path d="m16 24 5 5 11-12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
      <p className="eyebrow">PLATAFORMA PROTEGIDA</p>
      <h1 id="login-title">Chat seguro UNA</h1>
      <p className="login-copy">Ingresa para comunicarte en un espacio protegido y vinculado a tu identidad institucional.</p>
      {error && <p className="login-error" role="alert">No fue posible iniciar sesión: {error.message}</p>}
      <div className="login-actions">
        <button className="login-primary" onClick={() => loginWithRedirect()}><span>Iniciar sesión</span><span aria-hidden="true">→</span></button>
        <button className="login-secondary" onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}>Crear una cuenta</button>
      </div>
      <div className="security-note"><span className="status-dot" aria-hidden="true" /> Autenticación segura con Auth0</div>
    </section>
    <p className="login-footer">Universidad Nacional · Laboratorio 8</p>
  </main>;
  return <><header className="chat-header"><div><p className="chat-kicker">UNA</p><h1>Chat seguro</h1><p className="chat-subtitle">Comparte mensajes, imágenes y videos validados.</p></div><div className="account"><span className="account-name">{user.name || user.email}</span><button className="logout" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>Cerrar sesión</button></div></header><Chat user={user} /></>;
}
