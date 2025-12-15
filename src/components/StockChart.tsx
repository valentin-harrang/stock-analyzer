import { useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode, CandlestickSeries, LineSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, LineData, Time } from 'lightweight-charts';

interface ChartData {
  dates: string[];
  opens: number[];
  highs: number[];
  lows: number[];
  closes: number[];
}

interface StockChartProps {
  data: ChartData;
  mm200: number;
  currency: string;
}

export function StockChart({ data, mm200, currency }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const mm200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#334155',
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
    });

    chartRef.current = chart;

    // Candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });
    candlestickSeriesRef.current = candlestickSeries;

    // MM200 line series
    const mm200Series = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      title: 'MM200',
    });
    mm200SeriesRef.current = mm200Series;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update data when it changes
  useEffect(() => {
    if (!candlestickSeriesRef.current || !mm200SeriesRef.current) return;

    // Prepare candlestick data (chronological order - oldest first)
    const candlestickData: CandlestickData<Time>[] = [];
    const mm200Data: LineData<Time>[] = [];

    // Data comes in reverse order (newest first), so we reverse it
    for (let i = data.dates.length - 1; i >= 0; i--) {
      const time = data.dates[i] as Time;
      candlestickData.push({
        time,
        open: data.opens[i],
        high: data.highs[i],
        low: data.lows[i],
        close: data.closes[i],
      });

      // Calculate rolling MM200
      // We need at least some data points to show the line
      if (data.closes.length - i >= 20) {
        mm200Data.push({
          time,
          value: mm200, // Simplified: use the current MM200 value
        });
      }
    }

    // For a proper MM200 line, we'd need to calculate it for each point
    // Let's calculate a proper rolling average
    const sortedCloses = [...data.closes].reverse();
    const mm200Line: LineData<Time>[] = [];

    for (let i = 0; i < candlestickData.length; i++) {
      // Calculate MM200 up to this point (or use available data)
      const period = Math.min(200, i + 1);
      const startIdx = Math.max(0, i - period + 1);
      let sum = 0;
      for (let j = startIdx; j <= i; j++) {
        sum += sortedCloses[j];
      }
      const avg = sum / (i - startIdx + 1);

      mm200Line.push({
        time: candlestickData[i].time,
        value: avg,
      });
    }

    candlestickSeriesRef.current.setData(candlestickData);
    mm200SeriesRef.current.setData(mm200Line);

    // Fit content
    chartRef.current?.timeScale().fitContent();
  }, [data, mm200]);

  const cs = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-400">
          📊 Graphique
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-sm"></span>
            <span className="text-slate-400">Hausse</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-sm"></span>
            <span className="text-slate-400">Baisse</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-amber-500"></span>
            <span className="text-slate-400">MM200 ({cs}{mm200.toFixed(2)})</span>
          </div>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
