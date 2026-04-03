'use client';
import { useState, useEffect } from 'react';

const MONTHS = ['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'];
const DAYS = ['söndag','måndag','tisdag','onsdag','torsdag','fredag','lördag'];

export default function Home() {
  const [tab, setTab] = useState('newsletter');
  const [prices, setPrices] = useState([]);
  const [fetchStatus, setFetchStatus] = useState('idle');
  const [genStatus, setGenStatus] = useState('idle');
  const [analysisStatus, setAnalysisStatus] = useState('idle');
  const [newsletter, setNewsletter] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [today, setToday] = useState('');

  useEffect(() => {
    const d = new Date();
    setToday(`${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
  }, []);

  async function fetchPrices() {
    setFetchStatus('loading');
    setError('');
    try {
      const res = await fetch('/api/prices');
      const data = await res.json();
      setPrices(data);
      setFetchStatus('done');
    } catch (e) {
      setError('Kunde inte hämta kurser: ' + e.message);
      setFetchStatus('error');
    }
  }

  async function generateNewsletter() {
    setGenStatus('loading');
    setNewsletter('');
    setError('');
    try {
      const d = new Date();
      const date = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceData: prices, date }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNewsletter(data.newsletter);
      setGenStatus('done');
    } catch (e) {
      setError('Kunde inte generera brev: ' + e.message);
      setGenStatus('error');
    }
  }

  async function generateAnalysis() {
    setAnalysisStatus('loading');
    setAnalysis('');
    setError('');
    try {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceData: prices }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data.html);
      setAnalysisStatus('done');
    } catch (e) {
      setError('Kunde inte generera analys: ' + e.message);
      setAnalysisStatus('error');
    }
  }

  function copyNewsletter() {
    navigator.clipboard.writeText(newsletter).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function openAnalysis() {
    const win = window.open('', '_blank');
    win.document.write(analysis);
    win.document.close();
  }

  const upCount = prices.filter(h => h.change > 0).length;
  const flatCount = prices.filter(h => h.change === 0).length;
  const downCount = prices.filter(h => h.change < 0).length;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h1 style={s.title}>📬 Portföljverktyg</h1>
        <p style={s.subtitle}>Jesper Larsson · Buy & Hold 20–30 år</p>
        {today && <p style={s.dateStrip}>{today}</p>}
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button style={{...s.tab, ...(tab==='newsletter'?s.tabActive:{})}} onClick={()=>setTab('newsletter')}>
          📰 Nyhetsbrev
        </button>
        <button style={{...s.tab, ...(tab==='analysis'?s.tabActive:{})}} onClick={()=>setTab('analysis')}>
          🔍 Djupanalys
        </button>
      </div>

      {/* Portfolio card - always visible */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>📊 Portföljinnehav</h2>
          <span style={{...s.badge,...(fetchStatus==='done'?s.badgeGreen:fetchStatus==='loading'?s.badgeGold:fetchStatus==='error'?s.badgeRed:s.badgeGray)}}>
            {fetchStatus==='idle'&&'Ej hämtat'}
            {fetchStatus==='loading'&&'⏳ Hämtar...'}
            {fetchStatus==='done'&&`✓ ${prices.filter(p=>p.price).length}/${prices.length} ok`}
            {fetchStatus==='error'&&'✗ Fel'}
          </span>
        </div>

        {fetchStatus==='done'&&prices.length>0&&(
          <div style={s.summaryRow}>
            <div style={s.chip}><div style={s.chipLabel}>Upp</div><div style={{...s.chipValue,color:'#4caf82'}}>{upCount}</div></div>
            <div style={s.chip}><div style={s.chipLabel}>Flat</div><div style={s.chipValue}>{flatCount}</div></div>
            <div style={s.chip}><div style={s.chipLabel}>Ned</div><div style={{...s.chipValue,color:'#e05a5a'}}>{downCount}</div></div>
          </div>
        )}

        <div style={s.grid}>
          {(prices.length>0?prices:Array(26).fill(null)).map((h,i)=>{
            if(!h) return <div key={i} style={s.row}><div style={{...s.rowName,color:'#444'}}>—</div><div style={{...s.rowPrice,color:'#444'}}>—</div><div style={{...s.rowChange,color:'#444'}}>—</div></div>;
            const changeColor=h.change>0?'#4caf82':h.change<0?'#e05a5a':'#888';
            const arrow=h.change>0?'▲':h.change<0?'▼':'—';
            return(
              <div key={h.ticker} style={s.row}>
                <div><div style={s.rowName}>{h.name}</div><div style={s.rowWeight}>{h.weight}%</div></div>
                <div style={s.rowPrice}>{h.price?`${h.price.toFixed(2)} ${h.currency}`:'~'}</div>
                <div style={{...s.rowChange,color:changeColor}}>{h.change!==null?`${arrow} ${Math.abs(h.change).toFixed(2)}%`:'~'}</div>
              </div>
            );
          })}
        </div>

        <button style={s.btnPrimary} onClick={fetchPrices} disabled={fetchStatus==='loading'}>
          {fetchStatus==='loading'?'⏳ Hämtar kurser...':'🔄 Hämta kurser'}
        </button>
      </div>

      {/* Newsletter tab */}
      {tab==='newsletter'&&(
        <div style={s.card}>
          <h2 style={s.cardTitle}>📰 Kvällsbrev</h2>
          <button
            style={{...s.btnPrimary,...(fetchStatus!=='done'||genStatus==='loading'?s.btnDisabled:{})}}
            onClick={generateNewsletter}
            disabled={fetchStatus!=='done'||genStatus==='loading'}
          >
            {genStatus==='loading'?'✨ Genererar brev (1–2 min)...':'✨ Generera nyhetsbrev'}
          </button>
          {error&&<div style={s.errorBox}>{error}</div>}
          {newsletter&&(
            <>
              <div style={s.divider}/>
              <div style={s.newsletterHeader}>
                <span style={s.cardTitle}>Brevet</span>
                <button style={s.copyBtn} onClick={copyNewsletter}>{copied?'✓ Kopierat!':'📋 Kopiera'}</button>
              </div>
              <pre style={s.newsletterBox}>{newsletter}</pre>
            </>
          )}
        </div>
      )}

      {/* Deep analysis tab */}
      {tab==='analysis'&&(
        <div style={s.card}>
          <h2 style={s.cardTitle}>🔍 Djupanalys</h2>
          <p style={{color:'#888',fontSize:'0.82rem',marginBottom:14,lineHeight:1.6}}>
            En professionell portföljanalys med betyg, heatmaps, scenarioanalys och 30-årsprojektion. Tar 2–3 minuter.
          </p>
          <button
            style={{...s.btnPrimary,...(fetchStatus!=='done'||analysisStatus==='loading'?s.btnDisabled:{})}}
            onClick={generateAnalysis}
            disabled={fetchStatus!=='done'||analysisStatus==='loading'}
          >
            {analysisStatus==='loading'?'🔍 Analyserar portföljen (2–3 min)...':'🔍 Generera djupanalys'}
          </button>
          {error&&<div style={s.errorBox}>{error}</div>}
          {analysisStatus==='done'&&analysis&&(
            <>
              <div style={s.divider}/>
              <p style={{color:'#4caf82',fontSize:'0.82rem',marginBottom:12}}>✓ Analysen är klar!</p>
              <button style={s.btnPrimary} onClick={openAnalysis}>
                📊 Öppna interaktiv rapport
              </button>
            </>
          )}
        </div>
      )}

      <p style={s.footnote}>Kurser via Yahoo Finance · AI via Claude Sonnet</p>
    </div>
  );
}

const s = {
  container:{background:'#0f0f0f',minHeight:'100vh',padding:'24px 16px 60px',fontFamily:"'DM Sans',-apple-system,sans-serif",color:'#e8e4dc'},
  header:{textAlign:'center',marginBottom:24},
  title:{fontFamily:'Georgia,serif',fontSize:'1.8rem',color:'#c9a84c',marginBottom:4},
  subtitle:{color:'#888',fontSize:'0.82rem',fontWeight:300},
  dateStrip:{color:'#555',fontSize:'0.72rem',marginTop:6,textTransform:'uppercase',letterSpacing:'0.08em'},
  tabs:{display:'flex',gap:8,marginBottom:16},
  tab:{flex:1,padding:'10px 0',border:'1px solid #2a2a2a',borderRadius:10,background:'#181818',color:'#888',fontSize:'0.82rem',cursor:'pointer',fontFamily:'inherit'},
  tabActive:{borderColor:'#c9a84c',color:'#c9a84c',background:'rgba(201,168,76,0.08)'},
  card:{background:'#181818',border:'1px solid #2a2a2a',borderRadius:12,padding:20,marginBottom:16},
  cardHeader:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14},
  cardTitle:{fontFamily:'Georgia,serif',fontSize:'1rem',color:'#c9a84c',margin:0,marginBottom:14},
  badge:{fontSize:'0.72rem',padding:'3px 10px',borderRadius:20,border:'1px solid'},
  badgeGreen:{borderColor:'#4caf82',color:'#4caf82'},
  badgeGold:{borderColor:'#c9a84c',color:'#c9a84c'},
  badgeRed:{borderColor:'#e05a5a',color:'#e05a5a'},
  badgeGray:{borderColor:'#444',color:'#888'},
  summaryRow:{display:'flex',gap:10,marginBottom:14},
  chip:{flex:1,background:'#222',borderRadius:8,padding:'10px 12px',textAlign:'center'},
  chipLabel:{fontSize:'0.68rem',color:'#888',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4},
  chipValue:{fontSize:'1.1rem',fontWeight:600,fontFamily:'Georgia,serif',color:'#e8e4dc'},
  grid:{display:'flex',flexDirection:'column',gap:6,marginBottom:14},
  row:{display:'grid',gridTemplateColumns:'1fr auto auto',gap:8,alignItems:'center',padding:'10px 12px',background:'#222',borderRadius:8},
  rowName:{fontSize:'0.82rem',fontWeight:500,color:'#e8e4dc'},
  rowWeight:{fontSize:'0.72rem',color:'#888'},
  rowPrice:{fontSize:'0.8rem',color:'#e8e4dc',textAlign:'right',minWidth:90},
  rowChange:{fontSize:'0.8rem',fontWeight:500,textAlign:'right',minWidth:65},
  btnPrimary:{width:'100%',padding:14,border:'none',borderRadius:12,fontFamily:'inherit',fontSize:'0.92rem',fontWeight:500,cursor:'pointer',background:'linear-gradient(135deg,#c9a84c,#e8cc7a)',color:'#1a1400',marginBottom:10,transition:'opacity 0.2s'},
  btnDisabled:{background:'#2a2a2a',color:'#555',cursor:'not-allowed'},
  errorBox:{background:'rgba(224,90,90,0.1)',border:'1px solid rgba(224,90,90,0.3)',borderRadius:8,padding:'10px 14px',fontSize:'0.8rem',color:'#e05a5a',marginTop:8},
  divider:{height:1,background:'#2a2a2a',margin:'16px 0'},
  newsletterHeader:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10},
  copyBtn:{fontSize:'0.78rem',color:'#c9a84c',background:'none',border:'1px solid #c9a84c',borderRadius:6,padding:'5px 12px',cursor:'pointer'},
  newsletterBox:{whiteSpace:'pre-wrap',fontSize:'0.82rem',lineHeight:1.75,color:'#e8e4dc',background:'#222',borderRadius:8,padding:16,maxHeight:600,overflowY:'auto',border:'1px solid #2a2a2a',fontFamily:'inherit'},
  footnote:{textAlign:'center',fontSize:'0.7rem',color:'#444',marginTop:24},
};
