// Mismos ids de módulo usados en el objeto `permisos` del JWT y en shared_components/Sidebar.jsx
export const MODULOS_SISTEMA = [
  { id: 'rrhh', label: 'RRHH' },
  { id: 'mantenciones', label: 'Mantención' },
  { id: 'prevencion', label: 'Prevención' },
  { id: 'acreditacion', label: 'Acreditación' },
  { id: 'operacion', label: 'Operación' },
  { id: 'bodega', label: 'Bodega' },
  { id: 'facturacion', label: 'Facturación' },
  { id: 'administracion', label: 'Administración' },
  { id: 'watchdog', label: 'Watchdog' },
]

export function labelDeModulo(id) {
  return MODULOS_SISTEMA.find(m => m.id === id)?.label || id
}
