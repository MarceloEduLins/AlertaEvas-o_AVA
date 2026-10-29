# Arquitetura — V5

```text
Frontend (HTML/CSS/JS)
        ↓
API REST (Node + Express)
        ↓
┌────────────────────────────────────────────────────┐
│ Serviços                                           │
│ simulation.service   → calendário e eventos        │
│ academic.service     → frequência/RA/AVA/score     │
│ notification.service → alertas + digest anti-spam  │
│ clustering.service   → integração Node → Python    │
└────────────────────────────────────────────────────┘
        ↓                              ↓
JSON sintético                  Python/scikit-learn
                                      ↓
                              K-Means + PCA 2D
```

## Simulação temporal

O `simulation.service` mantém a data do semestre e processa:

- aulas da grade semanal;
- faltas por aluno e disciplina;
- acesso ao AVA e pendências;
- aplicação e liberação de RAs;
- componentes como prova/projeto/lista;
- mudança de níveis de atenção;
- comunicações automáticas;
- resumo do último avanço (`from → to`, eventos e alertas gerados).

O simulador usa valores determinísticos derivados dos IDs e das datas para que o mesmo reset reproduza a mesma demonstração.

## Motor acadêmico

A referência de desempenho do protótipo é **7,0**. O score combina:

- frequência acumulada e margem de faltas;
- nota da RA atual e seu componente mais fraco;
- dias sem acessar o AVA;
- atividades pendentes;
- combinação de múltiplos sinais.

## Alertas

O sistema evita excesso de mensagens:

- comunica cada faixa de frequência uma única vez;
- comunica cada faixa de AVA uma única vez;
- cada nova RA pode gerar um alerta novo;
- múltiplos sinais simultâneos são agrupados em um digest;
- avisos não críticos respeitam cooldown de 5 dias;
- alertas críticos podem ser enviados imediatamente.

## IA não supervisionada

O backend envia seis variáveis por aluno para o script Python:

- presença média;
- média acadêmica;
- dias sem AVA;
- pendências;
- média em provas;
- média em projetos.

O K-Means agrupa os estudantes sem rótulos prévios. O PCA reduz as seis dimensões para duas **somente para visualização**, permitindo desenhar o gráfico de dispersão dos clusters no frontend.

## Dados

`academic.seed.json` representa o início do semestre.

`academic.json` representa o estado atual da simulação.

A gravação é atômica para evitar leitura de JSON incompleto. `npm run reset-data` restaura o seed.
