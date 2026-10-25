"use client";

import * as React from "react";
import { cn } from "cn";
import { Plus } from 'lucide-react';
import { dynamicIconImports } from 'lucide-react/dynamic';
import { Slider } from "../../components/ui/slider";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { ColorPicker, type ColorValue } from "./ColorPicker";

export type IconEntry = { name: string; Component: React.ComponentType<React.SVGProps<SVGSVGElement>> };
type IconEditorPanelProps = {
  selectedIcon: IconEntry | null; onSelectIcon: (icon: IconEntry | null) => void;
  size: number; onSizeChange: (value: number) => void;
  rotate: number; onRotateChange: (value: number) => void;
  borderRadius: number; onBorderRadiusChange: (value: number) => void;
  color: ColorValue; onColorChange: (value: ColorValue) => void; onColorCssChange: (value: string) => void;
  layers: { id: number; name: string; Component: IconEntry["Component"] }[]; selectedLayerId: number; onSelectLayer: (id: number) => void;
};

const LUCIDE_ENTRIES: IconEntry[] = Object.entries(dynamicIconImports)
  .map(([name, load]) => ({
    name,
    Component: React.lazy(load as () => Promise<{ default: React.ComponentType<React.SVGProps<SVGSVGElement>> }>),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));
const CHARACTER_NAMES = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].concat(Array.from({ length: 10 }, (_, n) => `N${n}`));
const CHARACTER_ENTRIES: IconEntry[] = CHARACTER_NAMES.map((name) => ({
  name,
  Component: React.lazy(() => import('./LetterNumberIcons').then((module) => ({ default: module[name as keyof typeof module] }))),
}));
const ALL_ICONS = [...LUCIDE_ENTRIES, ...CHARACTER_ENTRIES];

export function getIconEntryByName(name: string): IconEntry | undefined {
  return ALL_ICONS.find((icon) => icon.name === name);
}

export function IconEditorPanel({ selectedIcon, onSelectIcon, size, onSizeChange, rotate, onRotateChange, borderRadius, onBorderRadiusChange, color, onColorChange, onColorCssChange, layers, selectedLayerId, onSelectLayer }: IconEditorPanelProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [loadedCount, setLoadedCount] = React.useState(60);
  const [selecting, setSelecting] = React.useState(false);
  React.useEffect(() => {
    const saturation = color.s / 100, value = color.v / 100;
    const chroma = value * saturation;
    const x = chroma * (1 - Math.abs((color.h / 60) % 2 - 1));
    const match = value - chroma;
    const sector = Math.floor(color.h / 60) % 6;
    const channels = [[chroma,x,0],[x,chroma,0],[0,chroma,x],[0,x,chroma],[x,0,chroma],[chroma,0,x]][sector] ?? [chroma,x,0];
    onColorCssChange(`rgba(${channels.map((channel) => Math.round((channel + match) * 255)).join(", ")}, ${color.a / 100})`);
  }, [color, onColorCssChange]);
  const visibleIcons = searchQuery
    ? ALL_ICONS.filter((icon) => icon.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, loadedCount)
    : ALL_ICONS.slice(0, loadedCount);

  return (
    <div className="flex flex-col gap-5">
      {/* Add icon button */}
      <Button
        variant="outline"
        className="w-full justify-center gap-2"
        onClick={() => setSelecting(!selecting)}
      >
        <Plus className="h-4 w-4" />
        Add icon
      </Button>

      {layers.length > 0 && <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">On the sheet</span>
        {layers.map((layer) => <button key={layer.id} type="button" onClick={() => onSelectLayer(layer.id)} className={`flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${selectedLayerId === layer.id ? "bg-muted font-medium" : "hover:bg-muted/60"}`}>
          <layer.Component className="h-4 w-4" />{layer.name}
        </button>)}
      </div>}

      {/* Dialog for selecting icon */}
      {selecting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative rounded-2xl border border-border bg-background p-6 shadow-2xl max-w-xl w-full mx-4">
            <button
              type="button"
              title="Close"
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onClick={() => setSelecting(false)}
            >
              <XIcon className="h-4 w-4" />
            </button>
            <h3 className="text-base font-semibold text-foreground mb-3">Select an icon</h3>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setLoadedCount(60); }}
                className="w-full rounded-lg border border-border bg-input/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
            <div
              className="grid grid-cols-6 gap-2 max-h-[55vh] overflow-y-auto"
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20 && loadedCount < ALL_ICONS.length) {
                  setLoadedCount((prev) => Math.min(prev + 60, ALL_ICONS.length));
                }
              }}
            >
              {visibleIcons.map((icon) => (
                <button
                  key={icon.name}
                  type="button"
                  title={icon.name}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  onClick={() => {
                    onSelectIcon(icon);
                    setSelecting(false);
                  }}
                >
                  <React.Suspense fallback={<span className="h-4 w-4" />}><icon.Component className="h-4 w-4 text-foreground" /></React.Suspense>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected icon + name + deselect cross */}
      {selectedIcon && (
        <div className="flex items-center gap-3">
          <div className="relative inline-block">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-input/50">
              <React.Suspense fallback={<span className="h-7 w-7" />}><selectedIcon.Component className="h-7 w-7 text-foreground" /></React.Suspense>
            </div>
            <button
              type="button"
              title="Remove icon"
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onClick={() => onSelectIcon(null)}
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>
          <span className="text-sm font-medium text-foreground">
            {selectedIcon.name}
          </span>
        </div>
      )}

      <Separator />

      {/* Size */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Size</span>
          <span className="text-sm text-muted-foreground">{size}px</span>
        </div>
        <Slider
          value={[size]}
          min={0}
          max={500}
          step={1}
          onValueChange={(v) => onSizeChange(v[0])}
        />
      </div>

      {/* Rotate */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Rotate</span>
          <span className="text-sm text-muted-foreground">{rotate}°</span>
        </div>
        <Slider
          value={[rotate]}
          min={-180}
          max={180}
          step={1}
          onValueChange={(v) => onRotateChange(v[0])}
        />
      </div>

      {/* Stroke weight */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Stroke Weight</span>
          <span className="text-sm text-muted-foreground">{borderRadius.toFixed(1)}</span>
        </div>
        <Slider
          value={[borderRadius]}
          min={1}
          max={4}
          step={0.1}
          onValueChange={(v) => onBorderRadiusChange(v[0])}
        />
      </div>

      {/* Border Color */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Icon Color</span>
        <ColorPicker value={color} onChange={onColorChange} />
      </div>
    </div>
  );
}

// Local cross icon so we don't depend on an extra import name mismatch
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1={18} y1={6} x2={6} y2={18} />
      <line x1={6} y1={6} x2={18} y2={18} />
    </svg>
  );
}
