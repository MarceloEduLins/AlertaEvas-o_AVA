import { api } from './api.js';
import { state } from './state.js';

const view = document.querySelector('#view');
const nav = document.querySelector('#nav');
const classSelect = document.querySelector('#classSelect');
const pageTitle = document.querySelector('#pageTitle');
const pageSubtitle = document.querySelector('#pageSubtitle');
const toast = document.querySelector('#toast');
const versionPill = document.querySelector('#versionPill');

const levelLabel = { high:'Alta', mid:'Moderada', low:'Baixa' };
const alertLabel = { normal:'Normal', reminder:'Lembrete', observe:'Observar', attention:'Atenção', critical:'Crítico' };

function esc(value='') { return String(value).replace(/[&<>'"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c])); }
function showToast(message) { toast.textContent=message; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),2400); }
function setPage(title,subtitle){ pageTitle.textContent=title; pageSubtitle.textContent=subtitle; document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view)); }
function riskBadge(level){ return `<span class="risk ${level}">${levelLabel[level]||level}</span>`; }
function alertBadge(level){ return `<span class="signal ${level}">${alertLabel[level]||level}</span>`; }
function metricCard(label,value,hint=''){ return `<div class="card metric"><span>${esc(label)}</span><b>${esc(value)}</b><small>${esc(hint)}</small></div>`; }
function formatDate(value){ if(!value) return '—'; const [y,m,d]=String(value).split('-').map(Number); return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,d))); }
function formatShortDate(value){ if(!value) return '—'; const [y,m,d]=String(value).split('-').map(Number); return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,d))); }
function subjectMap(){ return Object.fromEntries((state.simulation?.subjects||[]).map(s=>[s.id,s])); }
function shortSubject(name){ return name.replace('Experiência Criativa: Navegando na Computação','Experiência Criativa').replace('Descoberta e Evolução da Computação','Descoberta da Computação').replace('Modelagem de Fenômenos Físicos','Modelagem Física').replace('Leitura e Escrita Acadêmica','Leitura e Escrita'); }

function dateProgress(sim){
  const start=new Date(`${sim.startDate}T12:00:00Z`).getTime();
  const end=new Date(`${sim.endDate}T12:00:00Z`).getTime();
  const current=new Date(`${sim.currentDate}T12:00:00Z`).getTime();
  return Math.max(0,Math.min(100,((current-start)/(end-start))*100));
}
function clusterPalette(id){ return ['#315ed1','#16a085','#e49a2f','#c84b5a','#7b61c9'][Number(id)%5]; }
function scatterSvg(result){
  const points=result.projection||[]; if(!points.length) return '<div class="empty-block">Sem pontos suficientes para a projeção.</div>';
  const width=760,height=360,pad=38;
  const xs=points.map(p=>Number(p.x)),ys=points.map(p=>Number(p.y));
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const sx=x=>pad+((x-minX)/(maxX-minX||1))*(width-pad*2);
  const sy=y=>height-pad-((y-minY)/(maxY-minY||1))*(height-pad*2);
  const dots=points.map(p=>`<g class="scatter-dot" data-open-student="${p.studentId}"><circle cx="${sx(Number(p.x)).toFixed(1)}" cy="${sy(Number(p.y)).toFixed(1)}" r="7" fill="${clusterPalette(p.clusterId)}"><title>${esc(p.name)} • Cluster ${p.clusterId+1}</title></circle></g>`).join('');
  return `<div class="scatter-wrap"><svg class="scatter-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Projeção PCA dos alunos agrupados pelo K-Means"><line x1="${pad}" y1="${height/2}" x2="${width-pad}" y2="${height/2}"/><line x1="${width/2}" y1="${pad}" x2="${width/2}" y2="${height-pad}"/>${dots}</svg></div>`;
}
function clusterSizeChart(result){
  const max=Math.max(1,...(result.clusters||[]).map(c=>c.size));
  return `<div class="cluster-size-chart">${(result.clusters||[]).map(c=>`<div class="cluster-size-row"><span>${esc(c.name)}</span><div><i style="width:${Math.round(c.size/max*100)}%;background:${clusterPalette(c.id)}"></i></div><b>${c.size}</b></div>`).join('')}</div>`;
}
function clusterProfileChart(result){
  const metrics=[['avgAttendance','Presença',100],['avgGrade','Média',10],['avgInactiveDays','Dias sem AVA',20],['pendingActivities','Pendências',10],['avgExamGrade','Provas',10],['avgProjectGrade','Projetos',10]];
  return `<div class="profile-chart">${(result.clusters||[]).map(c=>`<article><header><i style="background:${clusterPalette(c.id)}"></i><b>${esc(c.name)}</b></header>${metrics.map(([key,label,max])=>{const v=Number(c.center[key]||0); const w=Math.max(2,Math.min(100,v/max*100)); return `<div class="profile-metric"><span>${label}</span><div><i style="width:${w}%;background:${clusterPalette(c.id)}"></i></div><b>${v.toFixed(key.includes('Attendance')?0:1)}</b></div>`}).join('')}</article>`).join('')}</div>`;
}

function riskDistributionChart(d){
  const total=Math.max(1,d.students.length); const low=d.counts.low/total*100,mid=d.counts.mid/total*100,high=d.counts.high/total*100;
  return `<div class="risk-overview"><div class="risk-stack"><i class="low" style="width:${low}%"></i><i class="mid" style="width:${mid}%"></i><i class="high" style="width:${high}%"></i></div><div class="risk-legend"><span><i class="low"></i>Baixa <b>${d.counts.low}</b></span><span><i class="mid"></i>Moderada <b>${d.counts.mid}</b></span><span><i class="high"></i>Alta <b>${d.counts.high}</b></span></div></div>`;
}
function subjectAverageChart(d){
  return `<div class="subject-average-chart">${d.subjectStats.map(item=>{const grade=Number(item.avgGrade); const w=Number.isFinite(grade)?Math.max(0,Math.min(100,grade*10)):0; return `<div class="subject-average-row"><span>${esc(shortSubject(item.subject.name))}</span><div class="grade-track"><i style="width:${w}%" class="${grade<7?'below':''}"></i><em style="left:70%" title="Média de referência 7,0"></em></div><b>${Number.isFinite(grade)?grade.toFixed(1):'—'}</b></div>`}).join('')}<small class="reference-note">Marcador vertical = média de referência 7,0.</small></div>`;
}

async function loadDashboard(){
  state.dashboard=await api.dashboard(state.classId);
  const focus=state.simulation?.focusStudent?.id;
  if(!state.selectedStudentId) state.selectedStudentId=focus||state.dashboard.students[0]?.student.id||null;
}
async function loadCore(){ state.simulation=await api.simulation(); await loadDashboard(); if(versionPill) versionPill.textContent=`v5 • ${formatShortDate(state.simulation.simulation.currentDate)}`; }

function timetableHtml(){
  const subjects=subjectMap();
  const days=state.simulation.timetable||[];
  const times=days[0]?.times||[];
  return `<div class="timetable-wrap"><table class="timetable"><thead><tr><th>Horário</th>${days.map(d=>`<th>${esc(d.label)}</th>`).join('')}</tr></thead><tbody>${times.map((time,i)=>`<tr><td><b>${time}</b><small>Aula ${i+1}</small></td>${days.map(d=>{const s=subjects[d.periods[i]]; return `<td><span class="subject-chip" style="--sub:${esc(s?.color||'#667085')}">${esc(shortSubject(s?.name||d.periods[i]))}</span></td>`}).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function eventIcon(type){ return ({assessment:'📝',release:'📊',story:'⚡'}[type]||'•'); }
function timelineIcon(kind){ return ({assessment:'📝',result:'📊',student:'🎯',threshold:'⚠️',ava:'💻',intervention:'✅',notification:'✉️',time:'🕒'}[kind]||'•'); }

function focusStoryCard(){
  const focusId=state.simulation.focusStudent?.id;
  const p=state.dashboard.students.find(x=>x.student.id===focusId);
  if(!p) return '';
  const autoEmails=(state.simulation.notifications||[]).filter(n=>n.studentId===focusId).length;
  return `<section class="card focus-card">
    <div><span class="eyebrow">aluno-foco da demonstração</span><h2>${esc(p.student.name)}</h2><p>${esc(p.mainReasons[0]||'Sem fator crítico predominante')}</p></div>
    <div class="focus-actions"><div>${riskBadge(p.overallLevel)} <strong>${p.overallScore}</strong><small>score</small></div><div><strong>${autoEmails}</strong><small>ações automáticas</small></div><button class="btn primary" data-open-student="${p.student.id}">Abrir trajetória</button></div>
  </section>`;
}

function renderSimulation(){
  setPage('Simulação do semestre','Avance dia a dia ou até o próximo evento e veja o sistema reagindo em tempo real.');
  const sim=state.simulation;
  const current=sim.simulation.currentDate;
  const next=sim.upcoming[0];
  const sent=(sim.notifications||[]).filter(n=>n.status==='auto_sent_simulated').length;
  const progress=dateProgress(sim.simulation);
  const last=sim.simulation.lastAdvance;
  const highlights=last?.highlights||[];
  view.innerHTML=`
    <section class="card sim-controller">
      <div class="sim-date"><span class="eyebrow">data simulada</span><strong>${formatDate(current)}</strong><small>Semana ${sim.simulation.week} • ${esc(sim.class.term)}</small></div>
      <div class="sim-next"><span class="eyebrow">próximo marco</span><b>${next?esc(next.title):'Fim do semestre'}</b><small>${next?formatDate(next.date):formatDate(sim.simulation.endDate)}</small></div>
      <div class="sim-controls"><button class="btn primary" id="advanceDay">Avançar 1 dia</button><button class="btn" id="advanceWeek">Avançar 1 semana</button><button class="btn" id="nextEvent">Ir ao próximo evento</button><button class="btn ghost" id="resetSemester">Reiniciar</button></div>
      <div class="semester-progress"><div><span>Início ${formatShortDate(sim.simulation.startDate)}</span><b>${Math.round(progress)}% do semestre</b><span>Fim ${formatShortDate(sim.simulation.endDate)}</span></div><div class="progress-track"><i style="width:${progress}%"></i></div></div>
    </section>
    ${last?`<section class="card advance-summary"><div class="advance-arrow"><span>${formatShortDate(last.from)}</span><b>→</b><span>${formatShortDate(last.to)}</span></div><div><span class="eyebrow">o que acabou de acontecer</span><h2>${esc(last.message)}</h2><p>${last.notificationCount} comunicação(ões) automática(s) • ${last.eventCount} evento(s) acadêmico(s)</p></div></section>`:''}
    ${highlights.length?`<section class="advance-highlights">${highlights.slice(0,4).map(item=>`<article class="card highlight-card ${esc(item.tone||'neutral')}"><span>${timelineIcon(item.kind)}</span><div><b>${esc(item.title)}</b><small>${esc(item.detail)}</small></div><time>${formatShortDate(item.date)}</time></article>`).join('')}</section>`:''}
    <div class="kpis sim-kpis">
      ${metricCard('Alunos',state.dashboard.students.length,'turma demonstrativa')}
      ${metricCard('Matérias',sim.subjects.length,'1º período')}
      ${metricCard('Aulas por dia',sim.class.lessonsPerDay,'segunda a sexta')}
      ${metricCard('E-mails automáticos',sent,'sem repetir o mesmo sinal')}
    </div>
    ${focusStoryCard()}
    <div class="grid-sim">
      <section class="card panel schedule-panel"><div class="panel-head"><div><h2>Grade semanal • 5 aulas por dia</h2><p>Seis disciplinas distribuídas ao longo da semana.</p></div></div>${timetableHtml()}</section>
      <section class="card panel upcoming-panel"><div class="panel-head"><div><h2>Próximos eventos</h2><p>Provas, RAs e liberações de notas.</p></div></div><div class="upcoming-list">${sim.upcoming.slice(0,7).map(e=>`<div class="upcoming-row"><span class="event-icon">${eventIcon(e.type)}</span><div><b>${esc(e.title)}</b><small>${esc(e.detail||'')}</small></div><time>${formatShortDate(e.date)}</time></div>`).join('')||'<div class="empty-inline">Nenhum evento futuro.</div>'}</div></section>
    </div>
    <section class="card panel semester-subjects"><div class="panel-head"><div><h2>Plano de avaliações por disciplina</h2><p>Média de referência: <b>7,0</b>. As matérias têm calendários e quantidades de RAs diferentes.</p></div></div><div class="subject-plan-grid">${sim.subjects.map(s=>`<article class="subject-plan"><div class="subject-plan-title"><i style="background:${esc(s.color||'#667085')}"></i><div><h3>${esc(s.name)}</h3><small>${s.workloadHours}h • ${s.ras.length} RA(s)</small></div></div><div class="ra-pills">${s.ras.map(ra=>`<span><b>${esc(ra.id)}</b>${formatShortDate(ra.date)}<small>${esc(ra.components.map(c=>c.type).join(' + '))}</small></span>`).join('')}</div></article>`).join('')}</div></section>
    <section class="card panel activity-panel"><div class="panel-head"><div><h2>O sistema entrando em ação</h2><p>Linha do tempo completa com notas, limites de frequência, AVA e comunicações.</p></div></div><div class="timeline">${sim.recentActivity.length?sim.recentActivity.map(item=>`<div class="timeline-item ${esc(item.tone||'neutral')}"><span>${timelineIcon(item.kind)}</span><div><b>${esc(item.title)}</b><p>${esc(item.detail)}</p></div><time>${formatShortDate(item.date)}</time></div>`).join(''):'<div class="empty-block">O semestre acabou de começar. Avance o tempo para ver o sistema reagir.</div>'}</div></section>`;
}

function renderDashboard(){
  setPage('Visão da turma','Quem precisa de atenção, em qual matéria e por qual motivo.');
  const d=state.dashboard; const total=d.students.length; const criticalSubjects=d.subjectStats.filter(i=>i.highCount>0).length;
  view.innerHTML=`<div class="kpis">${metricCard('Alunos',total,d.class.name)}${metricCard('Atenção alta',d.counts.high,'prioridade de acompanhamento')}${metricCard('Atenção moderada',d.counts.mid,'acompanhar tendência')}${metricCard('Disciplinas com alerta alto',criticalSubjects,'visão coletiva')}</div>
  <div class="dashboard-charts"><section class="card panel"><div class="panel-head"><div><h2>Distribuição de atenção</h2><p>Leitura rápida da turma na data ${formatShortDate(state.simulation.simulation.currentDate)}.</p></div></div>${riskDistributionChart(d)}</section><section class="card panel"><div class="panel-head"><div><h2>Média atual por disciplina</h2><p>O marcador mostra a referência 7,0.</p></div></div>${subjectAverageChart(d)}</section></div>
  <div class="grid-2"><section class="card panel"><div class="panel-head"><div><h2>Alunos da turma</h2><p>Ordenados pelo score geral.</p></div></div><div class="student-list">${d.students.slice().sort((a,b)=>b.overallScore-a.overallScore).map(p=>`<button class="student-row" data-open-student="${p.student.id}"><div><strong>${esc(p.student.name)} ${p.student.focus?'<span class="focus-tag">demo</span>':''}</strong><small>${esc(p.student.registration||'')} • ${esc(p.mainReasons[0]||'Sem fator crítico predominante')}</small></div><div class="row-right">${riskBadge(p.overallLevel)}<b>${p.overallScore}</b></div></button>`).join('')}</div></section>
  <section class="card panel"><div class="panel-head"><div><h2>Leitura por disciplina</h2><p>Ajuda a distinguir um problema individual de um padrão coletivo.</p></div></div><div class="subject-summary">${d.subjectStats.map(item=>`<div class="summary-row"><div><strong>${esc(item.subject.name)}</strong><small>${esc(item.mainIssue)}</small></div><div class="summary-values"><span>Média atual <b class="${item.avgGrade!==null&&item.avgGrade<7?'grade-below':''}">${item.avgGrade?.toFixed(1)??'—'}</b></span><span>Altos <b>${item.highCount}</b></span></div></div>`).join('')}</div></section></div>`;
}

function componentBar(component){ const width=Math.max(4,Math.min(100,component.grade*10)); return `<div class="component-row"><div class="component-top"><span>${esc(component.type)} <small>${Math.round(component.weight*100)}%</small></span><b>${component.grade.toFixed(1)}</b></div><div class="bar"><i style="width:${width}%"></i></div></div>`; }

function assessmentsTimeline(item){
  const completed=Object.fromEntries((item.assessments||[]).map(a=>[a.name,a]));
  return `<div class="ra-history">${(item.subject.ras||[]).map(ra=>{const a=completed[ra.id]; return `<div class="ra-history-item ${a?(a.grade<7?'done below-ref':'done'):'future'}"><div><b>${esc(ra.id)}</b><small>${formatShortDate(ra.date)}</small></div>${a?`<strong>${a.grade.toFixed(1)}</strong><span>${esc(a.weakest?`ponto fraco: ${a.weakest.type}`:'resultado liberado')}</span>`:`<strong>—</strong><span>${esc(ra.components.map(c=>c.type).join(' + '))}</span>`}</div>`}).join('')}</div>`;
}

function subjectCard(item){
  const current=item.assessments[0]; const remaining=item.attendance.remainingAbsences; const remainingText=remaining>1?`${remaining} faltas restantes`:remaining===1?'1 falta restante':'sem margem adicional';
  return `<article class="card subject-card ${item.level}"><div class="subject-card-head"><div><h3>${esc(item.subject.name)}</h3><p>${esc(item.mainReason)}</p></div>${riskBadge(item.level)}</div>
  <div class="mini-grid"><div><span>Frequência atual</span><b>${item.attendance.currentAttendance}%</b><small>${remainingText}</small></div><div><span>AVA</span><b>${item.ava.inactiveDays} dias</b><small>sem acesso • ${item.ava.pendingActivities} pendência(s)</small></div><div><span>${esc(current?.name||'Próxima RA')}</span><b>${current?.grade?.toFixed(1)??'—'}</b><small>${current?.weakest?`menor: ${current.weakest.type}`:'aguardando resultado'}</small></div></div>
  <div class="signals-line">${alertBadge(item.attendance.alertLevel)} ${alertBadge(item.ava.alertLevel)}</div>${current?`<div class="components">${current.components.map(componentBar).join('')}</div>`:''}${assessmentsTimeline(item)}
  <div class="card-actions"><button class="btn" data-add-absence="${item.subject.id}">+ Registrar 1 falta</button><button class="btn ghost" data-ava-today="${item.subject.id}">Acessou AVA hoje</button></div></article>`;
}

async function renderStudent(){
  setPage('Análise do aluno','Seis matérias, histórico de RAs, presença, AVA e motivo do alerta.');
  if(!state.selectedStudentId){ view.innerHTML='<section class="card panel">Selecione um aluno na visão da turma.</section>'; return; }
  state.profile=await api.profile(state.selectedStudentId); const p=state.profile;
  view.innerHTML=`<div class="student-hero card"><div><span class="eyebrow">perfil acadêmico • ${formatDate(state.simulation.simulation.currentDate)}</span><h2>${esc(p.student.name)}</h2><p>${esc(p.student.registration||'')} • ${esc(p.student.email)} • perfil simulado: ${esc(p.student.archetype)}</p></div><div class="hero-score">${riskBadge(p.overallLevel)}<strong>${p.overallScore}</strong><small>score geral</small></div></div>
  <div class="reason-strip">${(p.mainReasons.length?p.mainReasons:['Nenhum fator crítico predominante']).map(r=>`<span>${esc(r)}</span>`).join('')}</div><div class="subject-grid">${p.subjects.map(subjectCard).join('')}</div>
  <section class="card panel email-panel"><div class="panel-head"><div><h2>Comunicação preventiva</h2><p>Além dos envios automáticos da simulação, você pode visualizar o que seria enviado neste momento.</p></div><button class="btn primary" id="previewEmails">Gerar prévias atuais</button></div><div id="emailPreview" class="email-list"><div class="empty-inline">Clique no botão para ver os alertas aplicáveis agora.</div></div></section>`;
}

async function renderAlerts(){
  setPage('Alertas proativos','E-mails graduais enviados quando o aluno cruza um novo nível de atenção.');
  const stored=await api.notifications();
  view.innerHTML=`<section class="card panel"><div class="panel-head"><div><h2>Histórico de comunicações</h2><p>Na simulação, os e-mails aparecem como enviados automaticamente; SMTP real continua opcional.</p></div><span class="pill">${stored.length} registro(s)</span></div>${stored.length?`<div class="notification-list">${stored.map(item=>`<div class="notification-card"><div><span class="eyebrow">${esc(item.type)} • ${esc(item.level)} • ${formatShortDate(item.createdAt?.slice?.(0,10))}</span><h3>${esc(item.subject)}</h3><p>${esc(item.body)}</p><small>Para: ${esc(item.to)}</small></div><div>${item.status==='preview'?`<button class="btn primary" data-send-notification="${item.id}">Simular envio</button>`:`<span class="status-done">✓ ${item.status==='auto_sent_simulated'?'Enviado automaticamente':'Enviado (simulado)'}</span>`}</div></div>`).join('')}</div>`:'<div class="empty-block">Ainda não houve alertas. Avance a simulação.</div>'}</section>`;
}

async function renderClusters(){
  setPage('Perfis por IA','K-Means agrupa a turma por padrões semelhantes; PCA transforma as 6 variáveis em um mapa 2D para visualização.');
  view.innerHTML='<section class="card panel"><h2>Executando K-Means…</h2><p>O backend está chamando Python + scikit-learn e processando a turma.</p></section>';
  try{
    const [status, clusters]=await Promise.all([api.systemStatus(), api.clusters(state.classId)]);
    state.systemStatus=status; state.clusters=clusters;
    const silhouette=clusters.model.silhouetteScore===null?'—':Number(clusters.model.silhouetteScore).toFixed(3);
    view.innerHTML=`<section class="card panel"><div class="panel-head"><div><h2>K-Means funcional • ${clusters.model.k} grupos</h2><p>${esc(clusters.model.note)}</p></div><span class="pill">${status.ai.ok?'IA pronta':'IA indisponível'}</span></div>
      <div class="ai-status"><span><b>${clusters.model.sampleSize}</b><small>alunos processados</small></span><span><b>${silhouette}</b><small>silhouette</small></span><span><b>${esc(clusters.pythonCommand||status.ai.command||'Python')}</b><small>executor</small></span><span><b>7,0</b><small>média de referência</small></span></div></section>
      <div class="ai-visual-grid">
        <section class="card panel"><div class="panel-head"><div><h2>Mapa dos alunos • PCA 2D</h2><p>Cada ponto é um aluno. Pontos próximos têm padrões acadêmicos semelhantes.</p></div></div>${scatterSvg(clusters)}<div class="cluster-legend">${clusters.clusters.map(c=>`<span><i style="background:${clusterPalette(c.id)}"></i>${esc(c.name)}</span>`).join('')}</div></section>
        <section class="card panel"><div class="panel-head"><div><h2>Tamanho dos grupos</h2><p>Distribuição dos ${clusters.model.sampleSize} alunos.</p></div></div>${clusterSizeChart(clusters)}</section>
      </div>
      <section class="card panel cluster-profile-panel"><div class="panel-head"><div><h2>Perfil médio de cada cluster</h2><p>Comparação dos centróides encontrados pelo K-Means.</p></div></div>${clusterProfileChart(clusters)}</section>
      <section class="card panel"><div class="panel-head"><div><h2>Alunos por perfil</h2><p>Os nomes dos perfis são interpretações do padrão encontrado, não rótulos treinados.</p></div></div><div class="cluster-grid">${clusters.clusters.map(c=>`<article class="cluster-card" style="--cluster:${clusterPalette(c.id)}"><div class="cluster-head"><h3>${esc(c.name)}</h3><span>${c.size} aluno(s)</span></div><p class="cluster-signals">${(c.signals||[]).map(esc).join(' • ')}</p><div class="cluster-members">${c.members.map(m=>`<button data-open-student="${m.studentId}">${esc(m.name)}</button>`).join('')}</div></article>`).join('')}</div></section>`;
  } catch(error){
    view.innerHTML=`<section class="card panel"><h2>Não foi possível executar a IA</h2><p>${esc(error.message)}</p><p class="small">No terminal, execute <code>python -m pip install -r requirements.txt</code> e depois <code>npm run check:ai</code>.</p></section>`;
  }
}

async function renderArchitecture(){
  setPage('Arquitetura e status','Componentes implementados e verificação ao vivo da base e da IA.');
  let status=null;
  try{ status=await api.systemStatus(); state.systemStatus=status; }catch(_error){}
  const dataSummary=status?.data?.summary;
  view.innerHTML=`<div class="architecture-flow"><div class="arch-node"><b>Frontend</b><span>painel + linha do tempo</span></div><i>→</i><div class="arch-node"><b>API REST</b><span>Node • Express</span></div><i>→</i><div class="arch-node"><b>Motor acadêmico</b><span>RA • frequência • AVA</span></div><i>→</i><div class="arch-node"><b>IA</b><span>K-Means • Python</span></div></div>
  <div class="system-status card"><div><span class="status-dot ${status?.data?.ok?'ok':'bad'}"></span><b>Base ${status?.data?.ok?'válida':'com erro'}</b><small>${dataSummary?`${dataSummary.students} alunos • ${dataSummary.subjects} matérias • ${dataSummary.enrollments} matrículas`:''}</small></div><div><span class="status-dot ${status?.ai?.ok?'ok':'bad'}"></span><b>IA ${status?.ai?.ok?'pronta':'indisponível'}</b><small>${status?.ai?.ok?`${status.ai.command} • scikit-learn ${status.ai.scikitLearn}`:(status?.ai?.message||'Não verificado')}</small></div></div>
  <div class="grid-2 architecture-panels"><section class="card panel"><h2>Implementado na V5</h2><ul class="check-list"><li>30 alunos fictícios completos em 6 disciplinas</li><li>180 matrículas aluno × disciplina</li><li>Calendário semestral e 5 aulas por dia</li><li>2 ou 3 RAs conforme a matéria</li><li>Notas liberadas em datas diferentes</li><li>Análise por prova, projeto e outros componentes</li><li>Frequência acumulada e margem de faltas</li><li>Tempo sem acesso ao AVA e pendências</li><li>Alertas automáticos graduais e anti-spam</li><li>Histórico de eventos e intervenção</li><li>K-Means realmente executado no Python</li><li>Validação automática da consistência dos dados</li></ul></section><section class="card panel"><h2>Como verificar</h2><ul class="future-list"><li><code>npm run check:data</code> valida a turma inteira</li><li><code>npm run check:ai</code> executa o K-Means real</li><li><code>npm test</code> testa regras acadêmicas e simulação</li><li><code>npm run dev</code> abre o sistema em localhost:3000</li><li>Os e-mails ficam registrados como envio demonstrativo, sem depender de credenciais externas</li></ul></section></div>`;
}

async function render(){ if(state.view==='simulation') renderSimulation(); if(state.view==='dashboard') renderDashboard(); if(state.view==='student') await renderStudent(); if(state.view==='alerts') await renderAlerts(); if(state.view==='clusters') await renderClusters(); if(state.view==='architecture') await renderArchitecture(); }

function renderEmailPreview(items){ const c=document.querySelector('#emailPreview'); if(!c)return; if(!items.length){c.innerHTML='<div class="empty-inline">Nenhum e-mail adicional seria enviado agora.</div>';return;} c.innerHTML=items.map((item,index)=>`<article class="email-card ${item.level}"><div class="email-meta"><span>${esc(item.type)}</span>${alertBadge(item.level)}</div><h3>${esc(item.subject)}</h3><p>${esc(item.body)}</p><button class="btn" data-save-preview="${index}">Salvar na fila</button></article>`).join(''); }

nav.addEventListener('click',async e=>{ const b=e.target.closest('[data-view]'); if(!b)return; state.view=b.dataset.view; await render(); });
classSelect.addEventListener('change',async()=>{ state.classId=classSelect.value; state.selectedStudentId=null; state.clusters=null; await loadCore(); state.view='simulation'; await render(); });

document.body.addEventListener('click',async event=>{
  const open=event.target.closest('[data-open-student]'); if(open){state.selectedStudentId=open.dataset.openStudent;state.view='student';await render();return;}
  if(event.target.id==='advanceDay'){ await api.advanceSimulation(1); state.profile=null;state.clusters=null;await loadCore();showToast('Um dia simulado. Veja o que mudou no painel.');await render();return; }
  if(event.target.id==='advanceWeek'){ await api.advanceSimulation(7); state.profile=null;state.clusters=null;await loadCore();showToast('Uma semana simulada. Indicadores e alertas foram recalculados.');await render();return; }
  if(event.target.id==='nextEvent'){ await api.nextSimulationEvent(); state.profile=null;state.clusters=null;await loadCore();showToast('Calendário avançou até o próximo evento.');await render();return; }
  if(event.target.id==='resetSemester'){ if(!confirm('Reiniciar toda a simulação e apagar os eventos gerados?'))return; await api.resetSimulation();state.selectedStudentId=null;state.profile=null;state.clusters=null;await loadCore();showToast('Semestre reiniciado.');await render();return; }
  const absence=event.target.closest('[data-add-absence]'); if(absence&&state.profile){ const sub=state.profile.subjects.find(i=>i.subject.id===absence.dataset.addAbsence); await api.updateSubject(state.profile.student.id,sub.subject.id,{absences:sub.attendance.absences+1}); await loadDashboard();showToast('Falta registrada e indicadores recalculados.');await renderStudent();return; }
  const ava=event.target.closest('[data-ava-today]'); if(ava&&state.profile){ const today=state.simulation.simulation.currentDate; await api.updateSubject(state.profile.student.id,ava.dataset.avaToday,{lastAvaAccess:today}); await loadDashboard();showToast('Acesso ao AVA atualizado na data simulada.');await renderStudent();return; }
  if(event.target.id==='previewEmails'&&state.profile){ state.notificationPreview=await api.notificationPreview(state.profile.student.id);renderEmailPreview(state.notificationPreview);return; }
  const save=event.target.closest('[data-save-preview]'); if(save){ const item=state.notificationPreview[Number(save.dataset.savePreview)];await api.createNotification(item);showToast('Prévia salva na fila.');return; }
  const send=event.target.closest('[data-send-notification]'); if(send){await api.simulateSend(send.dataset.sendNotification);showToast('Envio simulado.');await renderAlerts();}
});

async function init(){
  try{ await api.health(); state.classes=await api.classes();state.classId=state.classes[0]?.id||null;classSelect.innerHTML=state.classes.map(c=>`<option value="${c.id}">${esc(c.name)} • ${esc(c.term)}</option>`).join('');if(!state.classId)throw new Error('Nenhuma turma cadastrada.');await loadCore();await render(); }
  catch(error){view.innerHTML=`<section class="card panel"><h2>Não foi possível iniciar o projeto</h2><p>${esc(error.message)}</p><p class="small">Execute <code>npm install</code> e <code>npm run dev</code>.</p></section>`;}
}
init();
