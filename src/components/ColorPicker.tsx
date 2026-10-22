"use client";

import * as React from "react";
import { cn } from "cn";

// ---------- HSV <-> RGB helpers ----------
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  s /= 100;
  v /= 100;
  const i = Math.floor(h / 60) % 6;
  const f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s);
  const q = v * (1 - s * f);
  const t = v * (1 - s * (1 - f));
  let r: number, g: number, b: number;
  switch (i) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    default:
      r = v;
      g = p;
      b = q;
      break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else if (max === b) h = ((r - g) / d + 4) * 60;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return [Math.round(h), Math.round(s * 100), Math.round(v * 100)];
}

export interface ColorValue {
  h: number;
  s: number;
  v: number;
  a: number;
}

interface ColorPickerProps {
  value?: ColorValue;
  onChange?: (color: ColorValue) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [h, setH] = React.useState(value?.h ?? 210);
  const [s, setS] = React.useState(value?.s ?? 80);
  const [v, setV] = React.useState(value?.v ?? 95);
  const [a, setA] = React.useState(value?.a ?? 100);

  React.useEffect(() => {
    if (!value) return;
    setH(value.h);
    setS(value.s);
    setV(value.v);
    setA(value.a);
  }, [value?.h, value?.s, value?.v, value?.a]);

  const planeRef = React.useRef<HTMLDivElement>(null);
  const [planeSize, setPlaneSize] = React.useState({ w: 0, h: 0 });
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    const plane = planeRef.current;
    if (!plane) return;
    const resizeObserver = new ResizeObserver(([entry]) => {
      setPlaneSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    resizeObserver.observe(plane);
    return () => resizeObserver.disconnect();
  }, []);

  React.useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!isDragging) return;
      applyPoint(e.clientX, e.clientY);
    };
    const handleUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    }
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging, planeSize.w, planeSize.h, h, s, v, a]);

  const clamp = (n: number, min: number, max: number) =>
    Math.min(Math.max(n, min), max);

  const applyPoint = (clientX: number, clientY: number) => {
    if (!planeRef.current || planeSize.w === 0 || planeSize.h === 0) return;
    const rect = planeRef.current.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const y = clamp(clientY - rect.top, 0, rect.height);
    const newSat = Math.round((x / rect.width) * 100);
    const newVal = Math.round(100 - (y / rect.height) * 100);
    setS(newSat);
    setV(newVal);
    onChange?.({ h, s: newSat, v: newVal, a });
  };

  const rgb = React.useMemo(() => hsvToRgb(h, s, v), [h, s, v]);
  const hex = React.useMemo(() => rgbToHex(rgb[0], rgb[1], rgb[2]), [rgb]);
  const currentColor = React.useMemo(
    () => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a / 100})`,
    [rgb, a]
  );

  const [hexInput, setHexInput] = React.useState(hex);
  const [rInput, setRInput] = React.useState(String(rgb[0]));
  const [gInput, setGInput] = React.useState(String(rgb[1]));
  const [bInput, setBInput] = React.useState(String(rgb[2]));
  const [aInput, setAInput] = React.useState(String(a));

  React.useEffect(() => {
    setHexInput(hex);
  }, [hex]);
  React.useEffect(() => {
    setRInput(String(rgb[0]));
  }, [rgb[0]]);
  React.useEffect(() => {
    setGInput(String(rgb[1]));
  }, [rgb[1]]);
  React.useEffect(() => {
    setBInput(String(rgb[2]));
  }, [rgb[2]]);
  React.useEffect(() => {
    setAInput(String(a));
  }, [a]);

  const updateFromHex = (val: string) => {
    let clean = val.trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{3}$/.test(clean)) clean = [...clean].map((char) => char + char).join("");
    if (/^[0-9a-fA-F]{6}$/.test(clean)) {
      const r = parseInt(clean.slice(0, 2), 16);
      const g = parseInt(clean.slice(2, 4), 16);
      const b = parseInt(clean.slice(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        const [nh, ns, nv] = rgbToHsv(r, g, b);
        setH(nh); setS(ns); setV(nv);
        setHexInput(`#${clean.toUpperCase()}`);
        setRInput(String(r));
        setGInput(String(g));
        setBInput(String(b));
        onChange?.({ h: nh, s: ns, v: nv, a });
      }
    }
  };

  const updateFromRgb = () => {
    const r = Math.min(255, Math.max(0, parseInt(rInput, 10) || 0));
    const g = Math.min(255, Math.max(0, parseInt(gInput, 10) || 0));
    const b = Math.min(255, Math.max(0, parseInt(bInput, 10) || 0));
    const [nh, ns, nv] = rgbToHsv(r, g, b);
    setH(nh); setS(ns); setV(nv);
    onChange?.({ h: nh, s: ns, v: nv, a });
    setRInput(String(r));
    setGInput(String(g));
    setBInput(String(b));
  };

  const updateAlphaInput = (val: string) => {
    const nv = Math.min(100, Math.max(0, parseInt(val, 10) || 0));
    setA(nv);
    onChange?.({ h, s, v, a: nv });
    setAInput(String(nv));
  };

  const thumbX = planeSize.w ? (s / 100) * planeSize.w : 0;
  const thumbY = planeSize.h ? (1 - v / 100) * planeSize.h : 0;

  return (
    <>
      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    <div className="flex flex-col gap-3 w-full">
      {/* Saturation / value plane + preview swatch */}
      <div className="flex items-stretch gap-3">
        <div
          ref={planeRef}
          data-slot="color-plane"
          className="relative h-28 w-full flex-1 cursor-crosshair rounded-lg border border-border select-none touch-none"
          style={{
            background: `
              linear-gradient(to top, rgba(0,0,0,1) 0%, transparent 100%),
              linear-gradient(to right, rgba(255,255,255,1) 0%, transparent 100%),
              hsla(${h}, 100%, 50%, 1)
            `,
          }}
          onPointerDown={(e) => {
            applyPoint(e.clientX, e.clientY);
            setIsDragging(true);
          }}
        >
          <span
            className="absolute block h-3.5 w-3.5 rounded-full ring-2 ring-white shadow"
            style={{
              left: 0,
              top: 0,
              transform: `translate(${thumbX - 7}px, ${thumbY - 7}px)`,
              backgroundColor: currentColor,
            }}
          />
        </div>
      </div>

      {/* Hue slider (rainbow) */}
      <RangeSlider
        label="Hue"
        value={h}
        min={0}
        max={360}
        step={1}
        trackClass="hue"
        onChange={(nv) => {
          setH(nv);
          onChange?.({ h: nv, s, v, a });
        }}
      />

      {/* Alpha slider */}
      <RangeSlider
        label="Alpha"
        value={a}
        min={0}
        max={100}
        step={1}
        trackClass="alpha"
        trackColor={currentColor}
        onChange={(nv) => {
          setA(nv);
          onChange?.({ h, s, v, a: nv });
        }}
      />

      {/* HEX / R / G / B / A value boxes */}
      <div className="grid grid-cols-5 gap-1.5">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">HEX</span>
          <input
            className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none rounded-md border border-border bg-input/50 px-1 py-0.5 text-[11px] font-medium text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ring w-full"
            value={hexInput}
            onChange={(e) => {
              setHexInput(e.target.value);
              updateFromHex(e.target.value);
            }}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData("text").trim();
              if (!/^#?(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(pasted)) return;
              e.preventDefault();
              updateFromHex(pasted);
            }}
            onBlur={() => {
              if (!/^#?(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hexInput.trim())) setHexInput(hex);
            }}
          />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">R</span>
          <input
            className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none rounded-md border border-border bg-input/50 px-1 py-0.5 text-[11px] font-medium text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ring w-full"
            value={rInput}
            type="number"
            min={0}
            max={255}
            onChange={(e) => setRInput(e.target.value)}
            onBlur={updateFromRgb}
          />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">G</span>
          <input
            className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none rounded-md border border-border bg-input/50 px-1 py-0.5 text-[11px] font-medium text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ring w-full"
            value={gInput}
            type="number"
            min={0}
            max={255}
            onChange={(e) => setGInput(e.target.value)}
            onBlur={updateFromRgb}
          />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">B</span>
          <input
            className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none rounded-md border border-border bg-input/50 px-1 py-0.5 text-[11px] font-medium text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ring w-full"
            value={bInput}
            type="number"
            min={0}
            max={255}
            onChange={(e) => setBInput(e.target.value)}
            onBlur={updateFromRgb}
          />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">A</span>
          <input
            className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none rounded-md border border-border bg-input/50 px-1 py-0.5 text-[11px] font-medium text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ring w-full"
            value={aInput}
            type="number"
            min={0}
            max={100}
            onChange={(e) => setAInput(e.target.value)}
            onBlur={() => updateAlphaInput(aInput)}
          />
        </div>
      </div>
    </div>
    </>
  );
}

function ValueBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center rounded-md border border-border bg-input/50 px-1.5 py-1.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="mt-0.5 max-w-full text-[11px] font-medium text-foreground break-all text-center">
        {value}
      </span>
    </div>
  );
}

interface RangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  trackClass: "hue" | "alpha";
  trackColor?: string;
  onChange: (value: number) => void;
}

const hueGradient =
  "linear-gradient(90deg,#ff0000 0%,#ffff00 17%,#00ff00 33%,#00ffff 50%,#0000ff 67%,#ff00ff 83%,#ff0000 100%)";

function RangeSlider({
  label,
  value,
  min,
  max,
  step = 1,
  trackClass,
  trackColor,
  onChange,
}: RangeSliderProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const percent = ((value - min) / (max - min)) * 100;

  const seek = React.useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = clamp(clientX - rect.left, 0, rect.width);
      const ratio = rect.width ? x / rect.width : 0;
      const nv = Math.round(min + ratio * (max - min));
      const snapped = Math.round(nv / step) * step;
      onChange(snapped);
    },
    [min, max, step, onChange]
  );

  React.useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => seek(e.clientX);
    const up = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, seek]);

  const trackStyle: React.CSSProperties =
    trackClass === "hue"
      ? { backgroundImage: hueGradient, backgroundColor: "#e5e7eb" }
      : {
          backgroundColor: "#f1f5f9",
          backgroundImage: `
            linear-gradient(45deg, #d1d5db 25%, transparent 25%),
            linear-gradient(-45deg, #d1d5db 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #d1d5db 75%),
            linear-gradient(-45deg, transparent 75%, #d1d5db 75%)
          `,
          backgroundSize: "100% 100%, 8px 8px, 8px 8px, 8px 8px, 8px 8px",
          backgroundPosition: "0 0, 4px 0, 4px -4px, 0 4px",
          backgroundBlendMode: "normal",
          background: `linear-gradient(to right, transparent, ${trackColor ?? "transparent"}),
            linear-gradient(45deg, #d1d5db 25%, transparent 25%),
            linear-gradient(-45deg, #d1d5db 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #d1d5db 75%),
            linear-gradient(-45deg, transparent 75%, #d1d5db 75%), #f1f5f9`,
        };

  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <div
        ref={trackRef}
        data-slot="range-track"
        className="relative h-2.5 flex-1 cursor-pointer rounded-full"
        style={trackStyle}
        onPointerDown={() => setDragging(true)}
      >
        <span
          className={"absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full shadow " + (trackClass === "alpha" ? "h-3 w-3 border border-black bg-transparent" : "h-4 w-4 ring-2 ring-white/80 bg-white")}
          style={{ left: `${percent}%`, ...(trackClass === "alpha" ? { backgroundColor: trackColor, border: "1px solid #000" } : {}) }}
        />
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}
