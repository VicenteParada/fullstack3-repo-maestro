import { useState, useEffect } from 'react';
import { SolicitudForm, SolicitudList } from './components';
import { Sidebar, Header, checkModuleAccess } from '../../shared_components';

function App() {
  const [activeTab, setActiveTab] = useState('bandeja');
  const [permiso, setPermiso] = useState('none');

  useEffect(() => {
    const nivel = checkModuleAccess('solicitudes', '/solicitudes/');
    if (nivel !== 'none') {
      setPermiso(nivel);
      if (nivel === 'view') setActiveTab('bandeja');
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login/';
  };

  if (permiso === 'none') return null;

  const menuItems = [
    { id: 'bandeja', label: 'Bandeja', icon: '📨' },
    { id: 'crear', label: 'Nueva Solicitud', icon: '✉️', requiresEdit: true },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar
        moduleName="Solicitudes"
        accentColor="amber"
        activePath="/solicitudes/"
        permiso={permiso}
        badge={permiso === 'edit' ? 'Modo Editor' : 'Solo Lectura'}
        menuItems={menuItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={menuItems.find((i) => i.id === activeTab)?.label}
          gradient="from-amber-600 via-orange-500 to-yellow-400"
        >
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
          >
            Cerrar Sesión
          </button>
        </Header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'crear' && permiso === 'edit' && (
              <SolicitudForm onCreated={() => setActiveTab('bandeja')} />
            )}
            {activeTab === 'bandeja' && <SolicitudList permiso={permiso} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
