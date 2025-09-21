import { useEffect, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Train } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface DelayTrendProps {
  trains: Train[];
}

type Point = { t: string; delay: number };

export default function DelayTrend({ trains }: DelayTrendProps) {
  const [data, setData] = useState<Point[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    const totalDelay = trains.reduce((sum, t) => sum + (t.delayMinutes || 0), 0);
    counter.current += 1;
    const t = new Date();
    const label = `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}:${t
      .getSeconds()
      .toString()
      .padStart(2, '0')}`;

    setData((prev) => {
      const next = [...prev, { t: label, delay: totalDelay }];
      return next.slice(-20); // keep last 20 points
    });
  }, [trains]);

  return (
    <Card className="rail-card">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-rail-info" />
        <h2 className="text-lg font-semibold">Delay Trend</h2>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="t" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} hide={data.length > 12} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            <Line type="monotone" dataKey="delay" stroke="hsl(var(--rail-warning))" strokeWidth={2} dot={false} isAnimationActive />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
