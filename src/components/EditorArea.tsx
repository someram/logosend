"use client";

import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Sparkles } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { ScrollArea } from "../../components/ui/scroll-area";
import { IconEditorPanel, type IconEntry } from "./IconEditorPanel";
import type { ColorValue } from "./ColorPicker";
import { ColorPicker } from "./ColorPicker";
import { Slider } from "../../components/ui/slider";

const initialColor: ColorValue = { h: 210, s: 80, v: 95, a: 100 };
type CanvasIcon = { id: number; icon: IconEntry; x: number; y: number; size: number; rotate: number; radius: number; color: ColorValue };
type SheetStop = { id: number; color: ColorValue };

function toCssColor({ h, s, v, a }: ColorValue) {
  const saturation = s / 100, value = v / 100, chroma = value * saturation;
  const x = chroma * (1 - Math.abs((h / 60) % 2 - 1)), match = value - chroma;
  const channels = [[chroma,x,0],[x,chroma,0],[0,chroma,x],[0,x,chroma],[x,0,chroma],[chroma,0,x]][Math.floor(h / 60) % 6] ?? [chroma,x,0];
  return `rgba(${channels.map((channel) => Math.round((channel + match) * 255)).join(", ")}, ${a / 100})`;
}

export function EditorArea() {
  const [activeTab, setActiveTab] = React.useState<"icon" | "sheet">("icon");
  const [icons, setIcons] = React.useState<CanvasIcon[]>([{ id: 1, icon: { name: "Sparkles", Component: Sparkles }, x: 50, y: 50, size: 120, rotate: 0, radius: 4, color: initialColor }]);
  const [selectedId, setSelectedId] = React.useState(1);
  const [sheetMode, setSheetMode] = React.useState<"solid" | "gradient">("solid");
  const [sheetColor, setSheetColor] = React.useState<ColorValue>({ h: 0, s: 0, v: 100, a: 100 });
  const [stops, setStops] = React.useState<SheetStop[]>([
    { id: 1, color: { h: 240, s: 100, v: 25, a: 100 } },
    { id: 2, color: { h: 190, s: 100, v: 100, a: 100 } },
  ]);
  const [selectedStop, setSelectedStop] = React.useState(0);
  const [gradientAngle, setGradientAngle] = React.useState(90);
  const [sheetRadius, setSheetRadius] = React.useState(0);
  const [sheetPadding, setSheetPadding] = React.useState(0);
  const [sheetShadow, setSheetShadow] = React.useState(0);
  const selectedLayer = icons.find((layer) => layer.id === selectedId) ?? null;
  const nextId = React.useRef(2);
  const drag = React.useRef<{ id: number; startX: number; startY: number; x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const updateLayer = (id: number, changes: Partial<CanvasIcon>) => setIcons((all) => all.map((layer) => layer.id === id ? { ...layer, ...changes } : layer));
  const addIcon = (icon: IconEntry) => {
    const id = nextId.current++;
    setIcons((all) => [...all, { id, icon, x: 50, y: 50, size: 120, rotate: 0, radius: 4, color: initialColor }]);
    setSelectedId(id);
  };
  const sheetBackground = sheetMode === "solid" ? toCssColor(sheetColor) : `linear-gradient(${gradientAngle}deg, ${stops.map((stop, index) => `${toCssColor(stop.color)} ${Math.round(index / Math.max(1, stops.length - 1) * 100)}%`).join(", ")})`;

  const exportArtwork = React.useCallback((format: "png" | "svg") => {
    const size = 512;
    const padding = Math.min(sheetPadding, size / 3);
    const innerSize = size - padding * 2;
    const gradientId = "logosend-background";
    const background = sheetMode === "solid"
      ? `<rect x="${padding}" y="${padding}" width="${innerSize}" height="${innerSize}" rx="${sheetRadius}" fill="${toCssColor(sheetColor)}"/>`
      : `<defs><linearGradient id="${gradientId}" gradientTransform="rotate(${gradientAngle})">${stops.map((stop, index) => `<stop offset="${Math.round(index / Math.max(1, stops.length - 1) * 100)}%" stop-color="${toCssColor(stop.color)}"/>`).join("")}</linearGradient></defs><rect x="${padding}" y="${padding}" width="${innerSize}" height="${innerSize}" rx="${sheetRadius}" fill="url(#${gradientId})"/>`;
    const layers = icons.map((layer) => {
      const Icon = layer.icon.Component;
      const icon = renderToStaticMarkup(createElement(Icon, { width: "72%", height: "72%", strokeWidth: layer.radius, "aria-hidden": true }));
      const x = padding + innerSize * layer.x / 100;
      const y = padding + innerSize * layer.y / 100;
      return `<g transform="translate(${x} ${y}) rotate(${layer.rotate})" color="${toCssColor(layer.color)}"><svg x="${-layer.size / 2}" y="${-layer.size / 2}" width="${layer.size}" height="${layer.size}" viewBox="0 0 24 24">${icon.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</svg></g>`;
    }).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${background}${layers}</svg>`;
    const filename = `logosend-design.${format}`;
    const download = (url: string) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
    };
    if (format === "svg") {
      download(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
      return;
    }
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(image, 0, 0);
      download(canvas.toDataURL("image/png"));
    };
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [icons, sheetMode, sheetColor, stops, gradientAngle, sheetPadding, sheetRadius]);

  React.useEffect(() => {
    const onExport = (event: Event) => {
      const format = (event as CustomEvent<string>).detail;
      if (format === "png" || format === "svg") exportArtwork(format);
    };
    window.addEventListener("logosend:export", onExport);
    return () => window.removeEventListener("logosend:export", onExport);
  }, [exportArtwork]);

  React.useEffect(() => {
    if (!isDragging) return;
    const move = (event: PointerEvent) => {
      const activeDrag = drag.current;
      const sheet = sheetRef.current;
      if (!activeDrag || !sheet) return;
      const rect = sheet.getBoundingClientRect();
      updateLayer(activeDrag.id, {
        // Keep positions unbounded so the icon can cross every sheet edge.
        // The sheet clips its contents visually, while the pointer can still
        // continue dragging the icon beyond its bounds in any direction.
        x: activeDrag.x + (event.clientX - activeDrag.startX) / rect.width * 100,
        y: activeDrag.y + (event.clientY - activeDrag.startY) / rect.height * 100,
      });
    };
    const finish = () => { drag.current = null; setIsDragging(false); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
  }, [isDragging]);

  return (
    <div className="w-full flex-1 flex items-stretch">
      <div className="flex-none w-44 px-4 py-6 space-y-1">
        <Button variant="ghost" className="w-full justify-start rounded-none hover:bg-muted" aria-expanded={activeTab === "icon"} onClick={() => setActiveTab("icon")}>Icon</Button>
        <Button variant="ghost" className="w-full justify-start rounded-none hover:bg-muted" aria-expanded={activeTab === "sheet"} onClick={() => setActiveTab("sheet")}>Sheet</Button>
      </div>

      <Separator orientation="vertical" />

      <div className="flex-none w-80 overflow-hidden">
        <ScrollArea className="h-[600px]">
          <div className="px-6 py-8">
            {activeTab === "icon" ? (
              <IconEditorPanel
                selectedIcon={selectedLayer?.icon ?? null} onSelectIcon={(icon) => icon ? addIcon(icon) : setIcons((all) => all.filter((layer) => layer.id !== selectedId))}
                size={selectedLayer?.size ?? 120} onSizeChange={(size) => selectedLayer && updateLayer(selectedLayer.id, { size })} rotate={selectedLayer?.rotate ?? 0} onRotateChange={(rotate) => selectedLayer && updateLayer(selectedLayer.id, { rotate })}
                borderRadius={selectedLayer?.radius ?? 4} onBorderRadiusChange={(radius) => selectedLayer && updateLayer(selectedLayer.id, { radius })}
                color={selectedLayer?.color ?? initialColor} onColorChange={(color) => selectedLayer && updateLayer(selectedLayer.id, { color })} onColorCssChange={() => {}}
                layers={icons.map(({ id, icon }) => ({ id, name: icon.name, Component: icon.Component }))} selectedLayerId={selectedId} onSelectLayer={setSelectedId}
              />
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">Background</h3>
                  <button type="button" title="Pick a color from your screen" className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground hover:bg-muted/70" onClick={async () => {
                    const picker = (window as Window & { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
                    if (!picker) return;
                    try { const result = await new picker().open(); const hex = result.sRGBHex.slice(1); const channels = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16)); const max = Math.max(...channels) / 255, min = Math.min(...channels) / 255, delta = max - min; let h = 0; if (delta) h = max === channels[0] / 255 ? ((channels[1] - channels[2]) / 255 / delta + (channels[1] < channels[2] ? 6 : 0)) * 60 : max === channels[1] / 255 ? ((channels[2] - channels[0]) / 255 / delta + 2) * 60 : ((channels[0] - channels[1]) / 255 / delta + 4) * 60; const picked = { h: Math.round(h), s: Math.round((max ? delta / max : 0) * 100), v: Math.round(max * 100), a: 100 }; if (sheetMode === "solid") setSheetColor(picked); else setStops((all) => all.map((stop, index) => index === selectedStop ? { ...stop, color: picked } : stop)); } catch { /* User canceled the eyedropper. */ }
                  }}><PipetteIcon /></button>
                </div>
                <div className="flex rounded-lg bg-muted p-1 text-xs font-medium">
                  {(["solid", "gradient"] as const).map((mode) => <button type="button" key={mode} onClick={() => setSheetMode(mode)} className={`flex-1 rounded-md px-3 py-2 capitalize ${sheetMode === mode ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{mode}</button>)}
                </div>
                {sheetMode === "gradient" && <>
                  <div className="relative h-12 rounded-lg border border-border" style={{ background: sheetBackground }} onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); if (Math.abs(event.clientX - rect.left) < 15 || Math.abs(event.clientX - rect.right) < 15) { const newStop = { id: Date.now(), color: { h: 0, s: 0, v: 100, a: 100 } }; setStops((all) => [...all, newStop]); setSelectedStop(stops.length); } }}>
                    {stops.map((stop, index) => <button key={stop.id} type="button" aria-label={`Select gradient stop ${index + 1}`} onClick={(event) => { event.stopPropagation(); setSelectedStop(index); }} className={`absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow ${selectedStop === index ? "border-primary ring-2 ring-white" : "border-white"}`} style={{ left: `${index / Math.max(1, stops.length - 1) * 100}%`, backgroundColor: toCssColor(stop.color) }} />)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" aria-label="Reverse gradient" title="Reverse gradient" className="rounded-md border border-border px-2 py-1.5 text-sm hover:bg-muted" onClick={() => setStops((all) => [...all].reverse())}>↗</button>
                    <button type="button" aria-label="Add gradient stop" className="rounded-md border border-border px-2 py-1.5 text-sm hover:bg-muted" onClick={() => { const stop = { id: Date.now(), color: { h: 280, s: 65, v: 100, a: 100 } }; setStops((all) => [...all, stop]); setSelectedStop(stops.length); }}>◎</button>
                    <label className="flex flex-1 items-center justify-end gap-2 text-sm text-muted-foreground">∠ <input aria-label="Gradient angle" type="number" min="0" max="360" value={gradientAngle} onChange={(event) => setGradientAngle(Math.max(0, Math.min(360, Number(event.target.value) || 0)))} className="w-14 bg-transparent text-right text-foreground outline-none" />°</label>
                    <button type="button" aria-label="Remove gradient stop" className="rounded-md px-2 py-1.5 text-sm hover:bg-muted disabled:opacity-40" disabled={stops.length <= 2} onClick={() => { setStops((all) => all.filter((_, index) => index !== selectedStop)); setSelectedStop(Math.max(0, selectedStop - 1)); }}>⌫</button>
                  </div>
                  <input aria-label="Gradient position" type="range" min="0" max="100" value={Math.round(selectedStop / Math.max(1, stops.length - 1) * 100)} onChange={(event) => { const index = Math.round(Number(event.target.value) / 100 * (stops.length - 1)); setSelectedStop(index); }} className="w-full accent-primary" />
                </>}
                <ColorPicker value={sheetMode === "solid" ? sheetColor : stops[selectedStop]?.color} onChange={(color) => sheetMode === "solid" ? setSheetColor(color) : setStops((all) => all.map((stop, index) => index === selectedStop ? { ...stop, color } : stop))} />
                <div className="grid grid-cols-6 gap-2 border-t border-border pt-3">{["#111827", "#F43F5E", "#FB7185", "#F97316", "#FDE047", "#A3E635", "#34D399", "#22D3EE", "#38BDF8", "#818CF8", "#C084FC", "#E879F9", "#D946EF", "#A855F7", "#7C3AED", "#FFFFFF", "#9CA3AF", "#000000"].map((hex) => <button key={hex} type="button" title={hex} aria-label={`Set background ${hex}`} className="h-7 rounded-md border border-border/70" style={{ backgroundColor: hex }} onClick={() => { const channels = [0, 2, 4].map((index) => parseInt(hex.slice(index + 1, index + 3), 16)); const max = Math.max(...channels) / 255, min = Math.min(...channels) / 255, delta = max - min; let h = 0; if (delta) h = max === channels[0] / 255 ? ((channels[1] - channels[2]) / 255 / delta + (channels[1] < channels[2] ? 6 : 0)) * 60 : max === channels[1] / 255 ? ((channels[2] - channels[0]) / 255 / delta + 2) * 60 : ((channels[0] - channels[1]) / 255 / delta + 4) * 60; const picked = { h: Math.round(h), s: Math.round((max ? delta / max : 0) * 100), v: Math.round(max * 100), a: 100 }; if (sheetMode === "solid") setSheetColor(picked); else setStops((all) => all.map((stop, index) => index === selectedStop ? { ...stop, color: picked } : stop)); }} />)}</div>
                <div className="border-t border-border pt-4 flex flex-col gap-5">
                  <SheetSlider label="Rounded" value={sheetRadius} min={0} max={300} suffix="px" onChange={setSheetRadius} />
                  <SheetSlider label="Padding" value={sheetPadding} min={0} max={100} suffix="px" onChange={setSheetPadding} />
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between"><span className="text-sm font-medium text-foreground">Shadow</span><span className="text-sm text-muted-foreground">{["None", "SM", "MD", "LG", "XL", "2XL"][sheetShadow]}</span></div>
                    <Slider value={[sheetShadow]} min={0} max={5} step={1} onValueChange={(value) => setSheetShadow(value[0])} />
                    <div className="flex justify-between text-[10px] text-muted-foreground"><span>None</span><span>SM</span><span>MD</span><span>LG</span><span>XL</span><span>2XL</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator orientation="vertical" />

      <section className="flex min-w-0 flex-1 flex-col px-6 py-8" aria-label="Canvas">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">Canvas</h2>
        <div className="flex min-h-[520px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-[linear-gradient(45deg,#e4e7eb_25%,transparent_25%),linear-gradient(-45deg,#e4e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e4e7eb_75%),linear-gradient(-45deg,transparent_75%,#e4e7eb_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] p-8">
          <div
            className="relative aspect-square w-full max-w-[440px] border border-dashed border-black/20 bg-black/10"
            style={{ padding: `${sheetPadding}px` }}
            aria-label="Sheet preview"
          >
            <div ref={sheetRef} className="relative h-full w-full overflow-hidden" style={{ background: sheetBackground, borderRadius: `${sheetRadius}px`, boxShadow: ["none", "0 1px 2px rgb(0 0 0 / 0.12)", "0 4px 8px rgb(0 0 0 / 0.16)", "0 10px 18px rgb(0 0 0 / 0.2)", "0 18px 28px rgb(0 0 0 / 0.24)", "0 25px 50px rgb(0 0 0 / 0.3)"][sheetShadow] }}>
            {icons.map((layer) => {
              const Icon = layer.icon.Component;
              return <button key={layer.id} type="button" aria-label={`Select or move ${layer.icon.name}`} onClick={() => setSelectedId(layer.id)} onPointerDown={(event) => { event.preventDefault(); setSelectedId(layer.id); drag.current = { id: layer.id, startX: event.clientX, startY: event.clientY, x: layer.x, y: layer.y }; setIsDragging(true); }} className="absolute flex -translate-x-1/2 -translate-y-1/2 cursor-move touch-none items-center justify-center bg-transparent p-0" style={{ left: `${layer.x}%`, top: `${layer.y}%`, width: `min(${layer.size}px, 82vw, 82vh)`, height: `min(${layer.size}px, 82vw, 82vh)`, color: toCssColor(layer.color), transform: `translate(-50%, -50%) rotate(${layer.rotate}deg)` }}>
                <Icon aria-hidden="true" style={{ width: "72%", height: "72%" }} strokeWidth={layer.radius} />
              </button>;
            })}
            {icons.length === 0 && <span className="absolute inset-0 flex items-center justify-center text-xs text-white/45">Add an icon to your sheet</span>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SheetSlider({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix: string; onChange: (value: number) => void }) {
  return <div className="flex flex-col gap-1.5"><div className="flex items-center justify-between"><span className="text-sm font-medium text-foreground">{label}</span><span className="text-sm text-muted-foreground">{value}{suffix}</span></div><Slider value={[value]} min={min} max={max} step={1} onValueChange={(next) => onChange(next[0])} /></div>;
}

function PipetteIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m14 7 3-3 3 3-3 3"/><path d="m17 10-8.5 8.5a2.1 2.1 0 0 1-3-3L14 7"/><path d="m6 18-2 2"/></svg>;
}
