import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function Chart({
  candles = [],
  currentCandle = null,
  currentPrice = 96420,
  activeTrades = [],
  roundTimeRemaining = 30,
  candleRemainingSec = 5,
  asset = 'BTC/USDT OTC'
}) {
  const containerRef = useRef(null);
  const mainCanvasRef = useRef(null);
  const volumeCanvasRef = useRef(null);
  
  // UI Controls
  const [chartType, setChartType] = useState('candle'); // 'candle' | 'line'
  const [showMA7, setShowMA7] = useState(true);
  const [showEMA21, setShowEMA21] = useState(false);
  
  // Hover & Crosshair state
  const [hoverData, setHoverData] = useState(null);
  const [crosshairPos, setCrosshairPos] = useState(null);

  // Pulse animation reference
  const pulseRef = useRef(0);
  const animFrameRef = useRef(null);

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
    const volCanvas = volumeCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height - 38; // leave 38px for volume bars

    // Resize canvas buffers
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    if (volCanvas && (volCanvas.width !== Math.floor(w * dpr) || volCanvas.height !== Math.floor(38 * dpr))) {
      volCanvas.width = Math.floor(w * dpr);
      volCanvas.height = Math.floor(38 * dpr);
      volCanvas.style.width = `${w}px`;
      volCanvas.style.height = '38px';
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Combine completed historical candles + live working candle
    const allCandles = [...candles];
    if (currentCandle) {
      allCandles.push(currentCandle);
    }
    if (allCandles.length === 0) return;

    // Pro Chart Dimensions
    const rightAxisWidth = 72;
    const topPadding = 28;
    const bottomPadding = 22;
    const chartW = w - rightAxisWidth;
    const chartH = h - topPadding - bottomPadding;

    // Visible window: keep room on right so the live candle forms naturally
    const rightMarginOffsetCandles = 3.5;
    const maxVisibleCandles = Math.min(allCandles.length, 30);
    const visible = allCandles.slice(-maxVisibleCandles);

    // Calculate Price Min & Max
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
    const padding = pRange * 0.18;
    minP -= padding;
    maxP += padding;

    const priceToY = (p) => topPadding + chartH - ((p - minP) / (maxP - minP)) * chartH;
    const yToPrice = (y) => maxP - ((y - topPadding) / chartH) * (maxP - minP);

    // Candle layout
    const totalSlots = maxVisibleCandles + rightMarginOffsetCandles;
    const candleSpacing = chartW / totalSlots;
    const candleW = Math.max(6, Math.min(20, candleSpacing * 0.70));

    // ── 1. Subtle Pro Horizontal Grid Lines & Right Price Axis ──
    const gridLevels = 6;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridLevels; i++) {
      const price = minP + (maxP - minP) * (i / gridLevels);
      const y = priceToY(price);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartW, y);
      ctx.stroke();

      ctx.fillStyle = '#61718c';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(2), chartW + 6, y + 3.5);
    }

    // ── 2. Time Scale Labels (Bottom) ──
    ctx.fillStyle = '#61718c';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    const timeStep = Math.max(4, Math.floor(maxVisibleCandles / 4));
    for (let i = 0; i < visible.length; i += timeStep) {
      const c = visible[i];
      if (c && c.time) {
        const d = new Date(c.time);
        const timeStr = String(d.getHours()).padStart(2, '0') + ':' + 
                        String(d.getMinutes()).padStart(2, '0') + ':' + 
                        String(d.getSeconds()).padStart(2, '0');
        const x = (i + 1) * candleSpacing;
        ctx.fillText(timeStr, x, h - 6);
      }
    }

    // ── 3. Technical Indicators ──
    // MA 7 (Golden)
    if (showMA7 && visible.length >= 7) {
      ctx.save();
      ctx.strokeStyle = '#f0a500';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      let started = false;
      for (let i = 6; i < visible.length; i++) {
        let sum = 0;
        for (let j = i - 6; j <= i; j++) sum += visible[j].close;
        const ma = sum / 7;
        const x = (i + 1) * candleSpacing;
        const y = priceToY(ma);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else { ctx.lineTo(x, y); }
      }
      ctx.stroke();
      ctx.restore();
    }

    // EMA 21 (Cyan)
    if (showEMA21 && visible.length >= 10) {
      const emaPoints = calculateEMA(visible, Math.min(21, visible.length));
      if (emaPoints.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#00b4d8';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        emaPoints.forEach((pt, idx) => {
          const x = (pt.index + 1) * candleSpacing;
          const y = priceToY(pt.val);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.restore();
      }
    }

    // ── 4. Render Authentic TradingView Style Candlesticks ──
    if (chartType === 'candle') {
      visible.forEach((candle, i) => {
        const x = (i + 1) * candleSpacing;
        const isUp = candle.close >= candle.open;
        
        // TradingView Pro Colors
        const fillColor = isUp ? '#089981' : '#f23645';
        const strokeColor = isUp ? '#00F090' : '#FF355E';
        
        // Body Top & Bottom
        const bodyTop = priceToY(Math.max(candle.open, candle.close));
        const bodyBot = priceToY(Math.min(candle.open, candle.close));
        const bodyH = Math.max(bodyBot - bodyTop, 2.0);

        // Ensure visible upper and lower wicks
        const wickHighY = Math.min(priceToY(candle.high), bodyTop - 1.5);
        const wickLowY = Math.max(priceToY(candle.low), bodyBot + 1.5);

        // 1. Draw High-to-Low Wick
        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, wickHighY);
        ctx.lineTo(x, wickLowY);
        ctx.stroke();
        ctx.restore();

        // 2. Draw Solid Filled Candle Body
        ctx.save();
        ctx.fillStyle = fillColor;
        ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);

        // 3. Draw Crisp Outer Border on Body
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.0;
        ctx.strokeRect(x - candleW / 2, bodyTop, candleW, bodyH);

        // Subtle glow for the live working candle
        if (i === visible.length - 1) {
          ctx.shadowColor = strokeColor;
          ctx.shadowBlur = 8;
          ctx.strokeRect(x - candleW / 2, bodyTop, candleW, bodyH);
        }
        ctx.restore();
      });
    } else {
      // Area Line Chart
      ctx.save();
      ctx.strokeStyle = '#00e5a0';
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      visible.forEach((c, i) => {
        const x = (i + 1) * candleSpacing;
        const y = priceToY(c.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      const lastX = visible.length * candleSpacing;
      ctx.lineTo(lastX, h - bottomPadding);
      ctx.lineTo(candleSpacing, h - bottomPadding);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, topPadding, 0, h);
      grad.addColorStop(0, 'rgba(0, 229, 160, 0.28)');
      grad.addColorStop(1, 'rgba(0, 229, 160, 0)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }

    // ── 5. Live Working Candle Position & Pulsing Radar Beacon ──
    const liveIndex = visible.length;
    const liveX = liveIndex * candleSpacing;
    const liveY = priceToY(currentPrice);
    const isLiveUp = currentCandle && currentCandle.close >= currentCandle.open;
    const liveColor = isLiveUp ? '#00e5a0' : '#ff3b5c';

    ctx.save();

    // Horizontal dashed guideline from live candle to right price axis
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = liveColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(liveX, liveY);
    ctx.lineTo(chartW, liveY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Animated Pulsing Beacon Dot
    pulseRef.current = (pulseRef.current + 0.05) % (Math.PI * 2);
    const haloRadius = 4 + Math.sin(pulseRef.current) * 3;
    const haloAlpha = 0.5 - Math.sin(pulseRef.current) * 0.3;

    // Outer ripple
    ctx.fillStyle = isLiveUp 
      ? `rgba(0, 229, 160, ${Math.max(0, haloAlpha)})` 
      : `rgba(255, 59, 92, ${Math.max(0, haloAlpha)})`;
    ctx.beginPath();
    ctx.arc(liveX, liveY, haloRadius + 4, 0, Math.PI * 2);
    ctx.fill();

    // Core bright dot
    ctx.fillStyle = liveColor;
    ctx.beginPath();
    ctx.arc(liveX, liveY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // ── 6. Live Right-Axis Price Badge with Candle Countdown ──
    const tagH = 20;
    const tagW = 70;
    ctx.fillStyle = liveColor;
    ctx.fillRect(chartW + 1, liveY - tagH / 2, tagW, tagH);

    ctx.fillStyle = '#0a0e17';
    ctx.font = 'bold 9.5px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(currentPrice.toFixed(2), chartW + 4, liveY + 3.5);

    // Candle countdown pill adjacent to price badge
    const candleSec = String(candleRemainingSec || 5).padStart(2, '0');
    ctx.fillStyle = 'rgba(10, 14, 23, 0.85)';
    ctx.fillRect(chartW - 32, liveY - 8, 30, 16);
    ctx.strokeStyle = liveColor;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(chartW - 32, liveY - 8, 30, 16);

    ctx.fillStyle = liveColor;
    ctx.font = 'bold 8.5px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`00:${candleSec}`, chartW - 17, liveY + 3.5);

    ctx.restore();

    // ── 7. Active Trade Overlays ──
    activeTrades.forEach((trade) => {
      const isCall = trade.direction === 'CALL' || trade.direction === 'up';
      const entryPrice = trade.entryPrice;
      const entryY = priceToY(entryPrice);
      const isProfitable = isCall ? (currentPrice >= entryPrice) : (currentPrice <= entryPrice);
      const tradeColor = isProfitable ? '#00c087' : '#ff3b5c';

      ctx.save();

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#00c087';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(0, entryY);
      ctx.lineTo(chartW, entryY);
      ctx.stroke();
      ctx.setLineDash([]);

      const entryBadgeW = 68;
      const entryBadgeH = 18;
      ctx.fillStyle = isCall ? '#00c087' : '#ff3b5c';
      ctx.fillRect(chartW + 1, entryY - entryBadgeH / 2, entryBadgeW, entryBadgeH);

      ctx.fillStyle = '#0a0e17';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText((isCall ? 'BUY ' : 'SELL ') + entryPrice.toFixed(0), chartW + 4, entryY + 3.5);

      const entryX = liveX - candleSpacing;
      ctx.fillStyle = tradeColor;
      ctx.fillRect(entryX - 4, entryY - 4, 8, 8);

      const stemLen = 38;
      const targetY = isCall ? (entryY - stemLen) : (entryY + stemLen);
      ctx.strokeStyle = tradeColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(entryX, entryY);
      ctx.lineTo(entryX, targetY);
      ctx.stroke();

      const arrowSize = 6;
      ctx.fillStyle = tradeColor;
      ctx.beginPath();
      if (isCall) {
        ctx.moveTo(entryX, targetY - arrowSize * 1.5);
        ctx.lineTo(entryX - arrowSize, targetY);
        ctx.lineTo(entryX + arrowSize, targetY);
      } else {
        ctx.moveTo(entryX, targetY + arrowSize * 1.5);
        ctx.lineTo(entryX - arrowSize, targetY);
        ctx.lineTo(entryX + arrowSize, targetY);
      }
      ctx.closePath();
      ctx.fill();

      const mm = String(Math.floor(roundTimeRemaining / 60)).padStart(2, '0');
      const ss = String(roundTimeRemaining % 60).padStart(2, '0');
      const tagText = `$${Number(trade.amount).toFixed(2)} (${mm}:${ss})`;

      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      const textY = isCall ? (targetY - arrowSize * 1.5 - 6) : (targetY + arrowSize * 1.5 + 14);

      const textMetrics = ctx.measureText(tagText);
      const pillW = textMetrics.width + 10;
      const pillH = 18;
      ctx.fillStyle = 'rgba(10, 14, 23, 0.9)';
      ctx.fillRect(entryX - pillW / 2, textY - 13, pillW, pillH);
      ctx.strokeStyle = tradeColor;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(entryX - pillW / 2, textY - 13, pillW, pillH);

      ctx.fillStyle = tradeColor;
      ctx.fillText(tagText, entryX, textY);

      const pnlDir = isCall ? 1 : -1;
      const priceDiff = (currentPrice - entryPrice) * pnlDir;
      const pnlPercent = priceDiff / (entryPrice || 1);
      const pnlValue = pnlPercent * trade.amount * 1.85;
      const pnlIsPos = pnlValue >= 0;

      const pnlBadgeX = chartW - 142;
      const pnlBadgeY = topPadding - 22;
      ctx.fillStyle = pnlIsPos ? 'rgba(0, 229, 160, 0.15)' : 'rgba(255, 59, 92, 0.15)';
      ctx.strokeStyle = pnlIsPos ? 'rgba(0, 229, 160, 0.4)' : 'rgba(255, 59, 92, 0.4)';
      ctx.lineWidth = 1;
      ctx.fillRect(pnlBadgeX, pnlBadgeY, 136, 22);
      ctx.strokeRect(pnlBadgeX, pnlBadgeY, 136, 22);

      ctx.fillStyle = pnlIsPos ? '#00c087' : '#ff5252';
      ctx.font = 'bold 10.5px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      const pnlStr = (pnlIsPos ? '+' : '') + '$' + pnlValue.toFixed(2) + ' (' + (pnlPercent * 100).toFixed(2) + '%)';
      ctx.fillText(pnlStr, pnlBadgeX + 68, pnlBadgeY + 15);

      ctx.restore();
    });

    // ── 8. Interactive Crosshair ──
    if (crosshairPos && crosshairPos.x <= chartW && crosshairPos.y <= h - bottomPadding && crosshairPos.y >= topPadding) {
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 0.8;

      ctx.beginPath();
      ctx.moveTo(crosshairPos.x, topPadding);
      ctx.lineTo(crosshairPos.x, h - bottomPadding);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, crosshairPos.y);
      ctx.lineTo(chartW, crosshairPos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const hoverPrice = yToPrice(crosshairPos.y);
      ctx.fillStyle = '#1e2740';
      ctx.fillRect(chartW + 1, crosshairPos.y - 9, tagW, 18);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.strokeRect(chartW + 1, crosshairPos.y - 9, tagW, 18);

      ctx.fillStyle = '#ffffff';
      ctx.font = '9.5px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(hoverPrice.toFixed(2), chartW + 4, crosshairPos.y + 3.5);

      ctx.restore();
    }

    // ── 9. Volume Bars Canvas ──
    if (volCanvas) {
      const vctx = volCanvas.getContext('2d');
      vctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      vctx.clearRect(0, 0, w, 38);

      let maxVol = 1;
      visible.forEach(c => { if ((c.volume || 1) > maxVol) maxVol = c.volume; });

      visible.forEach((candle, i) => {
        const x = (i + 1) * candleSpacing;
        const isUp = candle.close >= candle.open;
        const vol = candle.volume || 10;
        const barH = (vol / maxVol) * 30;
        vctx.fillStyle = isUp ? 'rgba(8, 153, 129, 0.45)' : 'rgba(242, 54, 69, 0.45)';
        vctx.fillRect(x - candleW / 2, 38 - barH, candleW, barH);
      });
    }

  }, [candles, currentCandle, currentPrice, activeTrades, roundTimeRemaining, candleRemainingSec, chartType, showMA7, showEMA21, crosshairPos]);

  // Animation render loop
  useEffect(() => {
    let active = true;
    const renderLoop = () => {
      if (!active) return;
      drawChart();
      animFrameRef.current = requestAnimationFrame(renderLoop);
    };
    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [drawChart]);

  // Handle pointer interactions (Touch / Mouse)
  const handlePointerMove = (e) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCrosshairPos({ x, y });

    const allCandles = [...candles];
    if (currentCandle) allCandles.push(currentCandle);
    const maxVisibleCandles = Math.min(allCandles.length, 30);
    const visible = allCandles.slice(-maxVisibleCandles);
    const totalSlots = maxVisibleCandles + 3.5;
    const chartW = rect.width - 72;
    const candleSpacing = chartW / totalSlots;

    const candleIdx = Math.round(x / candleSpacing) - 1;
    if (candleIdx >= 0 && candleIdx < visible.length) {
      setHoverData(visible[candleIdx]);
    } else {
      setHoverData(null);
    }
  };

  const handlePointerLeave = () => {
    setCrosshairPos(null);
    setHoverData(null);
  };

  const activeCandle = hoverData || currentCandle || (candles.length > 0 ? candles[candles.length - 1] : null);
  const isUp = activeCandle && activeCandle.close >= activeCandle.open;

  return (
    <div
      ref={containerRef}
      className="chart-viewport-box"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        position: 'relative',
        width: '100%',
        flex: 1,
        minHeight: 270,
        background: '#0a0e17',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        touchAction: 'none'
      }}
    >
      {/* ── Top Pro OHLCV Live Data Bar ── */}
      <div style={{
        position: 'absolute',
        top: 6,
        left: 10,
        right: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 20,
        pointerEvents: 'none'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          fontSize: '0.72rem',
          fontFamily: 'JetBrains Mono, monospace',
          background: 'rgba(10, 14, 23, 0.75)',
          padding: '2px 8px',
          borderRadius: 4,
          backdropFilter: 'blur(4px)'
        }}>
          <span style={{ fontWeight: 800, color: '#fff' }}>{asset}</span>
          {activeCandle && (
            <>
              <span style={{ color: '#8a94a8' }}>O:<span style={{ color: isUp ? '#00e5a0' : '#ff5252' }}>{activeCandle.open?.toFixed(2)}</span></span>
              <span style={{ color: '#8a94a8' }}>H:<span style={{ color: isUp ? '#00e5a0' : '#ff5252' }}>{activeCandle.high?.toFixed(2)}</span></span>
              <span style={{ color: '#8a94a8' }}>L:<span style={{ color: isUp ? '#00e5a0' : '#ff5252' }}>{activeCandle.low?.toFixed(2)}</span></span>
              <span style={{ color: '#8a94a8' }}>C:<span style={{ color: isUp ? '#00e5a0' : '#ff5252' }}>{activeCandle.close?.toFixed(2)}</span></span>
            </>
          )}
        </div>

        {/* Indicator & View Toggles */}
        <div style={{ display: 'flex', gap: 4, pointerEvents: 'auto' }}>
          <button
            onClick={() => setChartType(prev => prev === 'candle' ? 'line' : 'candle')}
            style={{
              padding: '2px 7px',
              borderRadius: 4,
              background: 'rgba(21, 27, 43, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#8a94a8',
              fontSize: '0.68rem',
              fontWeight: 700
            }}
          >
            {chartType === 'candle' ? '🕯️' : '📈'}
          </button>
          <button
            onClick={() => setShowMA7(prev => !prev)}
            style={{
              padding: '2px 6px',
              borderRadius: 4,
              background: showMA7 ? 'rgba(240, 165, 0, 0.25)' : 'rgba(21, 27, 43, 0.85)',
              border: showMA7 ? '1px solid #f0a500' : '1px solid rgba(255, 255, 255, 0.1)',
              color: showMA7 ? '#f0a500' : '#8a94a8',
              fontSize: '0.68rem',
              fontWeight: 700
            }}
          >
            MA7
          </button>
          <button
            onClick={() => setShowEMA21(prev => !prev)}
            style={{
              padding: '2px 6px',
              borderRadius: 4,
              background: showEMA21 ? 'rgba(0, 180, 216, 0.25)' : 'rgba(21, 27, 43, 0.85)',
              border: showEMA21 ? '1px solid #00b4d8' : '1px solid rgba(255, 255, 255, 0.1)',
              color: showEMA21 ? '#00b4d8' : '#8a94a8',
              fontSize: '0.68rem',
              fontWeight: 700
            }}
          >
            EMA21
          </button>
        </div>
      </div>

      {/* Main Canvas for Candlesticks & Overlays */}
      <canvas ref={mainCanvasRef} style={{ display: 'block', flex: 1 }} />

      {/* Sub-canvas for Volume Bars */}
      <canvas ref={volumeCanvasRef} style={{ display: 'block', height: 38 }} />
    </div>
  );
}
