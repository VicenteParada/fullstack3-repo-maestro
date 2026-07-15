import { useState, useEffect } from 'react';
import RendicionForm from './components/RendicionForm';
import RendicionList from './components/RendicionList';
import { Sidebar, Header, checkModuleAccess } from '../../shared_components';

function App() {
  const [activeTab, setActiveTab] = useState('bandeja');
  const [permiso, setPermiso] = useState('none');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const nivel = checkModuleAccess('rendiciones', '/rendiciones/');
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
    { id: 'bandeja', label: 'Rendiciones', icon: '🧾' },
    { id: 'crear', label: 'Nueva Rendición', icon: '➕', requiresEdit: true },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar
        moduleName="Rendiciones"
        accentColor="emerald"
        activePath="/rendiciones/"
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
          gradient="from-emerald-600 via-teal-500 to-cyan-400"
        />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {activeTab === 'crear' && permiso === 'edit' && (
              <RendicionForm onCreated={() => { setRefreshKey(k => k + 1); setActiveTab('bandeja'); }} />
            )}
            {activeTab === 'bandeja' && <RendicionList permiso={permiso} refreshKey={refreshKey} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
