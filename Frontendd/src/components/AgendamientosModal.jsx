import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '../services/api/index.js';
import { Button } from './UI.jsx';

const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const pad = (value) => String(value).padStart(2, '0');

const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const initialFormState = () => ({
  productoId: '',
  productoTexto: '',
  horaProgramada: '09:00',
  titulo: '',
  descripcion: ''
});

const createDateFromArray = (value) => {
  const [year, month = 1, day = 1, hour = 0, minute = 0, second = 0, millisecond = 0] = value;
  if ([year, month, day, hour, minute, second, millisecond].some((part) => typeof part !== 'number')) {
    return null;
  }
  return new Date(year, month - 1, day, hour, minute, second, millisecond);
};

const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  if (Array.isArray(value)) {
    return createDateFromArray(value);
  }
  if (typeof value === 'string') {
    const normalized = value.replace(' ', 'T');
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
    const [datePart] = normalized.split('T');
    if (!datePart) {
      return null;
    }
    const [year, month, day] = datePart.split('-').map((part) => parseInt(part, 10));
    if ([year, month, day].some((part) => Number.isNaN(part))) {
      return null;
    }
    return new Date(year, month - 1, day);
  }
  return null;
};

const parseDateOnly = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    const [datePart] = value.split('T');
    if (datePart) {
      const [year, month, day] = datePart.split('-').map((part) => parseInt(part, 10));
      if ([year, month, day].every((part) => !Number.isNaN(part))) {
        return new Date(year, month - 1, day);
      }
    }
  }
  if (Array.isArray(value)) {
    const [year, month = 1, day = 1] = value;
    if ([year, month, day].every((part) => typeof part === 'number')) {
      return new Date(year, month - 1, day);
    }
  }
  const parsed = parseDateValue(value);
  return parsed ? normalizeDate(parsed) : null;
};

export default function AgendamientosModal({ open, onClose }) {
  const [viewDate, setViewDate] = useState(() => normalizeDate(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => normalizeDate(new Date()));
  const [agendamientos, setAgendamientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [productoMenuOpen, setProductoMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState(() => initialFormState());
  const loadAgendamientos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.agendamientos.getAll();
      setAgendamientos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando agendamientos', err);
      setError(err.message || 'No fue posible cargar los agendamientos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadAgendamientos();
    api.productos.getAll().then(setProductos).catch(() => setProductos([]));
  }, [open, loadAgendamientos]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSuccess(null);
      setForm(initialFormState());
      return;
    }
    setForm(initialFormState());
  }, [open]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 3500);
    return () => clearTimeout(timer);
  }, [success]);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startOffset = (firstDay.getDay() + 6) % 7; // Ajusta para comenzar en lunes
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }).map((_, index) => {
      const dayNumber = index - startOffset + 1;
      const date = new Date(year, month, dayNumber);
      const inCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
      return { date, label: date.getDate(), inCurrentMonth };
    });
  }, [viewDate]);

  const agendamientosPorDia = useMemo(() => {
    return agendamientos.reduce((acc, item) => {
      const fecha = parseDateOnly(item.fechaProgramada) || parseDateOnly(item.fechaEntrega);
      if (!fecha) return acc;
      const key = toDateKey(fecha);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [agendamientos]);

  const selectedDateKey = toDateKey(selectedDate);
  const eventosDelDia = agendamientosPorDia[selectedDateKey] || [];

  const handleDayClick = (day) => {
    setSelectedDate(normalizeDate(day.date));
    if (!day.inCurrentMonth) {
      setViewDate(day.date);
    }
  };

  const handleMonthChange = (delta) => {
    const updated = new Date(viewDate);
    updated.setMonth(viewDate.getMonth() + delta, 1);
    setViewDate(updated);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const productosFiltrados = useMemo(() => {
    const query = (form.productoTexto || '').trim().toLowerCase();
    const list = Array.isArray(productos) ? productos : [];
    if (!query) return list.slice(0, 8);

    return list
      .filter((producto) => (producto?.nombre || '').toLowerCase().includes(query))
      .slice(0, 8);
  }, [form.productoTexto, productos]);

  const handleProductoTextoChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      productoTexto: value,
      productoId: ''
    }));
    setProductoMenuOpen(true);
  };

  const handleProductoSelect = (producto) => {
    setForm((prev) => ({
      ...prev,
      productoId: String(producto.idProducto),
      productoTexto: producto.nombre
    }));
    setProductoMenuOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const productoTextoIngresado = (form.productoTexto || '').trim();
    const productoTextoLower = productoTextoIngresado.toLowerCase();
    const productoCoincidente = !form.productoId && productoTextoLower
      ? productos.find((producto) => (producto?.nombre || '').trim().toLowerCase() === productoTextoLower)
      : null;

    const productoIdFinal = form.productoId || (productoCoincidente ? String(productoCoincidente.idProducto) : '');
    const productoNombreFinal = productoIdFinal ? '' : productoTextoIngresado;

    const hasProductoId = Boolean(productoIdFinal);
    const hasProductoNombre = Boolean(productoNombreFinal);
    if (!hasProductoId && !hasProductoNombre) {
      setSuccess(null);
      setError('Seleccione un producto o ingrese un nombre de producto.');
      return;
    }
    if (!form.titulo.trim()) {
      setSuccess(null);
      setError('Ingrese un título para el agendamiento.');
      return;
    }

    setFormLoading(true);
    setError(null);
    try {
      const [horaStr = '09', minutoStr = '00'] = String(form.horaProgramada || '09:00').split(':');
      const hora = Number.parseInt(horaStr, 10);
      const minuto = Number.parseInt(minutoStr, 10);
      const horaSegura = Number.isFinite(hora) ? hora : 9;
      const minutoSeguro = Number.isFinite(minuto) ? minuto : 0;

      const fechaProgramada = new Date(selectedDate);
      fechaProgramada.setHours(horaSegura, minutoSeguro, 0, 0);
      const fechaEntrega = new Date(selectedDate);
      fechaEntrega.setHours(18, 0, 0, 0);

      const payload = {
        producto: hasProductoId ? { idProducto: parseInt(productoIdFinal, 10) } : null,
        productoNombre: !hasProductoId && hasProductoNombre ? productoNombreFinal : null,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        fechaProgramada: fechaProgramada.toISOString(),
        fechaEntrega: fechaEntrega.toISOString()
      };

      const creado = await api.agendamientos.create(payload);
      setAgendamientos((prev) => [...prev, creado]);
      setForm(initialFormState());
      setSuccess('Agendamiento creado correctamente.');
      setError(null);
    } catch (err) {
      console.error('Error creando agendamiento', err);
      setError(err.message || 'No fue posible crear el agendamiento');
      setSuccess(null);
    } finally {
      setFormLoading(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="agendamientos-overlay" onClick={onClose}>
      <div className="agendamientos-modal" onClick={(event) => event.stopPropagation()}>
        <header className="agendamientos-header">
          <div>
            <h3>Agendamientos</h3>
            <p>Programa la confección y entrega de productos</p>
          </div>
          <Button variant="ghost" small onClick={onClose}>Cerrar</Button>
        </header>

        <div className="agendamientos-body">
          <section className="agendamientos-card agendamientos-calendar">
            <div className="calendar-nav">
              <Button variant="ghost" small onClick={() => handleMonthChange(-1)}>
                ←
              </Button>
              <strong>
                {viewDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
              </strong>
              <Button variant="ghost" small onClick={() => handleMonthChange(1)}>
                →
              </Button>
            </div>
            <div className="calendar-grid">
              {dayLabels.map((label) => (
                <div key={label} className="calendar-day-header">{label}</div>
              ))}
              {calendarDays.map((day) => {
                const key = toDateKey(day.date);
                const eventos = agendamientosPorDia[key] || [];
                const isActive = key === selectedDateKey;
                const hasEvents = eventos.length > 0;
                return (
                  <button
                    type="button"
                    key={key}
                    className={`calendar-cell${day.inCurrentMonth ? '' : ' faded'}${isActive ? ' active' : ''}${hasEvents ? ' has-events' : ''}`}
                    onClick={() => handleDayClick(day)}
                  >
                    <span>{day.label}</span>
                    {hasEvents && (
                      <small>{eventos.length} cita{eventos.length > 1 ? 's' : ''}</small>
                    )}
                  </button>
                );
              })}
            </div>
            {loading && <p className="agendamientos-loading">Actualizando calendario...</p>}
          </section>

          <section className="agendamientos-card agendamientos-events">
            <div className="details-header">
              <h4>{selectedDate.toLocaleDateString('es-CL', { weekday: 'long', month: 'short', day: 'numeric' })}</h4>
              <span>{eventosDelDia.length} agendamiento(s)</span>
            </div>

            <div className="event-list">
              {eventosDelDia.length === 0 && (
                <p className="agendamientos-empty">No hay agendamientos para este día.</p>
              )}
              {eventosDelDia.map((evento) => {
                const entrega = parseDateValue(evento.fechaEntrega);
                const entregaLabel = entrega
                  ? entrega.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
                  : 'Hora sin definir';
                const productoLabel = evento.producto?.nombre || evento.productoNombre;
                return (
                  <article
                    key={evento.idAgendamiento || `${evento.titulo}-${evento.fechaProgramada}`}
                    className="event-card"
                  >
                    <div>
                      <strong>{evento.titulo}</strong>
                      <p>{evento.descripcion || 'Sin descripción'}</p>
                      {productoLabel && (
                        <small>Producto: {productoLabel}</small>
                      )}
                    </div>
                    <small>Entrega: {entregaLabel}</small>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="agendamientos-card agendamientos-form-card">
            <form className="agendamientos-form" onSubmit={handleSubmit}>
              <h4>Nuevo Agendamiento</h4>
              <div className="agendamientos-form-subtitle">
                {selectedDate.toLocaleDateString('es-CL', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long'
                })}
              </div>
              <label>
                Producto
                <div className="agendamientos-producto-combo">
                  <input
                    type="text"
                    name="productoTexto"
                    value={form.productoTexto}
                    onChange={handleProductoTextoChange}
                    onFocus={() => setProductoMenuOpen(true)}
                    onBlur={() => setTimeout(() => setProductoMenuOpen(false), 120)}
                    placeholder="Escribe para buscar o crear"
                    autoComplete="off"
                  />

                  {productoMenuOpen && productosFiltrados.length > 0 && (
                    <div className="agendamientos-producto-options" role="listbox">
                      {productosFiltrados.map((producto) => (
                        <button
                          key={producto.idProducto}
                          type="button"
                          className="agendamientos-producto-option"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleProductoSelect(producto)}
                        >
                          {producto.nombre}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </label>

              <label>
                Hora
                <input
                  type="time"
                  name="horaProgramada"
                  value={form.horaProgramada}
                  onChange={handleInputChange}
                />
              </label>

              <label>
                Título
                <input
                  type="text"
                  name="titulo"
                  value={form.titulo}
                  onChange={handleInputChange}
                  placeholder="Ej: Carteras personalizadas"
                />
              </label>

              <label>
                Descripción
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Notas adicionales"
                />
              </label>

              <Button type="submit" disabled={formLoading} small>
                {formLoading ? 'Guardando...' : 'Guardar agendamiento'}
              </Button>
            </form>
          </section>
        </div>

        <div className="agendamientos-message-slot" aria-live="polite">
          {(error || success) && (
            <div className={`agendamientos-message ${success ? 'success' : 'error'}`}>
              {error || success}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
