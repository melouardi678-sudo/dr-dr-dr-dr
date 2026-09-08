import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Printer,
  FileSpreadsheet,
  Clock,
  Trash2,
  Edit,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
} from 'lucide-react';
import { Appointment, AppointmentStatus, Patient, CabinetSettings } from '../../types';
import { triggerPrintDocument } from '../../utils/pdfPrint';
import { APPOINTMENT_STATUS_MAP, getStatusConfig } from '../../utils/statusConfig';

interface AgendaViewProps {
  appointments: Appointment[];
  patients: Patient[];
  settings: CabinetSettings;
  onSaveAppointments: (apts: Appointment[]) => void;
  onOpenPatientDetail: (patientId: string) => void;
  onOpenPrintable?: (type: 'schedule', data: { schedule: { date: string; appointments: Appointment[] } }) => void;
}

const StatusSelector: React.FC<{
  currentStatus: AppointmentStatus;
  onChange: (newStatus: AppointmentStatus) => void;
}> = ({ currentStatus, onChange }) => {
  const cfg = getStatusConfig(currentStatus);

  return (
    <select
      value={currentStatus}
      onChange={(e) => {
        e.stopPropagation();
        onChange(e.target.value as AppointmentStatus);
      }}
      onClick={(e) => e.stopPropagation()}
      style={{
        backgroundColor: cfg.hex,
        color: cfg.textColor,
        borderColor: cfg.hex,
      }}
      className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm transition-all duration-150"
    >
      {Object.entries(APPOINTMENT_STATUS_MAP).map(([key, config]) => (
        <option
          key={key}
          value={key}
          style={{
            backgroundColor: '#0F172A',
            color: '#F8FAFC',
          }}
        >
          {config.label}
        </option>
      ))}
    </select>
  );
};

const StatusBadge: React.FC<{ status: AppointmentStatus | string }> = ({ status }) => {
  const cfg = getStatusConfig(status);
  return (
    <span
      style={{
        backgroundColor: cfg.hex,
        color: cfg.textColor,
      }}
      className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase shadow-sm tracking-wider inline-flex items-center"
    >
      {cfg.label}
    </span>
  );
};

export const AgendaView: React.FC<AgendaViewProps> = ({
  appointments,
  patients,
  settings,
  onSaveAppointments,
  onOpenPatientDetail,
  onOpenPrintable,
}) => {
  const [calendarMode, setCalendarMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal State for New/Edit Appointment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

  // Form State
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(selectedDate);
  const [time, setTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>('confirmed');
  const [notes, setNotes] = useState('');

  // Handle opening modal for new appointment
  const handleOpenNew = () => {
    setEditingApt(null);
    setPatientId(patients[0]?.id || '');
    setPatientName(patients[0] ? `${patients[0].lastName} ${patients[0].firstName}` : '');
    setPhone(patients[0]?.phone || '');
    setDate(selectedDate);
    setTime('10:00');
    setDurationMinutes(30);
    setReason('Consultation Générale');
    setStatus('confirmed');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleSelectPatientChange = (pId: string) => {
    setPatientId(pId);
    const found = patients.find((p) => p.id === pId);
    if (found) {
      setPatientName(`${found.lastName} ${found.firstName}`);
      setPhone(found.phone);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    if (editingApt) {
      const updated = appointments.map((a) =>
        a.id === editingApt.id
          ? {
              ...a,
              patientId,
              patientName,
              phone,
              date,
              time,
              durationMinutes,
              reason,
              status,
              notes,
            }
          : a
      );
      onSaveAppointments(updated);
    } else {
      const newApt: Appointment = {
        id: `apt_${Date.now()}`,
        patientId: patientId || `pat_temp_${Date.now()}`,
        patientName,
        phone,
        date,
        time,
        durationMinutes,
        reason,
        status,
        notes,
        createdAt: new Date().toISOString(),
      };
      onSaveAppointments([newApt, ...appointments]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const apt = appointments.find((a) => a.id === id);
    if (apt) {
      setAppointmentToDelete(apt);
    }
  };

  const confirmDeleteAppointment = () => {
    if (!appointmentToDelete) return;
    onSaveAppointments(appointments.filter((a) => a.id !== appointmentToDelete.id));
    setAppointmentToDelete(null);
  };

  const handleUpdateStatus = (id: string, newStatus: AppointmentStatus) => {
    const updated = appointments.map((a) => (a.id === id ? { ...a, status: newStatus } : a));
    onSaveAppointments(updated);
  };

  // Filtered appointments calculation
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.phone.includes(searchQuery);

    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;

    if (calendarMode === 'day') {
      return apt.date === selectedDate && matchesSearch && matchesStatus;
    }
    return matchesSearch && matchesStatus;
  });

  // Export to CSV / Excel
  const handleExportExcel = () => {
    let csv = 'ID;Date;Heure;Patient;Telephone;Motif;Statut\n';
    filteredAppointments.forEach((a) => {
      csv += `${a.id};${a.date};${a.time};${a.patientName};${a.phone};"${a.reason}";${a.status}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Agenda_MediCab_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate Week Days
  const getWeekDays = () => {
    const baseDate = new Date(selectedDate);
    const dayOfWeek = baseDate.getDay();
    const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + distanceToMon);

    const days = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      const dayNumber = d.getDate();
      days.push({
        dateStr,
        dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        dayNumber,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }
    return days;
  };

  // Calculate Month Days
  const getMonthDays = () => {
    const parts = selectedDate.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay();
    if (startDayOfWeek === 0) startDayOfWeek = 7;

    const days = [];
    const todayStr = new Date().toISOString().split('T')[0];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i > 0; i--) {
      const pDate = new Date(year, month - 1, prevMonthLastDay - i + 1);
      const dateStr = pDate.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNumber: pDate.getDate(),
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const cDate = new Date(year, month, day);
      const dateStr = cDate.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }

    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let day = 1; day <= remaining; day++) {
        const nDate = new Date(year, month + 1, day);
        const dateStr = nDate.toISOString().split('T')[0];
        days.push({
          dateStr,
          dayNumber: day,
          isCurrentMonth: false,
          isToday: dateStr === todayStr,
          isSelected: dateStr === selectedDate,
        });
      }
    }

    return days;
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Agenda & Gestion des Rendez-vous</h1>
            <p className="text-xs text-slate-400">Planning du cabinet et liste d'attente</p>
          </div>
        </div>

        {/* View mode toggle & Date Navigator */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['day', 'week', 'month'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setCalendarMode(m)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition capitalize ${
                  calendarMode === m
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'day' ? 'Jour' : m === 'week' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-white">
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                if (calendarMode === 'day') d.setDate(d.getDate() - 1);
                else if (calendarMode === 'week') d.setDate(d.getDate() - 7);
                else if (calendarMode === 'month') d.setMonth(d.getMonth() - 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className="p-1 hover:text-emerald-400"
              title="Précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-xs text-emerald-400 focus:outline-none"
            />
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                if (calendarMode === 'day') d.setDate(d.getDate() + 1);
                else if (calendarMode === 'week') d.setDate(d.getDate() + 7);
                else if (calendarMode === 'month') d.setMonth(d.getMonth() + 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className="p-1 hover:text-emerald-400"
              title="Suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleOpenNew}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md border border-emerald-500/80 hover:brightness-105 hover:border-emerald-400 flex items-center space-x-1.5 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau RDV</span>
          </button>
        </div>
      </div>

      {/* Filter and Export Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Rechercher patient, motif, tél..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-700 px-2 py-1.5 rounded-lg text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 text-xs text-white focus:outline-none font-medium"
            >
              <option value="all" className="bg-slate-900 text-white">Tous les statuts</option>
              {Object.entries(APPOINTMENT_STATUS_MAP).map(([key, cfg]) => (
                <option key={key} value={key} className="bg-slate-900 text-white">
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => {
              if (onOpenPrintable) {
                onOpenPrintable('schedule', {
                  schedule: { date: selectedDate, appointments: filteredAppointments },
                });
              } else {
                triggerPrintDocument(`Planning_${selectedDate}`);
              }
            }}
            className="px-3 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 hover:border-slate-500 hover:brightness-105 transition-all duration-200"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Imprimer Planning</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 hover:border-slate-500 hover:brightness-105 transition-all duration-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        {/* Legend bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <h2 className="font-bold text-sm text-white">
            Planning : <span className="text-emerald-400 font-mono">{selectedDate}</span> ({filteredAppointments.length} RDV)
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            {Object.entries(APPOINTMENT_STATUS_MAP).map(([key, cfg]) => (
              <span key={key} className="flex items-center space-x-1.5">
                <span
                  style={{ backgroundColor: cfg.hex }}
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-slate-800 shadow-sm"
                />
                <span className="text-slate-300 font-medium">{cfg.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* DAY VIEW */}
        {calendarMode === 'day' && (
          <div>
            {filteredAppointments.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs space-y-3">
                <Calendar className="w-10 h-10 mx-auto text-slate-600" />
                <p>Aucun rendez-vous trouvé pour cette date.</p>
                <button
                  onClick={handleOpenNew}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Planifier un Rendez-vous</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Heure</th>
                      <th className="p-3">Patient</th>
                      <th className="p-3">Téléphone</th>
                      <th className="p-3">Motif Consultation</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredAppointments.map((apt) => (
                      <tr
                        key={apt.id}
                        onDoubleClick={() => apt.patientId && onOpenPatientDetail(apt.patientId)}
                        className="hover:bg-slate-800/40 transition-all duration-200 cursor-pointer group"
                        title="Double-cliquez pour ouvrir le dossier médical"
                      >
                        <td className="p-3 font-mono font-bold text-emerald-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{apt.time}</span>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-white uppercase text-xs group-hover:text-emerald-400 transition">
                            {apt.patientName}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Double-clic = Dossier EHR
                          </div>
                        </td>

                        <td className="p-3 font-mono text-slate-400">{apt.phone}</td>

                        <td className="p-3 font-medium text-slate-300">{apt.reason}</td>

                        <td className="p-3">
                          <StatusSelector
                            currentStatus={apt.status}
                            onChange={(newStatus) => handleUpdateStatus(apt.id, newStatus)}
                          />
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingApt(apt);
                                setPatientId(apt.patientId);
                                setPatientName(apt.patientName);
                                setPhone(apt.phone);
                                setDate(apt.date);
                                setTime(apt.time);
                                setDurationMinutes(apt.durationMinutes);
                                setReason(apt.reason);
                                setStatus(apt.status);
                                setNotes(apt.notes || '');
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                              title="Modifier RDV"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(apt.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                              title="Supprimer RDV"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* WEEK VIEW */}
        {calendarMode === 'week' && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {getWeekDays().map((day) => {
              const dayApts = filteredAppointments.filter((a) => a.date === day.dateStr);
              return (
                <div
                  key={day.dateStr}
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`bg-slate-950 border rounded-2xl p-3 flex flex-col min-h-[320px] transition-all cursor-pointer ${
                    day.isSelected
                      ? 'border-emerald-500 shadow-lg ring-1 ring-emerald-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span className="font-bold text-xs text-white">{day.dayName}</span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        day.isToday
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px]">
                    {dayApts.length === 0 ? (
                      <p className="text-[10px] text-slate-600 text-center py-6">Aucun RDV</p>
                    ) : (
                      dayApts.map((apt) => (
                        <div
                          key={apt.id}
                          onDoubleClick={() => apt.patientId && onOpenPatientDetail(apt.patientId)}
                          className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1.5 hover:border-slate-600 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono font-bold text-emerald-400">{apt.time}</span>
                            <StatusSelector
                              currentStatus={apt.status}
                              onChange={(newStatus) => handleUpdateStatus(apt.id, newStatus)}
                            />
                          </div>

                          <p className="font-bold text-xs text-white truncate uppercase">{apt.patientName}</p>
                          <p className="text-[10px] text-slate-400 truncate">{apt.reason}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MONTH VIEW */}
        {calendarMode === 'month' && (
          <div>
            <div className="grid grid-cols-7 gap-1 bg-slate-950 p-2 rounded-2xl border border-slate-800 text-center text-xs text-slate-400 font-bold uppercase mb-2">
              <div>Lun</div>
              <div>Mar</div>
              <div>Mer</div>
              <div>Jeu</div>
              <div>Ven</div>
              <div>Sam</div>
              <div>Dim</div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {getMonthDays().map((day, idx) => {
                const dayApts = filteredAppointments.filter((a) => a.date === day.dateStr);
                return (
                  <div
                    key={`${day.dateStr}_${idx}`}
                    onClick={() => {
                      setSelectedDate(day.dateStr);
                      setCalendarMode('day');
                    }}
                    className={`bg-slate-950 border rounded-xl p-2 min-h-[95px] flex flex-col justify-between transition-all cursor-pointer ${
                      !day.isCurrentMonth
                        ? 'opacity-30 border-slate-900'
                        : day.isSelected
                        ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-mono font-bold px-1.5 py-0.2 rounded ${
                          day.isToday ? 'bg-emerald-600 text-white' : 'text-slate-300'
                        }`}
                      >
                        {day.dayNumber}
                      </span>
                      {dayApts.length > 0 && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/50">
                          {dayApts.length} RDV
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 my-1 overflow-hidden">
                      {dayApts.slice(0, 2).map((apt) => (
                        <div
                          key={apt.id}
                          className="flex items-center justify-between text-[9px] px-1.5 py-0.5 rounded font-bold truncate"
                          style={{
                            backgroundColor: getStatusConfig(apt.status).hex,
                            color: getStatusConfig(apt.status).textColor,
                          }}
                        >
                          <span className="truncate">{apt.time} - {apt.patientName}</span>
                        </div>
                      ))}
                      {dayApts.length > 2 && (
                        <p className="text-[9px] text-slate-400 font-bold text-center">
                          +{dayApts.length - 2} autres...
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* New/Edit Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full text-slate-100 overflow-hidden">
            <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                {editingApt ? 'Modifier le Rendez-vous' : 'Nouveau Rendez-vous'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Choisir un Patient Existant</label>
                <select
                  value={patientId}
                  onChange={(e) => handleSelectPatientChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="">-- Patient Existant --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.lastName} {p.firstName} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nom du Patient *</label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Heure</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Durée (min)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Motif du Rendez-vous</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="ex: Consultation tension, Bilan diabète, Urgence..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Statut Initial</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  {Object.entries(APPOINTMENT_STATUS_MAP).map(([key, cfg]) => (
                    <option key={key} value={key} className="bg-slate-900 text-white">
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-between space-x-3 border-t border-slate-800">
                {editingApt ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setAppointmentToDelete(editingApt);
                    }}
                    className="px-4 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl font-semibold flex items-center space-x-1.5 transition text-xs"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Supprimer RDV</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg text-xs"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Appointment Confirmation Modal */}
      {appointmentToDelete && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-600/40 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Supprimer ce rendez-vous ?</h3>
              <p className="text-xs text-slate-300">
                Êtes-vous sûr de vouloir supprimer le RDV de <strong className="text-white">{appointmentToDelete.patientName}</strong> le {appointmentToDelete.date} à {appointmentToDelete.time} ?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAppointmentToDelete(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteAppointment}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/30 transition flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
