"use client";

import { useState, useMemo, useEffect } from "react";

export interface JCalendarAppointment {
  id: string;
  patient: string;
  medecin: string;
  salle: string;
  typeExamen: string;
  heureDebut: string; // HH:mm
  heureFin: string;   // HH:mm
  statut: string;     // Urgent, Confirmé, En attente, etc.
  color?: string;
  date?: string;      // YYYY-MM-DD
}

interface JCalendarProps {
  appointments: JCalendarAppointment[];
  dailyCounts?: Record<string, number>;
  onSlotClick?: (date: Date, time: string) => void;
  onAppointmentClick?: (app: JCalendarAppointment) => void;
  viewMode?: "day" | "week" | "month";
  currentDate?: Date;
}

export function JCalendar({ 
  appointments, 
  onSlotClick, 
  onAppointmentClick,
  dailyCounts = {} as Record<string, number>,
  viewMode = "day",
  currentDate = new Date()
}: JCalendarProps) {
  
  // Layout logic for overlapping appointments
  const getLayout = (apps: JCalendarAppointment[]) => {
    if (apps.length === 0) return [];
    const sorted = [...apps].sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));

    const clusters: JCalendarAppointment[][] = [];
    let currentCluster: JCalendarAppointment[] = [];
    let lastEnd = "00:00";

    sorted.forEach(app => {
      if (app.heureDebut < lastEnd) {
        currentCluster.push(app);
      } else {
        if (currentCluster.length > 0) clusters.push(currentCluster);
        currentCluster = [app];
      }
      if (app.heureFin > lastEnd) lastEnd = app.heureFin;
    });
    if (currentCluster.length > 0) clusters.push(currentCluster);

    const layoutApps: (JCalendarAppointment & { left: string; width: string })[] = [];

    clusters.forEach(cluster => {
      const columns: JCalendarAppointment[][] = [];
      cluster.forEach(app => {
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
          const lastInCol = columns[i][columns[i].length - 1];
          if (app.heureDebut >= lastInCol.heureFin) {
            columns[i].push(app);
            placed = true;
            break;
          }
        }
        if (!placed) columns.push([app]);
      });

      const numCols = columns.length;
      columns.forEach((col, colIndex) => {
        col.forEach(app => {
          layoutApps.push({
            ...app,
            left: `${(colIndex / numCols) * 100}%`,
            width: `${(1 / numCols) * 100}%`
          });
        });
      });
    });

    return layoutApps;
  };

  const PIXELS_PER_HOUR = 96;

  const calculateTop = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const startHour = 8;
    return (h - startHour) * PIXELS_PER_HOUR + (m / 60) * PIXELS_PER_HOUR;
  };

  const calculateHeight = (startStr: string, endStr: string) => {
    const [h1, m1] = startStr.split(':').map(Number);
    const [h2, m2] = endStr.split(':').map(Number);
    const durationMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
    return durationMinutes * (PIXELS_PER_HOUR / 60);
  };

  const appointmentsByDate = useMemo(() => {
    return appointments.reduce((acc, app) => {
      if (!app.date) return acc;
      acc[app.date] = (acc[app.date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [appointments]);

  const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  // Vue liste mobile (< md) : la page parente filtre déjà `appointments` selon le
  // viewMode/currentDate courant (jour/semaine/mois) — on affiche simplement cette même
  // liste, triée chronologiquement, plutôt que la grille (illisible sous ~768px).
  const sortedForMobile = useMemo(
    () =>
      [...appointments].sort(
        (a, b) => (a.date || "").localeCompare(b.date || "") || a.heureDebut.localeCompare(b.heureDebut),
      ),
    [appointments],
  );

  const mobileStatutClass = (statut: string) => {
    const s = statut.toUpperCase();
    if (s === "URGENT" || s === "PRIORITÉ") return "border-l-tertiary bg-tertiary-fixed/30";
    if (s === "CONFIRMÉ") return "border-l-primary bg-primary/5";
    return "border-l-outline-variant/40 bg-white";
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden transition-all duration-500">
      {/* Vue mobile — liste, remplace la grille sous md */}
      <div className="md:hidden divide-y divide-outline-variant/10">
        {sortedForMobile.length === 0 ? (
          <p className="p-6 text-center text-sm text-on-surface-variant">Aucun rendez-vous sur cette période.</p>
        ) : (
          sortedForMobile.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => onAppointmentClick?.(app)}
              className={`w-full text-left p-4 border-l-4 flex items-start gap-3 hover:bg-surface-container-low/60 transition-colors ${mobileStatutClass(app.statut)}`}
            >
              <div className="w-11 h-11 shrink-0 rounded-xl bg-surface-container flex flex-col items-center justify-center text-primary">
                <span className="text-[11px] font-black leading-none tabular-nums">{app.heureDebut}</span>
                <span className="text-[8px] font-bold text-on-surface-variant leading-none mt-0.5">{app.heureFin}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-extrabold text-on-surface truncate">{app.patient}</p>
                  <span
                    className={`shrink-0 whitespace-nowrap text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${
                      app.statut.toUpperCase() === "URGENT"
                        ? "bg-tertiary text-white"
                        : app.statut.toUpperCase() === "CONFIRMÉ"
                        ? "bg-primary text-white"
                        : "bg-surface-container-highest text-on-surface-variant"
                    }`}
                  >
                    {app.statut}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant truncate mt-0.5">{app.typeExamen}</p>
                <div className="flex items-center justify-between gap-2 mt-1.5 text-[10px] font-bold text-on-surface-variant">
                  <span className="flex items-center gap-1 min-w-0 truncate">
                    <span className="material-symbols-outlined text-[13px] shrink-0">medical_information</span>
                    <span className="truncate">{app.medecin}</span>
                  </span>
                  {app.date && (
                    <span className="shrink-0 tabular-nums">
                      {new Date(app.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Vue desktop — grilles jour/semaine/mois, inchangées, à partir de md */}
      <div className="hidden md:block">
      {viewMode === "day" && (
        <div className="flex flex-col">
          {/* Day Header */}
          <div className="grid grid-cols-[100px_1fr] border-b border-outline-variant/15 bg-surface-container-high/40 backdrop-blur-md sticky top-0 z-30">
            <div className="p-4 border-r border-outline-variant/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary-fixed-dim">schedule</span>
            </div>
            <div className="p-4 text-center">
              <span className="font-headline font-black text-primary uppercase tracking-[0.2em] text-[10px]">Bloc Opératoire & Salles d'Endoscopie</span>
            </div>
          </div>

          <div className="relative min-h-[960px] bg-surface-container-low/20">
            {/* Grid lines */}
            <div className="absolute inset-0 grid grid-rows-10 pointer-events-none">
              {hours.map((_, i) => (
                <div key={i} className="border-b border-outline-variant/5 h-24" />
              ))}
            </div>

            <div className="grid grid-cols-[100px_1fr] h-full relative z-10">
              {/* Timeline */}
              <div className="flex flex-col border-r border-outline-variant/15 text-on-surface-variant text-[11px] font-bold text-center pt-2 bg-white/50">
                {hours.map((slot) => (
                  <div key={slot} className="h-24 flex items-start justify-center pt-2 border-b border-outline-variant/5">
                    {slot}
                  </div>
                ))}
              </div>

              {/* Appointments Area */}
              <div className="relative p-4 overflow-hidden" 
                   onClick={(e) => {
                     if (e.target === e.currentTarget) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const hour = 8 + Math.floor(y / 80);
                        const minute = Math.floor(((y % 80) / 80) * 60);
                        onSlotClick?.(currentDate, `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
                     }
                   }}>
                {getLayout(appointments).map(app => (
                  <div
                    key={app.id}
                    onClick={() => onAppointmentClick?.(app)}
                    title={`${app.typeExamen} — ${app.patient} — ${app.medecin}`}
                    className={`absolute rounded-xl p-2.5 shadow-lg border-l-4 group cursor-pointer transition-all hover:scale-[1.02] hover:z-50 hover:shadow-2xl overflow-hidden flex flex-col min-h-[72px] ${
                      app.statut.toUpperCase() === 'URGENT' || app.statut.toUpperCase() === 'PRIORITÉ'
                        ? 'border-tertiary bg-tertiary-fixed/40 animate-pulse' :
                      app.statut.toUpperCase() === 'CONFIRMÉ'
                        ? 'border-primary bg-primary/5' :
                      'border-outline-variant/40 bg-white'
                    }`}
                    style={{
                      top: `${calculateTop(app.heureDebut)}px`,
                      height: `${calculateHeight(app.heureDebut, app.heureFin)}px`,
                      left: app.left,
                      width: `calc(${app.width} - 8px)`,
                      margin: '0 4px'
                    }}
                  >
                    <div className="flex justify-between items-start gap-1.5">
                      <h4 className="text-xs font-extrabold text-on-surface leading-tight truncate min-w-0 flex-1 group-hover:text-primary transition-colors">{app.typeExamen}</h4>
                      <span className={`shrink-0 whitespace-nowrap text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm ${
                        app.statut.toUpperCase() === 'URGENT' ? 'bg-tertiary text-white' :
                        app.statut.toUpperCase() === 'CONFIRMÉ' ? 'bg-primary text-white' :
                        'bg-surface-container-highest text-on-surface-variant'
                      }`}>
                        {app.statut}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 min-w-0">
                      <div className="w-4 h-4 shrink-0 rounded-full bg-surface-container flex items-center justify-center text-[8px] font-bold text-primary border border-primary/10">
                        {app.patient.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-[11px] font-bold text-on-surface truncate min-w-0">{app.patient}</span>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 text-[9px] font-bold text-on-surface-variant mt-auto pt-1.5 border-t border-outline-variant/10">
                      <span className="flex items-center gap-1 min-w-0 truncate">
                        <span className="material-symbols-outlined text-[12px] shrink-0">medical_information</span>
                        <span className="truncate">{app.medecin}</span>
                      </span>
                      <span className="shrink-0 whitespace-nowrap bg-surface-container px-1.5 py-0.5 rounded-md tabular-nums">{app.heureDebut}-{app.heureFin}</span>
                    </div>

                    {/* Interactive background effect */}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.02] transition-colors pointer-events-none" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === "week" && (
        <div className="p-6 bg-surface-container-low/10">
          <div className="grid grid-cols-7 gap-4 mb-4">
            {["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"].map(day => (
              <div key={day} className="text-center p-3 rounded-xl bg-white/50 border border-outline-variant/5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">{day}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-4 h-[600px]">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = new Date(currentDate);
              date.setDate(date.getDate() - date.getDay() + (i === 0 ? 1 : i + 1));
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <div key={i} className={`bg-white rounded-2xl border-2 transition-all p-3 relative group hover:border-primary/40 shadow-sm ${isToday ? 'border-primary ring-4 ring-primary/5' : 'border-outline-variant/10'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-xs font-black ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>{date.getDate()}</span>
                    {isToday && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />}
                  </div>
                  
                  <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
                    {appointments
                      .filter(app => app.date === date.toISOString().split('T')[0])
                      .slice(0, 3)
                      .map(app => (
                        <div key={app.id}
                             onClick={() => onAppointmentClick?.(app)}
                             title={`${app.patient} — ${app.typeExamen}`}
                             className="bg-surface-container-low/50 hover:bg-white border-l-2 border-primary p-2 rounded-lg cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] min-w-0">
                          <p className="text-[10px] font-extrabold truncate text-on-surface">{app.patient}</p>
                          <p className="text-[9px] font-bold text-primary/70 tabular-nums">{app.heureDebut}</p>
                        </div>
                      ))}
                  </div>

                  <button className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110 active:scale-95">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === "month" && (
        <div className="p-6 bg-surface-container-low/10">
          <div className="grid grid-cols-7 gap-px bg-outline-variant/10 rounded-2xl overflow-hidden border border-outline-variant/10 shadow-inner">
            {["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"].map(day => (
              <div key={day} className="bg-white/80 p-4 text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">{day}</span>
              </div>
            ))}
            {Array.from({ length: 35 }).map((_, i) => {
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
              const startDay = (date.getDay() === 0 ? 7 : date.getDay()) - 1;
              date.setDate(i - startDay + 1);
              
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = date.toDateString() === new Date().toDateString();
              const iso = date.toISOString().split('T')[0];
              const appointmentCount = appointmentsByDate[iso] ?? dailyCounts?.[iso] ?? 0;
              
              return (
                <div key={i} 
                     onClick={() => onSlotClick?.(date, "08:00")}
                     className={`min-h-[120px] p-3 bg-white transition-all hover:bg-primary/[0.02] cursor-pointer relative group border ${appointmentCount > 0 && isCurrentMonth ? 'border-primary/40 ring-1 ring-primary/10' : 'border-outline-variant/5'} ${!isCurrentMonth ? 'opacity-30 bg-surface-container-low/20' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-on-surface-variant group-hover:text-primary'} ${isCurrentMonth && appointmentCount > 0 ? 'bg-primary/10 text-primary' : ''}`}>
                      {date.getDate()}
                    </span>
                    {isCurrentMonth && appointmentCount > 0 && (
                      <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-[0.15em]">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                        <span>{appointmentCount}</span>
                      </div>
                    )}
                  </div>
                  
                  {isCurrentMonth && appointmentCount > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-primary/40" style={{ width: `${Math.min(100, appointmentCount * 15)}%` }} />
                      </div>
                      <p className="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-tighter">
                        {appointmentCount} rendez-vous
                      </p>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.01] transition-colors pointer-events-none" />
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
