import { useEffect, useRef } from 'react';
import { useState } from 'react';
import L from 'leaflet';
import { Train, RailwaySegment } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

// Default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface RailwayMapProps {
  trains: Train[];
  segments: RailwaySegment[];
  className?: string;
  draggableMarkers?: boolean;
  onTrainDrag?: (trainId: string, position: [number, number]) => void;
  draggableSegments?: boolean;
  onSegmentDrag?: (segmentId: string, start: [number, number], end: [number, number]) => void;
  showAreaSelection?: boolean;
  onAreaChange?: (area: string) => void;
}

const trainIcons = {
  express: '🚄',
  freight: '🚂',
  local: '🚃',
} as const;

const statusColors: Record<Train['status'], string> = {
  'on-time': '#22c55e',
  'delayed': '#eab308',
  'critical': '#ef4444',
  'maintenance': '#8b5cf6',
};

const segmentColors: Record<RailwaySegment['status'], string> = {
  clear: '#22c55e',
  occupied: '#eab308',
  maintenance: '#8b5cf6',
  blocked: '#ef4444',
};

export default function RailwayMap({
  trains,
  segments,
  className = '',
  draggableMarkers = false,
  onTrainDrag,
  draggableSegments = false,
  onSegmentDrag,
  showAreaSelection = false,
  onAreaChange,
}: RailwayMapProps) {
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const segmentsRef = useRef<Map<string, L.Polyline>>(new Map());
  const segmentMarkersRef = useRef<Map<string, [L.Marker, L.Marker]>>(new Map());

  const areas = [
    { value: 'all', label: 'All Areas' },
    { value: 'delhi', label: 'Delhi Region' },
    { value: 'mumbai', label: 'Mumbai Region' },
    { value: 'chennai', label: 'Chennai Region' },
    { value: 'kolkata', label: 'Kolkata Region' },
    { value: 'bangalore', label: 'Bangalore Region' }
  ];

  const handleAreaChange = (area: string) => {
    setSelectedArea(area);
    if (onAreaChange) {
      onAreaChange(area === 'all' ? '' : area);
    }
  };
  // Initialize map only once
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [28.6139, 77.2090], // New Delhi, India
      zoom: 10,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors, © CartoDB',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update or create segments
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();

    segments.forEach((seg) => {
      seen.add(seg.id);
      let line = segmentsRef.current.get(seg.id);
      if (!line) {
        line = L.polyline([seg.start, seg.end], {
          color: segmentColors[seg.status],
          weight: 4,
          opacity: 0.8,
        }).addTo(map);
        line.bindPopup(`
          <div class="p-2">
            <h3 class="font-semibold">${seg.name}</h3>
            <p>Status: <span class="capitalize">${seg.status}</span></p>
            <p>Max Speed: ${seg.maxSpeed} km/h</p>
          </div>
        `);
        segmentsRef.current.set(seg.id, line);

        // Add draggable markers for segment endpoints if enabled
        if (draggableSegments) {
          const startMarker = L.marker(seg.start, { 
            draggable: true,
            icon: L.divIcon({
              className: 'segment-marker',
              html: '<div style="background: #3b82f6; border: 2px solid white; border-radius: 50%; width: 12px; height: 12px;"></div>',
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            })
          }).addTo(map);
          
          const endMarker = L.marker(seg.end, { 
            draggable: true,
            icon: L.divIcon({
              className: 'segment-marker',
              html: '<div style="background: #3b82f6; border: 2px solid white; border-radius: 50%; width: 12px; height: 12px;"></div>',
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            })
          }).addTo(map);

          const updateSegment = () => {
            const start: [number, number] = [startMarker.getLatLng().lat, startMarker.getLatLng().lng];
            const end: [number, number] = [endMarker.getLatLng().lat, endMarker.getLatLng().lng];
            line!.setLatLngs([start, end]);
            onSegmentDrag?.(seg.id, start, end);
          };

          startMarker.on('dragend', updateSegment);
          endMarker.on('dragend', updateSegment);
          
          segmentMarkersRef.current.set(seg.id, [startMarker, endMarker]);
        }
      } else {
        line.setLatLngs([seg.start, seg.end]);
        line.setStyle({ color: segmentColors[seg.status] });
        
        // Update segment markers if they exist
        const markers = segmentMarkersRef.current.get(seg.id);
        if (markers && draggableSegments) {
          markers[0].setLatLng(seg.start);
          markers[1].setLatLng(seg.end);
        }
      }
    });

    // Remove old segments and their markers
    Array.from(segmentsRef.current.keys()).forEach((id) => {
      if (!seen.has(id)) {
        const line = segmentsRef.current.get(id);
        if (line && map.hasLayer(line)) map.removeLayer(line);
        segmentsRef.current.delete(id);
        
        // Remove segment markers
        const markers = segmentMarkersRef.current.get(id);
        if (markers) {
          markers.forEach(marker => {
            if (map.hasLayer(marker)) map.removeLayer(marker);
          });
          segmentMarkersRef.current.delete(id);
        }
      }
    });
  }, [segments]);

  // Update or create train markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();

    trains.forEach((train) => {
      seen.add(train.id);

      let marker = markersRef.current.get(train.id);
      const icon = L.divIcon({
        className: 'train-marker',
        html: `
          <div class="train-marker-container" style="
            background: ${statusColors[train.status]};
            border: 2px solid #fff;
            border-radius: 50%;
            width: 40px; height: 40px;
            display: flex; align-items: center; justify-content: center;
            font-size: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            transition: transform 300ms ease;
          ">
            ${trainIcons[train.type]}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
      });

      if (!marker) {
        marker = L.marker(train.position, { icon, draggable: draggableMarkers }).addTo(map);
        marker.bindPopup(`
          <div class="p-3 min-w-[200px]">
            <h3 class="font-semibold text-lg mb-2">${train.name}</h3>
            <div class="grid grid-cols-1 gap-2 text-sm">
              <div><strong>Status:</strong> ${train.status}</div>
              <div><strong>Speed:</strong> ${train.speed} km/h</div>
              <div><strong>Location:</strong> ${train.currentLocation}</div>
              <div><strong>Destination:</strong> ${train.destination}</div>
              ${train.delayMinutes > 0 ? `<div class="text-yellow-500"><strong>Delay:</strong> ${train.delayMinutes} minutes</div>` : ''}
              ${train.passengers ? `<div><strong>Passengers:</strong> ${train.passengers}</div>` : ''}
            </div>
          </div>
        `);

        if (draggableMarkers) {
          marker.on('dragend', () => {
            const ll = marker!.getLatLng();
            onTrainDrag?.(train.id, [ll.lat, ll.lng]);
          });
        }

        markersRef.current.set(train.id, marker);
      } else {
        // Update marker icon and position smoothly
        marker.setIcon(icon);
        marker.setLatLng(train.position);
        // Keep draggable state in sync
        if (marker.dragging) {
          if (draggableMarkers) marker.dragging.enable();
          else marker.dragging.disable();
        }
      }
    });

    // Remove markers for trains no longer present
    Array.from(markersRef.current.keys()).forEach((id) => {
      if (!seen.has(id)) {
        const marker = markersRef.current.get(id)!;
        if (map.hasLayer(marker)) map.removeLayer(marker);
        markersRef.current.delete(id);
      }
    });

    // Fit bounds on first load when markers created
    if (markersRef.current.size > 0) {
      const group = L.featureGroup(Array.from(markersRef.current.values()));
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [trains, draggableMarkers, onTrainDrag]);

  return (
    <div className={`relative ${className}`}>
      {/* Area Selection Controls */}
      {showAreaSelection && (
        <div className="absolute top-4 left-4 z-10 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Focus Area:</span>
            <Select value={selectedArea} onValueChange={handleAreaChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.value} value={area.value}>
                    {area.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      <div ref={mapContainerRef} className="w-full h-full rounded-lg" />

      {/* Legend */}
      <div className={`absolute ${showAreaSelection ? 'top-20' : 'top-4'} right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 text-sm animate-fade-in`}>
        <h4 className="font-semibold mb-2">Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors['on-time'] }}></div><span>On Time</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors['delayed'] }}></div><span>Delayed</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors['critical'] }}></div><span>Critical</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors['maintenance'] }}></div><span>Maintenance</span></div>
        </div>
      </div>
    </div>
  );
}
