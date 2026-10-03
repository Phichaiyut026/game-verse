'use client';

import { useState } from 'react';
import {
  Bot, Brain, Building2, Car, ChefHat, Compass, Crosshair, Fish, Footprints, Gamepad2, Ghost, Glasses, Layers, Medal,
  PartyPopper, Puzzle, Rocket, Shield, Star, Sword, Swords, Tent, Wheat, Zap, type LucideIcon
} from 'lucide-react';
import type { Game, GameIcon as IconKey } from '@/lib/types';
import { baht, finalPrice, gradient, reviewSummary } from '@/lib/utils';

export const ICONS: Record<IconKey, LucideIcon> = {
  car: Car, swords: Swords, wheat: Wheat, glasses: Glasses, rocket: Rocket, ghost: Ghost, medal: Medal,
  shield: Shield, bot: Bot, fish: Fish, chef: ChefHat, sword: Sword, building: Building2, puzzle: Puzzle,
  crosshair: Crosshair, layers: Layers, gamepad: Gamepad2
};

export const GENRE_ICONS: Record<string, LucideIcon> = {
  'แอ็กชัน': Zap, 'RPG': Swords, 'แข่งรถ': Car, 'จำลองสถานการณ์': Building2, 'วางแผน': Brain, 'สยองขวัญ': Ghost,
  'กีฬา': Medal, 'แพลตฟอร์ม': Footprints, 'ผจญภัย': Compass, 'ปาร์ตี้': PartyPopper, 'ปริศนา': Puzzle, 'ยิง': Crosshair, 'เอาชีวิตรอด': Tent
};

export function GameIcon({ icon, size = 24, strokeWidth = 1.5 }: { icon: IconKey; size?: number; strokeWidth?: number }) {
  const Icon = ICONS[icon] ?? Gamepad2;
  return <Icon size={size} strokeWidth={strokeWidth} />;
}

type ArtGame = Pick<Game, 'colors' | 'icon' | 'title'> & Partial<Pick<Game, 'image' | 'shots' | 'portrait'>>;

/** เลือกรูปที่จะแสดง: รูปปก (header) หรือภาพหน้าจอ */
function pickImage(game: ArtGame, media: 'header' | 'shot' | 'portrait', shot: number, hd: boolean): { src?: string; srcSet?: string } {
  if (media === 'portrait' && game.portrait) return { src: game.portrait };
  const shots = game.shots ?? [];
  if ((media === 'shot' || shot > 0) && shots.length) {
    const s = shots[(media === 'shot' ? shot : shot - 1) % shots.length];
    // ภาพย่อ ~600px สำหรับจอปกติ, ภาพเต็มสำหรับจอความละเอียดสูง (hd)
    return hd && s.full !== s.thumb ? { src: s.thumb, srcSet: `${s.thumb} 1x, ${s.full} 2x` } : { src: s.thumb };
  }
  return { src: game.image };
}

/**
 * ภาพของเกม — ใช้รูปจริงจาก Steam ถ้ามี (รูปปก/ภาพหน้าจอ)
 * ถ้าไม่มีรูปหรือโหลดไม่สำเร็จ จะแสดงพื้นไล่สี + ไอคอน + ชื่อเกมแทน
 * media="shot": ใช้ภาพหน้าจอลำดับที่ shot, hd: ให้จอความละเอียดสูงโหลดภาพเต็ม
 */
export function Art({ game, iconSize = 48, title = true, shot = 0, icon, className = '', media = 'header', hd = false }: {
  game: ArtGame; iconSize?: number; title?: boolean; shot?: number; icon?: IconKey; className?: string;
  media?: 'header' | 'shot' | 'portrait'; hd?: boolean;
}) {
  const { src, srcSet } = pickImage(game, media, shot, hd);
  const [failed, setFailed] = useState<string | null>(null);
  if (src && failed !== src) {
    return (
      <div className={`art has-img ${className}`} style={{ background: gradient(game) }}>
        <img src={src} srcSet={srcSet} alt={game.title} loading="lazy" decoding="async" onError={() => setFailed(src)} />
      </div>
    );
  }
  return (
    <div className={`art ${className}`} style={{ background: gradient(game), filter: shot ? `hue-rotate(${shot * 28}deg) saturate(1.1)` : undefined }}>
      <GameIcon icon={icon ?? game.icon} size={iconSize} strokeWidth={1.1} />
      {title && <span className="art-title">{game.title}</span>}
    </div>
  );
}

/** ภาพย่อแนวนอน (อัตราส่วนแคปซูลแบบ Steam) ใช้ในตะกร้า คลังเกม ตาราง */
export function Thumb({ game, size = 64 }: { game: Pick<Game, 'colors' | 'icon'> & Partial<Pick<Game, 'image' | 'title'>>; size?: number }) {
  const [failed, setFailed] = useState(false);
  const style = { background: gradient(game), width: Math.round(size * 2.14), height: size };
  if (game.image && !failed) {
    return (
      <div className="thumb has-img" style={style}>
        <img src={game.image} alt={game.title ?? ''} loading="lazy" onError={() => setFailed(true)} />
      </div>
    );
  }
  return (
    <div className="thumb" style={style}>
      <GameIcon icon={game.icon} size={size * 0.5} strokeWidth={1.25} />
    </div>
  );
}

/** กล่องราคาแบบ Steam: ป้ายส่วนลดสีเขียว + ราคาเดิมขีดฆ่า + ราคาสุทธิ */
export function Price({ game, size = 'md' }: { game: Pick<Game, 'price' | 'discount'>; size?: 'sm' | 'md' | 'lg' }) {
  if (game.price === 0) {
    return <div className={`dblock ${size}`}><div className="dprices"><span className="dfinal">เล่นฟรี</span></div></div>;
  }
  return (
    <div className={`dblock ${size}`}>
      {game.discount > 0 && <div className="dpct">-{game.discount}%</div>}
      <div className="dprices">
        {game.discount > 0 && <span className="dorig">{baht(game.price)}</span>}
        <span className="dfinal">{baht(finalPrice(game))}</span>
      </div>
    </div>
  );
}

export function ReviewSummary({ avg, count, showCount = true }: { avg: number; count: number; showCount?: boolean }) {
  const r = reviewSummary(avg, count);
  return (
    <span className="rsum">
      <span className={`rsum-label ${r.tone}`}>{r.label}</span>
      {showCount && <span className="muted"> ({count.toLocaleString('th-TH')})</span>}
    </span>
  );
}

export function Platforms({ list }: { list: string[] }) {
  return <span className="platforms">{list.map(p => <span key={p} className="plat">{p}</span>)}</span>;
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const r = Math.round(value);
  return (
    <span className="stars" aria-label={`${value.toFixed(1)} จาก 5 ดาว`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} fill={i <= r ? 'currentColor' : 'none'} strokeWidth={1.5} />
      ))}
    </span>
  );
}
