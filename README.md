# Alerta Evasão V5 — Monitoramento acadêmico preventivo

Sistema demonstrativo para acompanhar uma turma ao longo do semestre usando **frequência acumulada, RAs, componentes de avaliação, atividade no AVA, alertas proativos e agrupamento não supervisionado com K-Means**.

> Todos os alunos, notas, faltas, acessos e eventos são fictícios/sintéticos. O projeto não afirma prever evasão com certeza; ele identifica sinais acadêmicos que podem justificar acompanhamento humano.

## Cenário demonstrativo completo

- 1 turma de Ciência da Computação — 1º período
- **30 alunos fictícios**
- **6 disciplinas**
- **180 matrículas aluno × disciplina**
- 5 dias letivos por semana
- **5 aulas por dia**
- presença mínima configurada: 75%
- 15 RAs no total
- algumas disciplinas possuem 2 RAs e outras 3
- cada RA pode ter componentes diferentes: prova, projeto, lista, apresentação, seminário, produção textual etc.

### Disciplinas

1. Raciocínio Algorítmico
2. Experiência Criativa: Navegando na Computação
3. Filosofia
4. Descoberta e Evolução da Computação
5. Modelagem de Fenômenos Físicos
6. Leitura e Escrita Acadêmica

## O que está funcionando

### 1. Simulação temporal do semestre

Na tela **Simulação do semestre** é possível:

- avançar **1 dia**;
- avançar 1 semana;
- ir diretamente ao próximo evento;
- reiniciar todo o semestre.

Quando o calendário avança, o backend atualiza automaticamente:

- aulas realizadas;
- faltas por aluno e disciplina;
- frequência acumulada;
- margem de faltas restante;
- acesso ao AVA;
- atividades pendentes;
- datas das avaliações;
- liberação das notas;
- RAs e seus componentes;
- score de atenção;
- nível de atenção;
- alertas proativos;
- linha do tempo do semestre.

### 2. Avaliações diferentes por disciplina

O sistema não trabalha apenas com uma nota final. Cada RA possui componentes e pesos próprios.

Exemplo:

```text
RA1 — Raciocínio Algorítmico
Prova ............. 60%
Lista prática ..... 40%
```

Assim, quando um aluno obtém uma RA baixa, o sistema consegue identificar **qual componente puxou a média para baixo**.

### 3. Frequência acumulada e alertas graduais

A margem é calculada pela carga total prevista da disciplina:

```text
faltas permitidas - faltas registradas = faltas restantes
```

A média acadêmica de referência usada no protótipo é **7,0**.

Faixas demonstrativas de frequência:

- mais de 5 faltas restantes → normal;
- 3 a 5 → lembrete;
- 1 a 2 → atenção;
- sem margem → crítico.

Os alertas são registrados somente quando há mudança relevante de faixa, evitando repetição desnecessária. Quando vários sinais aparecem no mesmo avanço do calendário, o sistema consolida tudo em **um único e-mail-resumo por aluno**, em vez de disparar mensagens separadas. Avisos não críticos respeitam um **cooldown de 5 dias**; situações críticas podem ser comunicadas imediatamente.

### 4. Engajamento no AVA

O sistema acompanha:

- último acesso ao AVA;
- dias sem acesso;
- quantidade de pendências por disciplina.

Faixas do protótipo:

- 0–3 dias → normal;
- 4–7 dias → observar;
- 8–14 dias → atenção;
- 15+ dias → crítico.

### 5. Alertas proativos

Existem comunicações específicas para:

- frequência;
- resultado de RA;
- inatividade no AVA.

No ambiente demonstrativo, os envios são **registrados como enviados de forma simulada** para que o fluxo funcione sem armazenar senhas de e-mail no repositório.

### 6. IA não supervisionada — K-Means

O Node.js envia os indicadores atuais da turma para um módulo Python com **scikit-learn**.

Variáveis usadas:

- frequência média;
- média acadêmica;
- média de dias sem AVA;
- pendências;
- média em provas;
- média em projetos.

O K-Means encontra grupos sem receber previamente os rótulos de cada aluno. Depois, o sistema interpreta os centróides para facilitar a leitura, podendo produzir grupos como:

- risco por frequência;
- desengajamento no AVA;
- dificuldade em provas;
- dificuldade em projetos;
- perfil estável.

A tela também mostra a quantidade de alunos processados, versão do scikit-learn e **silhouette score** quando há variação suficiente nos dados. Na V5, o resultado inclui uma **projeção PCA 2D**, usada apenas para visualização, com gráfico de dispersão dos alunos, tamanho dos clusters e comparação dos centróides.

> No primeiro dia do semestre todos os indicadores ainda são muito parecidos. Conforme a simulação avança e surgem faltas, acessos e notas, os grupos passam a se diferenciar.

## História demonstrativa

A aluna-foco **Ana Ribeiro** possui uma trajetória criada para demonstrar a proatividade:

1. começa sem alerta relevante;
2. recebe RA1 baixa em Raciocínio Algorítmico principalmente por causa da prova;
3. chega à faixa de 5 faltas restantes em Filosofia;
4. depois entra na faixa de apenas 2 faltas restantes;
5. passa vários dias sem acessar o AVA;
6. o sistema registra alertas automáticos;
7. uma intervenção simulada reduz pendências e o nível é recalculado.

## Instalação

### Node.js

Requisitos: Node.js 18+ e npm.

```bash
npm install
```

### Python / IA

```bash
python -m pip install -r requirements.txt
```

No Windows, se `python` não funcionar:

```powershell
py -3 -m pip install -r requirements.txt
```

Dependências Python atuais:

- NumPy
- scikit-learn

## Rodar o projeto

```bash
npm run dev
```

Abra:

```text
http://localhost:3000
```

Também existe o atalho:

```text
INICIAR_WINDOWS.bat
```

## Verificações

Validar se todos os alunos estão matriculados em todas as disciplinas e se a grade/RAs estão consistentes:

```bash
npm run check:data
```

Executar os testes das regras e da simulação:

```bash
npm test
```

Testar de verdade a integração Node → Python → scikit-learn → K-Means:

```bash
npm run check:ai
```

Executar todas as verificações:

```bash
npm run check:all
```

Na versão entregue, as verificações esperadas são:

- 30 alunos;
- 6 disciplinas;
- 180 matrículas;
- 5 dias de grade;
- 5 aulas por dia;
- 15 RAs;
- semestre completo liberando todas as RAs;
- K-Means processando os 30 alunos.

## Comandos principais

```bash
npm run dev
npm start
npm test
npm run check:data
npm run check:ai
npm run check:all
npm run reset-data
```

## Endpoints principais

```text
GET  /api/system/status
GET  /api/simulation
POST /api/simulation/advance
POST /api/simulation/next-event
POST /api/simulation/reset

GET  /api/classes
GET  /api/classes/cc1a/dashboard
GET  /api/classes/cc1a/clusters
GET  /api/students/s1/profile
PATCH /api/students/:studentId/subjects/:subjectId

GET  /api/notifications
GET  /api/students/:studentId/notifications/preview
POST /api/notifications
POST /api/notifications/:notificationId/send
```

## Estrutura

```text
AlertaEvasao_Completo/
├── public/
│   ├── css/
│   ├── js/
│   └── index.html
├── src/
│   ├── controllers/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   └── data/
├── scripts/
│   ├── cluster_students.py
│   ├── check-ai.js
│   ├── check-data.js
│   └── reset-data.js
├── tests/
├── docs/
│   └── apresentacao/
├── requirements.txt
├── package.json
├── api.http
├── INICIAR_WINDOWS.bat
└── server.js
```

## Limitações assumidas

- a base é sintética;
- horários, professores e acontecimentos são demonstrativos;
- os clusters são exploratórios, não um diagnóstico de evasão;
- e-mail externo real não é necessário para a demonstração e não há credenciais armazenadas;
- integrações com AVA e sistemas institucionais reais exigiriam autorização e tratamento adequado de dados.

## Apresentação da AP1

O PDF original está mantido sem alterações em:

[`docs/apresentacao/AP1_Alerta_Evasao.pdf`](docs/apresentacao/AP1_Alerta_Evasao.pdf)
