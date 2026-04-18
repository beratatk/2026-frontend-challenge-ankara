import { useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { InvestigationRecord } from '@/types/records';
import type { Person } from '@/lib/linking';
import { SourceBadge } from '@/components/atoms';
import { fmtDateTime, recordTitle } from '@/lib/format';

// DivIcons sidestep the Leaflet image-path issue in Vite builds
// and let us style markers with Tailwind-ish raw CSS.
const baseIcon = L.divIcon({
  className: '',
  html: '<div style="width:12px;height:12px;border-radius:9999px;background:#cbd5e1;box-shadow:0 0 0 2px #020617;"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});
const subjectIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#fbbf24;box-shadow:0 0 0 2px #020617, 0 0 8px rgba(251,191,36,0.4);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});
const selectedIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#fb7185;box-shadow:0 0 0 2px #020617, 0 0 12px rgba(251,113,133,0.6);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

type MapLocation = {
  key: string;
  name: string;
  coords: { lat: number; lng: number };
  records: InvestigationRecord[];
  hasSubject: boolean;
};

type Props = {
  records: InvestigationRecord[];
  subject: Person | null;
  selectedRecordId: string | null;
  onSelectRecord: (id: string) => void;
};

export function MapView({
  records,
  subject,
  selectedRecordId,
  onSelectRecord,
}: Props) {
  const locations = useMemo<MapLocation[]>(() => {
    const m = new Map<string, MapLocation>();
    for (const r of records) {
      if (!r.coordinates || !r.location) continue;
      const key = r.location.toLowerCase();
      let loc = m.get(key);
      if (!loc) {
        loc = {
          key,
          name: r.location,
          coords: r.coordinates,
          records: [],
          hasSubject: false,
        };
        m.set(key, loc);
      }
      loc.records.push(r);
      if (subject && r.personRefs.includes(subject.key)) loc.hasSubject = true;
    }
    // newest first inside each popup
    for (const loc of m.values()) {
      loc.records.sort((a, b) => {
        const ta = a.timestamp?.getTime() ?? a.createdAt.getTime();
        const tb = b.timestamp?.getTime() ?? b.createdAt.getTime();
        return tb - ta;
      });
    }
    return [...m.values()];
  }, [records, subject]);

  const bounds = useMemo(() => {
    if (locations.length === 0) return null;
    return L.latLngBounds(
      locations.map((l) => L.latLng(l.coords.lat, l.coords.lng)),
    ).pad(0.25);
  }, [locations]);

  return (
    <section className="flex-1 min-h-0 flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h2 className="text-sm font-semibold">
          Map of locations{' '}
          <span className="text-slate-400 font-normal tabular-nums">
            ({locations.length})
          </span>
        </h2>
        <p className="text-[11px] text-slate-500">
          <LegendDot style="subject" /> linked to{' '}
          <span className="text-amber-300">{subject?.displayName ?? 'subject'}</span>{' '}
          <LegendDot style="base" /> other{' '}
          <LegendDot style="selected" /> selected
        </p>
      </div>

      {locations.length === 0 || !bounds ? (
        <div className="flex-1 grid place-items-center rounded-lg border border-dashed border-slate-800 bg-slate-900/30 p-6">
          <p className="text-sm text-slate-400 text-center">
            No records with coordinates match the current filters.
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-slate-800">
          <MapContainer
            bounds={bounds}
            scrollWheelZoom
            className="w-full h-full"
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {locations.map((loc) => {
              const isSelected = loc.records.some((r) => r.id === selectedRecordId);
              const icon = isSelected
                ? selectedIcon
                : loc.hasSubject
                ? subjectIcon
                : baseIcon;
              return (
                <Marker
                  key={loc.key}
                  position={[loc.coords.lat, loc.coords.lng]}
                  icon={icon}
                >
                  <Popup>
                    <div className="min-w-[220px]">
                      <p className="font-semibold text-slate-100">{loc.name}</p>
                      <p className="text-[11px] text-slate-400 mb-2">
                        {loc.records.length} record{loc.records.length === 1 ? '' : 's'}
                        {loc.hasSubject && (
                          <>
                            {' '}· <span className="text-amber-300">involves {subject?.displayName}</span>
                          </>
                        )}
                      </p>
                      <ul className="space-y-1.5 max-h-56 overflow-y-auto">
                        {loc.records.map((r) => (
                          <li key={r.id}>
                            <button
                              type="button"
                              onClick={() => onSelectRecord(r.id)}
                              className={`w-full text-left rounded border px-2 py-1.5 text-xs transition-colors ${
                                selectedRecordId === r.id
                                  ? 'border-amber-400/60 bg-amber-400/10'
                                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800'
                              }`}
                            >
                              <span className="flex items-center gap-1.5 mb-0.5">
                                <SourceBadge source={r.source} />
                                <span className="text-slate-400 font-mono text-[10px]">
                                  {fmtDateTime(r.timestamp)}
                                </span>
                              </span>
                              <span className="text-slate-200 line-clamp-1">
                                {recordTitle(r)}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      )}
    </section>
  );
}

function LegendDot({ style }: { style: 'base' | 'subject' | 'selected' }) {
  const color =
    style === 'subject' ? '#fbbf24' : style === 'selected' ? '#fb7185' : '#cbd5e1';
  return (
    <span
      className="inline-block w-2 h-2 rounded-full mx-0.5 align-middle"
      style={{ background: color, boxShadow: '0 0 0 1.5px #020617' }}
      aria-hidden
    />
  );
}
