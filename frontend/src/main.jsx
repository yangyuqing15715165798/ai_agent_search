import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const MODELS = [
  { id: 'sensenova-6.7-flash-lite', label: 'SenseNova 6.7 Flash Lite', note: '当前默认' },
  { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', note: '快速分析' },
  { id: 'glm-5.2', label: 'GLM 5.2', note: '通用推理' },
  { id: 'sensenova-u1-fast', label: 'SenseNova U1 Fast', note: '轻量响应' },
];

const products = [
  { code: 'AC-001', name: '1.5匹 挂机 一级能效', category: '挂机', brand: '格力', price: 3599, stock: 120, level: 1 },
  { code: 'AC-002', name: '2匹 柜机 一级能效', category: '柜机', brand: '格力', price: 6999, stock: 55, level: 1 },
  { code: 'AC-003', name: '3匹 风管机 一级能效', category: '风管机', brand: '美的', price: 12800, stock: 30, level: 1 },
  { code: 'AC-004', name: '1.5匹 变频挂机', category: '挂机', brand: '海尔', price: 3299, stock: 86, level: 2 },
  { code: 'AC-005', name: '中央空调 多联机', category: '中央空调', brand: '日立', price: 25800, stock: 12, level: 2 },
];

const customers = [
  { id: 'C001', name: '张伟', tier: '钻石', consumption: 45000, city: '北京' },
  { id: 'C002', name: '王芳', tier: '金卡', consumption: 28000, city: '北京' },
  { id: 'C003', name: '李强', tier: '金卡', consumption: 32000, city: '上海' },
  { id: 'C004', name: '赵敏', tier: '银卡', consumption: 12000, city: '广州' },
  { id: 'C005', name: '刘洋', tier: '银卡', consumption: 9800, city: '深圳' },
];

const sales = [
  { month: '1月', value: 18 }, { month: '2月', value: 25 }, { month: '3月', value: 34 },
  { month: '4月', value: 29 }, { month: '5月', value: 42 }, { month: '6月', value: 51 },
  { month: '7月', value: 47 }, { month: '8月', value: 63 },
];

const activities = [
  { type: 'search', title: '网络搜索助手已就绪', detail: '可检索公开行业信息', time: '刚刚' },
  { type: 'db', title: '数据库连接正常', detail: '4 张业务表 · 46 条记录', time: '1 分钟前' },
  { type: 'service', title: '售后服务数据已同步', detail: '8 条服务记录', time: '5 分钟前' },
];

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    bot: <><rect x="4" y="7" width="16" height="13" rx="3" /><path d="M12 3v4M8 13h.01M16 13h.01M9 17h6" /><path d="M2 12h2M20 12h2" /></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" /></>,
    box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c.4-3.2 2.4-5 6-5s5.6 1.8 6 5M17 11a3 3 0 1 0-1-5.8M17 15c2.8.2 4.3 1.8 4.7 4" /></>,
    service: <><path d="m14.7 6.3 3-3a4 4 0 0 1 0 5.7l-2 2-4.7-4.7 2-2a4 4 0 0 1 5.7 0" /><path d="m11 9-7 7a2.1 2.1 0 1 0 3 3l7-7M8 12l4 4" /></>,
    send: <><path d="m21 3-7.6 18-3.4-7-7-3.4L21 3Z" /><path d="M21 3 10 14" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    trend: <><path d="m3 17 6-6 4 4 8-9" /><path d="M15 6h6v6" /></>,
    pulse: <><path d="M3 12h4l2-6 4 12 2-6h6" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function formatMoney(value) {
  return `¥${value.toLocaleString('zh-CN')}`;
}

function App() {
  const [active, setActive] = useState('overview');
  const [query, setQuery] = useState('');
  const [task, setTask] = useState('');
  const [model, setModel] = useState(MODELS[0].id);
  const [threadId, setThreadId] = useState(null);
  const [events, setEvents] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [taskState, setTaskState] = useState('idle');

  useEffect(() => {
    if (!threadId) return undefined;
    const socket = new WebSocket(`${API_BASE.replace(/^http/, 'ws')}/ws/${threadId}`);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const localTime = new Date().toLocaleTimeString();
        setEvents((current) => [...current, { ...payload, localTime }].slice(-30));
        if (payload.event === 'dataset_ready') {
          setDatasets((current) => current.some((item) => item.event_id === payload.event_id)
            ? current
            : [...current, { ...payload, localTime }].slice(-10));
        }
        if (payload.status === 'success' || payload.event === 'task_result') setTaskState('done');
        if (payload.status === 'error' || payload.event === 'task_failed' || payload.event === 'error') setTaskState('error');
      } catch { /* Ignore non-JSON heartbeat payloads. */ }
    };
    return () => socket.close();
  }, [threadId]);

  const filteredProducts = useMemo(() => products.filter((item) => `${item.name}${item.code}${item.brand}`.includes(query)), [query]);

  async function submitTask(event, selectedModel = model) {
    event.preventDefault();
    if (!task.trim() || taskState === 'running') return;
    setTaskState('running');
    setEvents([]);
    setDatasets([]);
    try {
      const response = await fetch(`${API_BASE}/api/task`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: task, model: selectedModel }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || '任务提交失败');
      setThreadId(data.thread_id);
    } catch (error) {
      setTaskState('error');
      setEvents([{ event: 'task_failed', stage: 'task', status: 'error', message: error.message, localTime: new Date().toLocaleTimeString() }]);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><span>DS</span></div><div><strong>Deep Search</strong><small>业务智能工作台</small></div></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list" aria-label="主导航">
          {[['overview', 'grid', '总览'], ['agent', 'bot', 'Agent 任务'], ['data', 'database', '业务数据'], ['products', 'box', '商品库存'], ['customers', 'users', '客户档案'], ['service', 'service', '售后服务']].map(([key, icon, label]) => (
            <button className={`nav-item ${active === key ? 'active' : ''}`} key={key} onClick={() => setActive(key)}><Icon name={icon} /><span>{label}</span>{key === 'agent' && <em>AI</em>}</button>
          ))}
        </nav>
        <div className="sidebar-footer"><div className="connection"><span className="status-dot" /> <span>数据连接正常</span><span className="connection-ping">46 条</span></div><div className="user-row"><div className="avatar">YQ</div><div><strong>业务管理员</strong><small>本地工作区</small></div><span className="more">···</span></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div><span className="eyebrow">MONDAY · 2026 / 08 / 06</span><h1>{active === 'overview' ? '业务总览' : active === 'agent' ? 'Agent 任务' : '业务数据'}</h1></div><div className="top-actions"><button className="icon-button" aria-label="查看系统状态"><Icon name="pulse" /></button><div className="top-avatar">YQ</div></div></header>
        {active === 'overview' && <Overview onOpenAgent={() => setActive('agent')} />}
         {active === 'agent' && <AgentPanel task={task} setTask={setTask} model={model} setModel={setModel} submitTask={submitTask} taskState={taskState} events={events} datasets={datasets} />}
        {active === 'data' && <DataPanel />}
        {active === 'products' && <ProductPanel query={query} setQuery={setQuery} products={filteredProducts} />}
        {active === 'customers' && <CustomerPanel />}
        {active === 'service' && <ServicePanel />}
      </main>
    </div>
  );
}

function Overview({ onOpenAgent }) {
  return <>
    <section className="welcome-row"><div><p className="section-kicker">OPERATIONS / OVERVIEW</p><h2>让每一次业务判断，<span>都有数据依据。</span></h2><p className="muted intro">连接商品、销售、客户与服务数据，用一个工作台理解空调业务现场。</p></div><button className="primary-button" onClick={onOpenAgent}><Icon name="bot" size={17} />开始一次智能分析 <Icon name="arrow" size={16} /></button></section>
    <section className="metric-grid" aria-label="关键业务指标">
      <Metric label="本月销售额" value="¥186,420" delta="较上月 +18.4%" icon="trend" accent="orange" />
      <Metric label="在售商品" value="10" delta="4 个品类 · 3 个品牌" icon="box" accent="blue" />
      <Metric label="活跃客户" value="8" delta="钻石客户 1 位" icon="users" accent="green" />
      <Metric label="待处理服务" value="2" delta="本周新增 3 条" icon="service" accent="red" />
    </section>
    <section className="dashboard-grid">
      <div className="panel sales-panel"><div className="panel-head"><div><p className="panel-label">SALES PERFORMANCE</p><h3>销售趋势</h3></div><span className="select-like">2025 年 <span>⌄</span></span></div><div className="chart-wrap"><div className="axis"><span>70k</span><span>50k</span><span>30k</span><span>10k</span></div><div className="chart"><div className="grid-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 680 220" preserveAspectRatio="none" role="img" aria-label="销售趋势折线图"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f49b4e" stopOpacity=".28" /><stop offset="1" stopColor="#f49b4e" stopOpacity="0" /></linearGradient></defs><path d="M0 190 L85 162 L170 145 L255 158 L340 120 L425 94 L510 107 L595 48 L680 62 L680 220 L0 220Z" fill="url(#fill)" /><path d="M0 190 L85 162 L170 145 L255 158 L340 120 L425 94 L510 107 L595 48 L680 62" fill="none" stroke="#f49b4e" strokeWidth="3" vectorEffect="non-scaling-stroke" /><circle cx="595" cy="48" r="5" fill="#f49b4e" /></svg><div className="months">{sales.map((item) => <span key={item.month}>{item.month}</span>)}</div></div></div><div className="chart-callout"><span className="callout-dot" /> <strong>¥63,000</strong><span>8 月销售额达到今年峰值</span></div></div>
      <div className="panel insight-panel"><div className="panel-head"><div><p className="panel-label">QUICK INSIGHTS</p><h3>业务洞察</h3></div><button className="text-button" onClick={onOpenAgent}>查看 Agent <Icon name="arrow" size={14} /></button></div><div className="insight-list"><Insight icon="trend" title="高能效产品正在增长" text="一级能效商品贡献了本月 62% 的销售额。" tag="商品" /><Insight icon="users" title="北京客户贡献最高" text="北京区域销售额占比 41%，值得持续运营。" tag="区域" /><Insight icon="service" title="售后响应保持稳定" text="8 条服务记录中，已完成 6 条。" tag="服务" /></div></div>
    </section>
    <section className="bottom-grid"><div className="panel table-panel"><div className="panel-head"><div><p className="panel-label">INVENTORY WATCH</p><h3>库存关注</h3></div><button className="text-button">查看全部 <Icon name="arrow" size={14} /></button></div><div className="inventory-list">{products.slice(0, 4).map((item) => <div className="inventory-row" key={item.code}><div className="product-icon">{item.category === '挂机' ? '壁' : item.category === '柜机' ? '柜' : '中'}</div><div className="product-copy"><strong>{item.name}</strong><small>{item.brand} · {item.code}</small></div><div className="stock"><span className={item.stock < 20 ? 'low' : ''}>{item.stock}</span><small>件库存</small></div><div className="stock-bar"><i style={{ width: `${Math.min(item.stock / 1.2, 100)}%` }} /></div></div>)}</div></div><div className="panel activity-panel"><div className="panel-head"><div><p className="panel-label">SYSTEM ACTIVITY</p><h3>最近动态</h3></div><span className="live-label"><i /> LIVE</span></div>{activities.map((item) => <div className="activity-row" key={item.title}><div className={`activity-icon ${item.type}`}><Icon name={item.type === 'db' ? 'database' : item.type === 'service' ? 'service' : 'bot'} size={15} /></div><div><strong>{item.title}</strong><small>{item.detail}</small></div><time>{item.time}</time></div>)}</div></section>
  </>;
}

function Metric({ label, value, delta, icon, accent }) { return <div className="metric"><div className={`metric-icon ${accent}`}><Icon name={icon} /></div><div><span>{label}</span><strong>{value}</strong><small className={accent === 'red' ? 'warn' : ''}>{delta}</small></div></div>; }
function Insight({ icon, title, text, tag }) { return <div className="insight"><div className="insight-icon"><Icon name={icon} size={16} /></div><div><strong>{title}</strong><p>{text}</p></div><span className="tag">{tag}</span></div>; }

function eventLabel(event) {
  return { task_started: '任务开始', session_created: '工作目录已准备', assistant_call: '调用子智能体', tool_start: '调用工具', tool_result: '工具完成', dataset_ready: '数据已准备', task_result: '生成最终答案', task_failed: '任务失败' }[event] || event;
}

function formatDuration(milliseconds) {
  if (!Number.isFinite(milliseconds)) return '';
  return milliseconds < 1000 ? `${milliseconds} ms` : `${(milliseconds / 1000).toFixed(1)} s`;
}

function DatasetBlock({ dataset, receivedAt }) {
  const columns = dataset?.columns || [];
  const rows = dataset?.rows || [];
  const chart = dataset?.chart || {};
  const xIndex = Math.max(columns.indexOf(chart.xField), 0);
  const yIndex = Math.max(columns.indexOf(chart.yFields?.[0]), 0);
  const chartRows = rows.slice(0, 12).map((row) => ({
    label: String(row[xIndex] ?? ''),
    value: Number(row[yIndex]),
  })).filter((row) => Number.isFinite(row.value));
  const maxValue = Math.max(...chartRows.map((row) => row.value), 0);
  const width = 720;
  const height = 250;
  const left = 48;
  const bottom = 42;
  const innerWidth = width - left - 20;
  const innerHeight = height - bottom - 18;
  const step = chartRows.length ? innerWidth / chartRows.length : innerWidth;
  const valueY = (value) => 18 + innerHeight - (maxValue ? (value / maxValue) * innerHeight : 0);
  const linePoints = chartRows.map((row, index) => `${left + step * (index + .5)},${valueY(row.value)}`).join(' ');

  return <div className="dataset-block">
    <div className="dataset-head"><div><p className="panel-label">DATASET / {dataset.source}</p><h4>{chart.title || '查询结果可视化'}</h4></div><span>{receivedAt} · {dataset.row_count ?? rows.length} 条记录</span></div>
    {chartRows.length > 0 ? <svg className="dataset-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={chart.title || '查询结果图表'}>
      <line x1={left} y1={18 + innerHeight} x2={width - 20} y2={18 + innerHeight} stroke="#dfe6e9" />
      {chart.type === 'line' ? <><polyline points={linePoints} fill="none" stroke="#e4873d" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />{chartRows.map((row, index) => <circle key={`${row.label}-${index}`} cx={left + step * (index + .5)} cy={valueY(row.value)} r="4" fill="#e4873d" />)}</> : chartRows.map((row, index) => { const barWidth = Math.min(step * .56, 42); const x = left + step * index + (step - barWidth) / 2; const y = valueY(row.value); return <rect key={`${row.label}-${index}`} x={x} y={y} width={barWidth} height={18 + innerHeight - y} rx="3" fill="#e4873d" />; })}
      {chartRows.map((row, index) => <text key={`label-${row.label}-${index}`} x={left + step * (index + .5)} y={height - 14} textAnchor="middle" fill="#87939c" fontSize="11">{row.label.length > 10 ? `${row.label.slice(0, 10)}…` : row.label}</text>)}
    </svg> : <div className="dataset-empty">当前结果没有可绘制的数值列，将以表格展示。</div>}
    <div className="dataset-table-wrap"><table className="dataset-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.slice(0, 8).map((row, rowIndex) => <tr key={rowIndex}>{columns.map((column, columnIndex) => <td key={`${rowIndex}-${column}`}>{String(row[columnIndex] ?? '')}</td>)}</tr>)}</tbody></table></div>
  </div>;
}

function AgentPanel({ task, setTask, model, setModel, submitTask, taskState, events, datasets }) {
  const result = events.find((event) => event.event === 'task_result')?.data?.result;
  return <section className="agent-page"><div className="agent-hero"><div><p className="section-kicker">MULTI-AGENT WORKSPACE</p><h2>把复杂问题，交给你的智能团队。</h2><p className="muted">网络搜索、数据库查询、知识库检索，统一在一次任务中协作完成。</p></div><div className="agent-orbit"><span className="orbit-core"><Icon name="bot" size={28} /></span><i className="orbit-dot one" /><i className="orbit-dot two" /><i className="orbit-dot three" /></div></div><form className="task-composer" onSubmit={(event) => submitTask(event, model)}><div className="composer-label-row"><label htmlFor="task-input">告诉 Agent 你要了解什么</label><label className="model-picker" htmlFor="model-select"><span>使用模型</span><select id="model-select" value={model} onChange={(event) => setModel(event.target.value)}>{MODELS.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.note}</option>)}</select></label></div><textarea id="task-input" value={task} onChange={(e) => setTask(e.target.value)} placeholder="例如：分析今年各区域空调销售表现，并给出库存和客户运营建议" /><div className="composer-footer"><div className="agent-capabilities"><span><i />网络搜索</span><span><i />数据库</span><span><i />知识库</span></div><button className="primary-button" disabled={taskState === 'running'}>{taskState === 'running' ? '任务执行中…' : '提交分析'} <Icon name="send" size={16} /></button></div></form>{datasets.map((item) => <DatasetBlock key={item.event_id} dataset={item.data} receivedAt={item.localTime} />)}<div className="agent-status panel"><div className="panel-head"><div><p className="panel-label">LIVE TRACE</p><h3>执行轨迹</h3></div><span className={`run-status ${taskState}`}>{taskState === 'running' ? '运行中' : taskState === 'done' ? '已完成' : taskState === 'error' ? '出现错误' : '等待任务'}</span></div>{result && <div className="result-block"><p className="panel-label">RESULT</p><div className="result-content">{result}</div></div>}{events.length === 0 ? <div className="empty-state"><Icon name="pulse" size={26} /><p>提交任务后，这里会实时显示 Agent 的协作进度。</p></div> : <div className="event-list" aria-live="polite">{events.map((event, index) => <div className={`event-row ${event.status || 'info'}`} key={event.event_id || `${event.localTime}-${index}`}><span className="event-line" /><div><strong>{event.message || event.event}</strong><small>{eventLabel(event.event)} · {event.localTime}{event.data?.duration_ms != null ? ` · ${formatDuration(event.data.duration_ms)}` : ''}</small></div></div>)}</div>}</div></section>;
}

function DataPanel() { return <section className="data-page"><div className="page-intro"><p className="section-kicker">DATA CATALOG</p><h2>业务数据目录</h2><p className="muted">已连接到本地 MySQL 数据库，当前共 46 条业务记录。</p></div><div className="catalog-grid">{[['customers', '客户档案', '客户等级、消费与注册信息', '8 条', 'users'], ['products', '商品库存', '价格、能效、库存与品牌', '10 条', 'box'], ['sales', '销售订单', '区域、金额、状态与日期', '20 条', 'trend'], ['service_records', '售后服务', '安装、保养与维修记录', '8 条', 'service']].map(([table, title, text, count, icon]) => <div className="catalog-row" key={table}><div className="catalog-icon"><Icon name={icon} /></div><div><strong>{title}</strong><small>{text}</small></div><span>{count}</span><button aria-label={`查看${title}`}><Icon name="arrow" size={16} /></button></div>)}</div><div className="data-note"><Icon name="database" /><div><strong>自然语言查询</strong><p>直接前往 Agent 任务，让智能团队帮你查询、联结并解释这些数据。</p></div></div></section>; }
function ProductPanel({ query, setQuery, products: items }) { return <section className="table-page"><div className="page-intro"><p className="section-kicker">PRODUCT CATALOG</p><h2>商品库存</h2><p className="muted">共 10 个商品，重点关注库存和能效结构。</p></div><div className="toolbar"><div className="search-field"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索商品、品牌或编码" /></div><span className="result-count">显示 {items.length} 条</span></div><div className="panel clean-table"><table><thead><tr><th>商品</th><th>品类</th><th>品牌</th><th>售价</th><th>库存</th><th>能效</th></tr></thead><tbody>{items.map((item) => <tr key={item.code}><td><strong>{item.name}</strong><small>{item.code}</small></td><td>{item.category}</td><td>{item.brand}</td><td>{formatMoney(item.price)}</td><td><span className={item.stock < 20 ? 'stock-number low' : 'stock-number'}>{item.stock} 件</span></td><td><span className="energy">一级</span></td></tr>)}</tbody></table></div></section>; }
function CustomerPanel() { return <section className="table-page"><div className="page-intro"><p className="section-kicker">CUSTOMER RELATIONSHIP</p><h2>客户档案</h2><p className="muted">重点客户消费概览，数据来自 customers 表。</p></div><div className="panel clean-table"><table><thead><tr><th>客户</th><th>等级</th><th>所在城市</th><th>累计消费</th><th>关系状态</th></tr></thead><tbody>{customers.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small>{item.id}</small></td><td><span className={`tier ${item.tier}`}>{item.tier}</span></td><td>{item.city}</td><td>{formatMoney(item.consumption)}</td><td><span className="status-good">活跃</span></td></tr>)}</tbody></table></div></section>; }
function ServicePanel() { return <section className="table-page"><div className="page-intro"><p className="section-kicker">SERVICE OPERATIONS</p><h2>售后服务</h2><p className="muted">安装、保养、维修记录统一查看。</p></div><div className="service-summary"><div><span>服务记录</span><strong>8</strong></div><div><span>已完成</span><strong>6</strong></div><div><span>处理中</span><strong className="orange-text">2</strong></div></div><div className="panel clean-table"><table><thead><tr><th>服务单号</th><th>客户</th><th>服务类型</th><th>服务日期</th><th>状态</th></tr></thead><tbody>{[['SR-2025001', 'C001', '安装', '2025-01-03', '已完成'], ['SR-2025002', 'C001', '安装', '2025-01-18', '已完成'], ['SR-2025003', 'C003', '保养', '2025-06-01', '已完成'], ['SR-2025004', 'C004', '维修', '2025-06-18', '处理中']].map((item) => <tr key={item[0]}><td><strong>{item[0]}</strong></td><td>{item[1]}</td><td>{item[2]}</td><td>{item[3]}</td><td><span className={item[4] === '已完成' ? 'status-good' : 'status-pending'}>{item[4]}</span></td></tr>)}</tbody></table></div></section>; }

createRoot(document.getElementById('root')).render(<App />);
