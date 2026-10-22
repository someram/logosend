"use client";
import * as React from "react";

function makeCharIcon(char: string) {
  const IconComponent: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <text x="12" y="17" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="400" fill="currentColor" stroke="none">{char}</text>
    </svg>
  );
  return IconComponent;
}

export const A = makeCharIcon("A");
export const B = makeCharIcon("B");
export const C = makeCharIcon("C");
export const D = makeCharIcon("D");
export const E = makeCharIcon("E");
export const F = makeCharIcon("F");
export const G = makeCharIcon("G");
export const H = makeCharIcon("H");
export const I = makeCharIcon("I");
export const J = makeCharIcon("J");
export const K = makeCharIcon("K");
export const L = makeCharIcon("L");
export const M = makeCharIcon("M");
export const N = makeCharIcon("N");
export const O = makeCharIcon("O");
export const P = makeCharIcon("P");
export const Q = makeCharIcon("Q");
export const R = makeCharIcon("R");
export const S = makeCharIcon("S");
export const T = makeCharIcon("T");
export const U = makeCharIcon("U");
export const V = makeCharIcon("V");
export const W = makeCharIcon("W");
export const X = makeCharIcon("X");
export const Y = makeCharIcon("Y");
export const Z = makeCharIcon("Z");

export const N0 = makeCharIcon("0");
export const N1 = makeCharIcon("1");
export const N2 = makeCharIcon("2");
export const N3 = makeCharIcon("3");
export const N4 = makeCharIcon("4");
export const N5 = makeCharIcon("5");
export const N6 = makeCharIcon("6");
export const N7 = makeCharIcon("7");
export const N8 = makeCharIcon("8");
export const N9 = makeCharIcon("9");
