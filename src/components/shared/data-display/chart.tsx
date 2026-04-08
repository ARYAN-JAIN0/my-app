"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ChartProps {
  data: number[];
  labels?: string[];
  type?: "line" | "bar";
  className?: string;
  height?: number;
}

export function Chart({
  data,
  labels,
  type = "line",
  className,
  height = 200,
}: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const padding = 20;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;

    if (type === "line") {
      ctx.beginPath();
      ctx.strokeStyle = "#0ea5e9";
      ctx.lineWidth = 2;

      data.forEach((value, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((value - min) / range) * chartHeight;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw points
      data.forEach((value, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((value - min) / range) * chartHeight;
        ctx.beginPath();
        ctx.fillStyle = "#0ea5e9";
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      const barWidth = chartWidth / data.length - 4;
      data.forEach((value, index) => {
        const x = padding + (index / data.length) * chartWidth + 2;
        const barHeight = ((value - min) / range) * chartHeight;
        const y = padding + chartHeight - barHeight;
        ctx.fillStyle = "#0ea5e9";
        ctx.fillRect(x, y, barWidth, barHeight);
      });
    }
  }, [data, type]);

  return (
    <div className={cn("w-full", className)}>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height }}
      />
    </div>
  );
}
