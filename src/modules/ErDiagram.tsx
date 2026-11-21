import React, { useRef, useState } from 'react';
import { Download, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface EntityNode {
  id: string;
  label: string;
  x: number;
  y: number;
  pk: string;
  attrs: string[];
}

interface RelEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  cardinality: string;
  desc: string;
}

const ENTITIES: EntityNode[] = [
  { id: 'USER', label: 'USER', x: 140, y: 140, pk: 'user_id', attrs: ['full_name', 'email (UQ)', 'phone', 'user_type', 'department', 'status'] },
  { id: 'VEHICLE', label: 'VEHICLE', x: 480, y: 140, pk: 'vehicle_id', attrs: ['user_id (FK)', 'registration_number (UQ)', 'vehicle_type', 'brand', 'model'] },
  { id: 'RESERVATION', label: 'RESERVATION', x: 480, y: 380, pk: 'reservation_id', attrs: ['user_id (FK)', 'vehicle_id (FK)', 'slot_id (FK)', 'start_time', 'end_time', 'status'] },
  { id: 'PARKING_SLOT', label: 'PARKING_SLOT', x: 860, y: 380, pk: 'slot_id', attrs: ['zone_id (FK)', 'slot_number', 'slot_type', 'status', 'hourly_rate'] },
  { id: 'PARKING_ZONE', label: 'PARKING_ZONE', x: 860, y: 140, pk: 'zone_id', attrs: ['zone_name (UQ)', 'location', 'zone_type', 'total_capacity', 'status'] },
  { id: 'ENTRY_LOG', label: 'ENTRY_LOG', x: 860, y: 610, pk: 'entry_id', attrs: ['vehicle_id (FK)', 'slot_id (FK)', 'entry_time', 'security_id', 'entry_status'] },
  { id: 'EXIT_LOG', label: 'EXIT_LOG', x: 520, y: 610, pk: 'exit_id', attrs: ['vehicle_id (FK)', 'slot_id (FK)', 'exit_time', 'parking_duration', 'total_amount'] },
  { id: 'VISITOR_PASS', label: 'VISITOR_PASS', x: 140, y: 380, pk: 'pass_id', attrs: ['host_user_id (FK)', 'zone_id (FK)', 'visitor_name', 'vehicle_number', 'pass_status'] },
  { id: 'VIOLATION', label: 'VIOLATION', x: 140, y: 610, pk: 'violation_id', attrs: ['vehicle_id (FK)', 'slot_id (FK)', 'violation_type', 'penalty_amount', 'status'] },
  { id: 'PAYMENT', label: 'PAYMENT', x: 480, y: 800, pk: 'payment_id', attrs: ['user_id (FK)', 'reservation_id (FK)', 'violation_id (FK)', 'amount', 'payment_method'] },
];

const RELATIONSHIPS: RelEdge[] = [
  { id: 'r1', from: 'USER', to: 'VEHICLE', label: 'OWNS', cardinality: '1 : M', desc: 'A registered USER owns zero or more VEHICLE records.' },
  { id: 'r2', from: 'USER', to: 'RESERVATION', label: 'MAKES', cardinality: '1 : M', desc: 'A USER places one or more slot RESERVATION bookings.' },
  { id: 'r3', from: 'VEHICLE', to: 'RESERVATION', label: 'BOOKED_FOR', cardinality: '1 : M', desc: 'Each VEHICLE can participate in multiple reservations over time.' },
  { id: 'r4', from: 'PARKING_ZONE', to: 'PARKING_SLOT', label: 'CONTAINS', cardinality: '1 : M', desc: 'Each PARKING_ZONE contains many unique PARKING_SLOT bays.' },
  { id: 'r5', from: 'PARKING_SLOT', to: 'RESERVATION', label: 'ALLOCATED_TO', cardinality: '1 : M', desc: 'Historical and active RESERVATION records reference a PARKING_SLOT.' },
  { id: 'r6', from: 'VEHICLE', to: 'ENTRY_LOG', label: 'ENTERS', cardinality: '1 : M', desc: 'Gate security logs every ENTRY_LOG event per VEHICLE.' },
  { id: 'r7', from: 'VEHICLE', to: 'EXIT_LOG', label: 'EXITS', cardinality: '1 : M', desc: 'Gate security records EXIT_LOG duration & billing per VEHICLE.' },
  { id: 'r8', from: 'USER', to: 'VISITOR_PASS', label: 'HOSTS', cardinality: '1 : M', desc: 'A campus USER acts as host for VISITOR_PASS requests.' },
  { id: 'r9', from: 'VEHICLE', to: 'VIOLATION', label: 'INCURS', cardinality: '1 : M', desc: 'A VEHICLE may incur zero or more VIOLATION citations.' },
  { id: 'r10', from: 'USER', to: 'PAYMENT', label: 'PAYS', cardinality: '1 : M', desc: 'Each USER settles fees and fines tracked in PAYMENT.' },
  { id: 'r11', from: 'RESERVATION', to: 'PAYMENT', label: 'SETTLES', cardinality: '1 : 0..M', desc: 'Optional reservation fee payment linkage.' },
  { id: 'r12', from: 'VIOLATION', to: 'PAYMENT', label: 'PENALTY_OF', cardinality: '1 : 0..M', desc: 'Trigger trg_after_violation_insert creates penalty payment.' },
];

export function ErDiagram() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [notation, setNotation] = useState<'chen' | 'crowsfoot'>('chen');
  const [zoom, setZoom] = useState(0.88);
  const [pan, setPan] = useState({ x: 20, y: 10 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedEntity, setSelectedEntity] = useState<string>('RESERVATION');

  function handleMouseDown(e: React.MouseEvent) {
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }

  function handleMouseUp() {
    setDragging(false);
  }

  function downloadSvg() {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const str = serializer.serializeToString(svgRef.current);
    const blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart_parking_er_${notation}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPng() {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgRef.current);
    const img = new Image();
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1800;
      canvas.height = 1400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0A0F18';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `smart_parking_er_${notation}.png`;
        a.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  const activeNode = ENTITIES.find((e) => e.id === selectedEntity) || ENTITIES[0];
  const activeRels = RELATIONSHIPS.filter((r) => r.from === selectedEntity || r.to === selectedEntity);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Interactive Entity-Relationship (ER) Diagram</h1>
          <p className="text-xs text-slate-400">
            Neon Cyan = Entities · Purple = Relationships · White = Attributes · Drag canvas to pan
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-slate-900 p-1 text-xs">
            <button type="button" onClick={() => setNotation('chen')} className={`rounded-md px-2.5 py-1 font-medium ${notation === 'chen' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}>
              Chen Notation
            </button>
            <button type="button" onClick={() => setNotation('crowsfoot')} className={`rounded-md px-2.5 py-1 font-medium ${notation === 'crowsfoot' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400'}`}>
              Crow&apos;s Foot
            </button>
          </div>
          <button type="button" onClick={() => setZoom((z) => Math.min(1.5, z + 0.12))} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:text-white" title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setZoom((z) => Math.max(0.45, z - 0.12))} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:text-white" title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => { setZoom(0.88); setPan({ x: 20, y: 10 }); }} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:text-white" title="Reset View">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button type="button" onClick={downloadPng} className="btn-neon inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs">
            <Download className="h-3.5 w-3.5" /> Download PNG
          </button>
          <button type="button" onClick={downloadSvg} className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/35 px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-500/10">
            SVG
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div
          className="glass-panel relative h-[640px] overflow-hidden rounded-xl lg:col-span-9 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg ref={svgRef} viewBox="0 0 1100 920" className="h-full w-full select-none">
            <defs>
              <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Relationship Edges */}
              {RELATIONSHIPS.map((rel) => {
                const a = ENTITIES.find((e) => e.id === rel.from)!;
                const b = ENTITIES.find((e) => e.id === rel.to)!;
                const ax = a.x + 85;
                const ay = a.y + 38;
                const bx = b.x + 85;
                const by = b.y + 38;
                const mx = (ax + bx) / 2;
                const my = (ay + by) / 2;
                const highlighted = selectedEntity === rel.from || selectedEntity === rel.to;
                return (
                  <g key={rel.id}>
                    <line
                      x1={ax}
                      y1={ay}
                      x2={bx}
                      y2={by}
                      stroke={highlighted ? '#9B5CFF' : 'rgba(155, 92, 255, 0.38)'}
                      strokeWidth={highlighted ? 2.4 : 1.4}
                    />
                    {notation === 'chen' ? (
                      <g transform={`translate(${mx}, ${my})`}>
                        <polygon
                          points="0,-18 46,0 0,18 -46,0"
                          fill="#1B1336"
                          stroke="#9B5CFF"
                          strokeWidth={highlighted ? 2 : 1.2}
                        />
                        <text textAnchor="middle" dy="3" fill="#E9D5FF" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
                          {rel.label}
                        </text>
                        <text x="0" y="28" textAnchor="middle" fill="#00F0FF" fontSize="9" fontFamily="JetBrains Mono">
                          {rel.cardinality}
                        </text>
                      </g>
                    ) : (
                      <g>
                        {/* Crow's Foot markers near target */}
                        <circle cx={ax + (bx - ax) * 0.2} cy={ay + (by - ay) * 0.2} r="4" fill="#0A0F18" stroke="#9B5CFF" strokeWidth="1.5" />
                        <text x={mx} y={my - 5} textAnchor="middle" fill="#E9D5FF" fontSize="9" fontFamily="JetBrains Mono">
                          {rel.label} ({rel.cardinality})
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Entity Boxes + Attributes */}
              {ENTITIES.map((ent) => {
                const isSelected = selectedEntity === ent.id;
                return (
                  <g
                    key={ent.id}
                    transform={`translate(${ent.x}, ${ent.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEntity(ent.id);
                    }}
                    className="cursor-pointer"
                  >
                    {/* Entity Rectangle (Neon Cyan) */}
                    <rect
                      width="170"
                      height="76"
                      rx="8"
                      fill="#0B1628"
                      stroke="#00F0FF"
                      strokeWidth={isSelected ? 2.8 : 1.6}
                      filter={isSelected ? 'url(#cyanGlow)' : undefined}
                    />
                    <rect width="170" height="24" rx="8" fill="rgba(0, 240, 255, 0.16)" />
                    <text x="85" y="16" textAnchor="middle" fill="#00F0FF" fontSize="11" fontFamily="Outfit" fontWeight="700">
                      {ent.label}
                    </text>

                    {/* White Attribute Pills inside/below */}
                    <text x="10" y="40" fill="#FFFFFF" fontSize="10" fontFamily="JetBrains Mono" textDecoration="underline">
                      PK: {ent.pk}
                    </text>
                    <text x="10" y="55" fill="#E2E8F0" fontSize="9" fontFamily="JetBrains Mono">
                      {ent.attrs.slice(0, 2).join(', ')}
                    </text>
                    <text x="10" y="68" fill="#94A3B8" fontSize="8.5" fontFamily="JetBrains Mono">
                      +{Math.max(0, ent.attrs.length - 2)} attributes
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Entity & Cardinality Inspector */}
        <div className="glass-panel rounded-xl p-5 lg:col-span-3 space-y-4 text-xs">
          <div>
            <div className="text-[11px] font-semibold text-purple-300">Selected Entity</div>
            <h2 className="font-mono text-lg font-bold text-cyan-300">{activeNode.label}</h2>
            <div className="mt-2 rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <div className="font-mono font-semibold text-white underline">PK: {activeNode.pk}</div>
              <ul className="mt-1.5 space-y-1 font-mono text-[11px] text-slate-300">
                {activeNode.attrs.map((a) => <li key={a}>{a}</li>)}
              </ul>
            </div>
          </div>

          <div>
            <div className="mb-2 font-semibold text-white">Connected Cardinalities ({activeRels.length})</div>
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {activeRels.map((r) => (
                <div key={r.id} className="rounded-lg border border-purple-500/25 bg-purple-500/5 p-2.5">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-cyan-300">{r.from} → {r.to}</span>
                    <span className="font-bold text-purple-300">{r.cardinality}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">{r.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
