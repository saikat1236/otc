import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function Chart({
  candles = [],
  currentCandle = null,
  currentPrice = 96420,
  activeTrades = [],
  roundTimeRemaining = 35,
  candleRemainingSec = 5,
  asset = 'USD/CAD',
  sentimentPool = { callPct: 74, putPct: 26 },
  currency = 'INR'
}) {
  const containerRef = useRef(null);
  const mainCanvasRef = useRef(null);

  // UI Controls
  const [chartType, setChartType] = useState('candle'); // 'candle' | 'line' | 'bars'
  const [timeframe, setTimeframe] = useState('1m');
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [showMA7, setShowMA7] = useState(true);
  const [showEMA21, setShowEMA21] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(30); // Number of visible candles

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  // Calculate exponential moving average
  const calculateEMA = (data, period) => {
    if (data.length < period) return [];
    const k = 2 / (period + 1);
    const emaArray = [];
    let prevEma = data.slice(0, period).reduce((acc, c) => acc + c.close, 0) / period;
    emaArray.push({ index: period - 1, val: prevEma });

    for (let i = period; i < data.length; i++) {
      const currentEma = data[i].close * k + prevEma * (1 - k);
      emaArray.push({ index: i, val: currentEma });
      prevEma = currentEma;
    }
    return emaArray;
  };

  // Main draw function
  const drawChart = useCallback(() => {
    const canvas = mainCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Deep Quotex Slate Background
    ctx.fillStyle = '#111622';
    ctx.fillRect(0, 0, w, h);

    // Combine completed historical candles + live working candle
    const allCandles = [...candles];
    if (currentCandle) {
      allCandles.push(currentCandle);
    }
    if (allCandles.length === 0) return;

    // Dimensions & Mobile Responsive Scaling
    const isMobile = w < 600;
    const rightAxisWidth = isMobile ? 54 : 76;
    const leftMargin = isMobile ? 20 : 38; // Room for Sentiment Bar on left
    const topPadding = isMobile ? 16 : 24;
    const bottomPadding = isMobile ? 20 : 26;
    const chartW = w - rightAxisWidth;
    const chartH = h - topPadding - bottomPadding;

    // Visible candle window (slightly fewer on mobile for clear viewing)
    const activeZoom = isMobile ? Math.min(zoomLevel, 24) : zoomLevel;
    const maxVisibleCandles = Math.min(allCandles.length, activeZoom);
    const visible = allCandles.slice(-maxVisibleCandles);
    const rightMarginOffsetCandles = isMobile ? 4.0 : 5.5; // Space for guidelines & expiration

    // Price scale min/max
    let minP = Infinity, maxP = -Infinity;
    for (const c of visible) {
      if (c.low < minP) minP = c.low;
      if (c.high > maxP) maxP = c.high;
    }
    for (const t of activeTrades) {
      if (t.entryPrice < minP) minP = t.entryPrice;
      if (t.entryPrice > maxP) maxP = t.entryPrice;
    }
    if (currentPrice < minP) minP = currentPrice;
    if (currentPrice > maxP) maxP = currentPrice;

    const pRange = maxP - minP || 10;
    const padding = pRange * 0.16;
    minP -= padding;
    maxP += padding;

    const priceToY = (p) => topPadding + chartH - ((p - minP) / (maxP - minP)) * chartH;

    // Candle layout
    const totalSlots = maxVisibleCandles + rightMarginOffsetCandles;
    const usableW = chartW - leftMargin;
    const candleSpacing = usableW / totalSlots;
    const candleW = Math.max(4, Math.min(18, candleSpacing * (isMobile ? 0.62 : 0.68)));

    const candleX = (i) => leftMargin + (i + 1) * candleSpacing;

    // ── 1. Subtle High-DPI Grid Lines & Right Price Scale ──
    const gridLevels = isMobile ? 5 : 7;
    ctx.lineWidth = 0.6;
    for (let i = 0; i <= gridLevels; i++) {
      const price = minP + (maxP - minP) * (i / gridLevels);
      const y = priceToY(price);

      // Horizontal grid line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.moveTo(leftMargin, y);
      ctx.lineTo(chartW, y);
      ctx.stroke();

      // Right axis price text
      ctx.fillStyle = '#65748c';
      ctx.font = isMobile ? '8.5px JetBrains Mono, monospace' : '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      const formattedPrice = price < 10 ? price.toFixed(isMobile ? 4 : 5) : price.toFixed(isMobile ? 1 : 2);
      ctx.fillText(formattedPrice, chartW + 4, y + 3);
    }

    // Vertical grid lines
    const vStep = Math.max(3, Math.floor(maxVisibleCandles / (isMobile ? 3 : 5)));
    for (let i = 0; i < visible.length; i += vStep) {
      const x = candleX(i);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.beginPath();
      ctx.moveTo(x, topPadding);
      ctx.lineTo(x, h - bottomPadding);
      ctx.stroke();

      // Bottom time label
      const c = visible[i];
      if (c && c.time) {
        const d = new Date(c.time);
        const timeStr = String(d.getHours()).padStart(2, '0') + ':' + 
                        String(d.getMinutes()).padStart(2, '0');
        ctx.fillStyle = '#65748c';
        ctx.font = isMobile ? '8.5px JetBrains Mono, monospace' : '9.5px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, x, h - (isMobile ? 6 : 8));
      }
    }

    // ── 2. "Beginning of trade" and "End of trade" Vertical Dashed Lines ──
    const liveIndex = visible.length - 1;
    const startLineX = candleX(liveIndex);
    const endLineOffset = isMobile ? Math.min(candleSpacing * 3.0, chartW - startLineX - 10) : candleSpacing * 3.8;
    const endLineX = Math.min(chartW - 6, startLineX + endLineOffset);

    // Beginning of trade line
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startLineX, topPadding);
    ctx.lineTo(startLineX, h - bottomPadding);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = isMobile ? '8px Inter, sans-serif' : '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isMobile ? 'Start' : 'Beginning of trade', startLineX, topPadding + 12);

    // End of trade line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.moveTo(endLineX, topPadding);
    ctx.lineTo(endLineX, h - bottomPadding);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = isMobile ? '8.5px Inter, sans-serif' : '9.5px Inter, sans-serif';
    ctx.fillText(isMobile ? 'End' : 'End of trade', endLineX, topPadding + 12);

    // Round countdown badge on expiration line
    const mm = String(Math.floor(roundTimeRemaining / 60)).padStart(2, '0');
    const ss = String(roundTimeRemaining % 60).padStart(2, '0');
    const timerText = `${mm}:${ss}`;
    const badgeW = isMobile ? 36 : 44;
    const badgeH = isMobile ? 15 : 18;
    ctx.fillStyle = 'rgba(26, 33, 49, 0.9)';
    ctx.fillRect(endLineX - badgeW / 2, topPadding + (isMobile ? 18 : 22), badgeW, badgeH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.strokeRect(endLineX - badgeW / 2, topPadding + (isMobile ? 18 : 22), badgeW, badgeH);

    ctx.fillStyle = '#00e5a0';
    ctx.font = isMobile ? 'bold 8.5px JetBrains Mono, monospace' : 'bold 9.5px JetBrains Mono, monospace';
    ctx.fillText(timerText, endLineX, topPadding + (isMobile ? 29 : 34));
    ctx.restore();

    // ── 3. Technical Indicators (SMA/EMA) ──
    if (showMA7 && visible.length >= 7) {
      ctx.save();
      ctx.strokeStyle = '#f5a623';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (let i = 6; i < visible.length; i++) {
        let sum = 0;
        for (let j = i - 6; j <= i; j++) sum += visible[j].close;
        const ma = sum / 7;
        const x = candleX(i);
        const y = priceToY(ma);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else { ctx.lineTo(x, y); }
      }
      ctx.stroke();
      ctx.restore();
    }

    if (showEMA21 && visible.length >= 10) {
      const emaPoints = calculateEMA(visible, Math.min(21, visible.length));
      if (emaPoints.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#0077ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        emaPoints.forEach((pt, idx) => {
          const x = candleX(pt.index);
          const y = priceToY(pt.val);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.restore();
      }
    }

    // ── 4. Candlesticks / Line Rendering ──
    if (chartType === 'candle') {
      visible.forEach((candle, i) => {
        const x = candleX(i);
        const isUp = candle.close >= candle.open;

        // Quotex vibrant colors
        const bodyColor = isUp ? '#0faf59' : '#ff4a4a';
        const wickColor = isUp ? '#0faf59' : '#ff4a4a';

        const bodyTop = priceToY(Math.max(candle.open, candle.close));
        const bodyBot = priceToY(Math.min(candle.open, candle.close));
        const bodyH = Math.max(bodyBot - bodyTop, 2.0);

        const wickHighY = Math.min(priceToY(candle.high), bodyTop - 1.5);
        const wickLowY = Math.max(priceToY(candle.low), bodyBot + 1.5);

        // High/low wick
        ctx.save();
        ctx.strokeStyle = wickColor;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(x, wickHighY);
        ctx.lineTo(x, wickLowY);
        ctx.stroke();

        // Solid body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);

        // Border & glow on working candle
        if (i === visible.length - 1) {
          ctx.shadowColor = bodyColor;
          ctx.shadowBlur = 6;
          ctx.strokeRect(x - candleW / 2, bodyTop, candleW, bodyH);
        }
        ctx.restore();
      });
    } else {
      // Area/Line chart
      ctx.save();
      ctx.strokeStyle = '#00e5a0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      visible.forEach((c, i) => {
        const x = candleX(i);
        const y = priceToY(c.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    }

    // ── 5. Current Price Guideline & Quotex Blue Price Tag ──
    const liveX = candleX(visible.length - 1);
    const liveY = priceToY(currentPrice);

    ctx.save();
    // Dotted horizontal line
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(0, 119, 255, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(leftMargin, liveY);
    ctx.lineTo(chartW, liveY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Quotex Signature Blue Price Badge on Right Axis
    const tagH = 18;
    const tagW = isMobile ? 52 : 74;
    ctx.fillStyle = '#0077ff';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(chartW + 1, liveY - tagH / 2, tagW, tagH, 3) : ctx.fillRect(chartW + 1, liveY - tagH / 2, tagW, tagH);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = isMobile ? 'bold 8px JetBrains Mono, monospace' : 'bold 9.5px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    const tagPriceStr = currentPrice < 10 ? currentPrice.toFixed(isMobile ? 4 : 5) : currentPrice.toFixed(isMobile ? 1 : 2);
    ctx.fillText(tagPriceStr, chartW + 3, liveY + 3);

    // Live blinking dot on candle
    ctx.fillStyle = '#0077ff';
    ctx.beginPath();
    ctx.arc(liveX, liveY, isMobile ? 3 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── 6. Active Trade Markers on Chart (Quotex Green/Red Pill) ──
    activeTrades.forEach((trade) => {
      const isCall = trade.direction === 'CALL' || trade.direction === 'up';
      const entryPrice = trade.entryPrice;
      const entryY = priceToY(entryPrice);
      const isProfitable = isCall ? (currentPrice >= entryPrice) : (currentPrice <= entryPrice);
      const tradeColor = isCall ? '#0faf59' : '#ff4a4a';

      ctx.save();
      // Dashed horizontal entry line
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = tradeColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(leftMargin, entryY);
      ctx.lineTo(chartW, entryY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Quotex Trade Pill: e.g. "10,900 ₹ 00:43" directly on the dotted line!
      const pillText = `${trade.amount.toLocaleString()} ${currencySymbol} ${timerText}`;
      ctx.font = 'bold 9.5px JetBrains Mono, monospace';
      const pillWidth = ctx.measureText(pillText).width + 18;
      const pillHeight = 20;
      const pillX = liveX - 40;

      // Draw rounded pill
      ctx.fillStyle = tradeColor;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(pillX, entryY - pillHeight / 2, pillWidth, pillHeight, 10);
      } else {
        ctx.fillRect(pillX, entryY - pillHeight / 2, pillWidth, pillHeight);
      }
      ctx.fill();

      // Pill text & dot
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(pillText, pillX + pillWidth / 2, entryY + 3.5);

      ctx.restore();
    });

  }, [candles, currentCandle, currentPrice, activeTrades, roundTimeRemaining, candleRemainingSec, chartType, showMA7, showEMA21, zoomLevel, currency]);

  // Request Animation Frame loop for smooth tick renders
  useEffect(() => {
    let animId;
    const render = () => {
      drawChart();
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [drawChart]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        background: '#111622',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        display: 'flex'
      }}
    >
      {/* ── Quotex Bull/Bear Sentiment Meter Pinned to Far Left ── */}
      <div style={{
        position: 'absolute',
        top: 18,
        bottom: 22,
        left: 4,
        width: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 20,
        userSelect: 'none'
      }}>
        {/* Call (Bull) Percentage Label */}
        <span style={{
          color: '#0faf59',
          fontWeight: 800,
          fontSize: '0.62rem',
          fontFamily: 'JetBrains Mono, monospace',
          marginBottom: 3
        }}>
          {sentimentPool.callPct}%
        </span>

        {/* Vertical Split Bar */}
        <div style={{
          flex: 1,
          width: 5,
          borderRadius: 3,
          background: '#1a2233',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Green Segment */}
          <div style={{
            height: `${sentimentPool.callPct}%`,
            background: 'linear-gradient(180deg, #0faf59 0%, #009944 100%)',
            transition: 'height 0.4s ease'
          }} />
          {/* Red Segment */}
          <div style={{
            height: `${sentimentPool.putPct}%`,
            background: 'linear-gradient(180deg, #ff4a4a 0%, #cc2b2b 100%)',
            transition: 'height 0.4s ease'
          }} />
        </div>

        {/* Put (Bear) Percentage Label */}
        <span style={{
          color: '#ff4a4a',
          fontWeight: 800,
          fontSize: '0.62rem',
          fontFamily: 'JetBrains Mono, monospace',
          marginTop: 3
        }}>
          {sentimentPool.putPct}%
        </span>
      </div>

      {/* Main Canvas */}
      <canvas
        ref={mainCanvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />

      {/* ── Quotex Floating Chart Tools (Bottom-Left) ── */}
      <div style={{
        position: 'absolute',
        bottom: 8,
        left: 22,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        zIndex: 30,
        background: 'rgba(19, 24, 36, 0.92)',
        padding: '3px 8px',
        borderRadius: 8,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(8px)'
      }}>
        {/* Timeframe Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
            style={{
              padding: '4px 8px',
              borderRadius: 5,
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 3
            }}
          >
            <span>{timeframe}</span>
            <span style={{ fontSize: '0.6rem', color: '#7b879c' }}>▾</span>
          </button>

          {showTimeframeDropdown && (
            <div style={{
              position: 'absolute',
              bottom: '120%',
              left: 0,
              background: '#161c2b',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 8,
              padding: 4,
              boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              zIndex: 100
            }}>
              {['5s', '15s', '30s', '1m', '2m', '5m'].map(tf => (
                <button
                  key={tf}
                  onClick={() => {
                    setTimeframe(tf);
                    setShowTimeframeDropdown(false);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    background: timeframe === tf ? '#0077ff' : 'transparent',
                    color: '#fff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chart Type Toggle (Candles vs Line) */}
        <button
          onClick={() => setChartType(prev => prev === 'candle' ? 'line' : 'candle')}
          style={{
            padding: '4px 8px',
            borderRadius: 5,
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#8fa0b5',
            fontSize: '0.72rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
          title={chartType === 'candle' ? 'Switch to Line' : 'Switch to Candlesticks'}
        >
          {chartType === 'candle' ? '🕯️' : '📈'}
        </button>

        {/* Indicators Toggle */}
        <button
          onClick={() => setShowIndicators(!showIndicators)}
          style={{
            padding: '4px 8px',
            borderRadius: 5,
            background: (showMA7 || showEMA21) ? 'rgba(0, 119, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            color: (showMA7 || showEMA21) ? '#0077ff' : '#8fa0b5',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
          title="Indicators"
        >
          ƒ(x)
        </button>

        {showIndicators && (
          <div style={{
            position: 'absolute',
            bottom: '120%',
            left: 50,
            background: '#161c2b',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 8,
            padding: 8,
            boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            zIndex: 100,
            width: 140
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#f5a623', cursor: 'pointer' }}>
              <input type="checkbox" checked={showMA7} onChange={(e) => setShowMA7(e.target.checked)} />
              <span>SMA (7)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#0077ff', cursor: 'pointer' }}>
              <input type="checkbox" checked={showEMA21} onChange={(e) => setShowEMA21(e.target.checked)} />
              <span>EMA (21)</span>
            </label>
          </div>
        )}

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 4 }}>
          <button
            onClick={() => setZoomLevel(prev => Math.max(15, prev - 5))}
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#8fa0b5',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.min(60, prev + 5))}
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#8fa0b5',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Zoom Out"
          >
            -
          </button>
        </div>
      </div>
    </div>
  );
}
