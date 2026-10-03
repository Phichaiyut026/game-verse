'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="a-page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="a-page-actions">{actions}</div>}
    </div>
  );
}

export function Kpi({ label, value, hint, icon: Icon, tone = 'default' }: {
  label: string; value: string; hint?: React.ReactNode; icon?: LucideIcon; tone?: 'default' | 'good' | 'bad' | 'warn';
}) {
  return (
    <div className="a-kpi">
      <div className="a-kpi-top">
        <span className="a-kpi-label">{label}</span>
        {Icon && <span className={`a-kpi-icon ${tone}`}><Icon size={16} /></span>}
      </div>
      <div className="a-kpi-value">{value}</div>
      {hint && <div className="a-kpi-hint">{hint}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = '' }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`a-card ${className}`}>
      {(title || actions) && (
        <header className="a-card-head">
          {title && <h2>{title}</h2>}
          {actions}
        </header>
      )}
      <div className="a-card-body">{children}</div>
    </section>
  );
}

/** แท็กเปลี่ยนแปลง % เทียบช่วงก่อนหน้า (มีไอคอนลูกศร + ข้อความ ไม่ใช้สีอย่างเดียว) */
export function Delta({ now, prev }: { now: number; prev: number }) {
  if (!prev && !now) return <span className="a-delta flat">ไม่มีข้อมูลเทียบ</span>;
  if (!prev) return <span className="a-delta up">ใหม่ในช่วงนี้</span>;
  const pct = ((now - prev) / Math.abs(prev)) * 100;
  const dir = Math.abs(pct) < 0.5 ? 'flat' : pct > 0 ? 'up' : 'down';
  return (
    <span className={`a-delta ${dir}`}>
      {dir === 'up' ? '▲' : dir === 'down' ? '▼' : '–'} {Math.abs(pct).toFixed(1)}% <span className="a-delta-note">เทียบช่วงก่อน</span>
    </span>
  );
}

export interface BarDatum { key: string; label: string; value: number; tip?: string }

/**
 * กราฟแท่งชุดเดียว: สีเดียว, หัวแท่งโค้ง 4px ยึดฐาน, ช่องว่างระหว่างแท่ง 2px,
 * เส้นกริดจาง, tooltip เมื่อชี้ (พื้นที่ชี้ใหญ่กว่าแท่ง) และมีตารางข้อมูลให้เปิดดู
 */
export function BarChart({ data, format, height = 220, labelEvery = 1, title }: {
  data: BarDatum[]; format: (n: number) => string; height?: number; labelEvery?: number; title: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const max = Math.max(...data.map(d => d.value), 0);
  const niceMax = niceCeil(max || 1);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => niceMax * t);
  const peak = data.reduce((best, d, i) => (d.value > (data[best]?.value ?? -1) ? i : best), 0);

  if (max <= 0) {
    return <div className="a-chart-empty" style={{ height }}>ยังไม่มียอดขายในช่วงเวลานี้</div>;
  }

  return (
    <div className="a-chart">
      <div className="a-chart-plot" style={{ height }} role="img" aria-label={`${title}: สูงสุด ${format(max)}`}>
        <div className="a-chart-grid">
          {ticks.slice().reverse().map(t => (
            <div key={t} className="a-chart-gridline"><span>{format(t)}</span></div>
          ))}
        </div>
        <div className="a-chart-bars">
          {data.map((d, i) => (
            <div
              key={d.key} className={`a-chart-col ${hover === i ? 'hover' : ''}`}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            >
              {i === peak && d.value > 0 && hover === null && <span className="a-chart-peak">{format(d.value)}</span>}
              <div className="a-chart-bar" style={{ height: `${(d.value / niceMax) * 100}%` }} />
              {hover === i && (
                <div className={`a-tip ${i > data.length * 0.7 ? 'left' : ''}`}>
                  <b>{d.label}</b>
                  <span>{d.tip ?? format(d.value)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="a-chart-x">
        {data.map((d, i) => <span key={d.key}>{i % labelEvery === 0 || i === data.length - 1 ? d.label : ''}</span>)}
      </div>
      <button className="a-link-btn" onClick={() => setShowTable(s => !s)}>{showTable ? 'ซ่อนตารางข้อมูล' : 'ดูเป็นตาราง'}</button>
      {showTable && (
        <div className="table-wrap a-chart-table">
          <table>
            <thead><tr><th>ช่วงเวลา</th><th className="num">ค่า</th></tr></thead>
            <tbody>{data.map(d => <tr key={d.key}><td>{d.label}</td><td className="num">{d.tip ?? format(d.value)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function niceCeil(n: number) {
  const exp = Math.pow(10, Math.floor(Math.log10(n)));
  const f = n / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * exp;
}

/**
 * แถบสัดส่วนแบบซ้อน (≤ 3 หมวด) ใช้สีหมวดตามลำดับคงที่ + legend + ป้ายตัวเลข
 */
export function ShareBar({ items, format }: { items: { key: string; label: string; value: number }[]; format: (n: number) => string }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  const [hover, setHover] = useState<string | null>(null);
  if (!total) return <p className="a-muted">ยังไม่มีข้อมูล</p>;
  return (
    <div className="a-share">
      <div className="a-share-bar">
        {items.map((it, i) => it.value > 0 && (
          <div
            key={it.key} className={`a-share-seg s${i + 1} ${hover && hover !== it.key ? 'dim' : ''}`}
            style={{ flexGrow: it.value }} onMouseEnter={() => setHover(it.key)} onMouseLeave={() => setHover(null)}
            title={`${it.label}: ${format(it.value)} (${((it.value / total) * 100).toFixed(1)}%)`}
          />
        ))}
      </div>
      <ul className="a-legend">
        {items.map((it, i) => (
          <li key={it.key} onMouseEnter={() => setHover(it.key)} onMouseLeave={() => setHover(null)}>
            <span className={`a-swatch s${i + 1}`} />
            <span className="a-legend-label">{it.label}</span>
            <span className="a-legend-value">{format(it.value)}</span>
            <span className="a-legend-pct">{((it.value / total) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
