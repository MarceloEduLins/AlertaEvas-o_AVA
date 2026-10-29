# Roadmap

## V5 — implementado

- simulação temporal do semestre com avanço de 1 dia, 1 semana ou próximo evento;
- painel visual mostrando data anterior → nova data e eventos processados;
- 30 estudantes fictícios;
- 6 disciplinas;
- 180 matrículas aluno × disciplina;
- 5 aulas por dia;
- RAs com calendários e componentes diferentes;
- média acadêmica de referência 7,0;
- análise por prova, projeto e demais componentes da RA;
- frequência acumulada por disciplina e margem de faltas restante;
- AVA geral + pendências por matéria;
- alertas automáticos graduais com anti-spam;
- consolidação de múltiplos sinais em um único e-mail-resumo;
- linha do tempo de proatividade;
- K-Means executado em Python/scikit-learn;
- PCA 2D para visualização dos clusters;
- gráficos de dispersão, tamanho dos grupos e centróides;
- validação automática da consistência da base;
- testes automatizados das regras e do semestre.

## Próximas evoluções

- PostgreSQL/MySQL no lugar do JSON demonstrativo;
- importação CSV;
- autenticação e perfis de acesso;
- configuração das regras por instituição;
- gráficos históricos por aluno/disciplina;
- SMTP real com credenciais institucionais seguras;
- histórico de intervenções pedagógicas;
- filtros por turma, período e professor.

## Futuro institucional

- integração com sistema acadêmico/AVA por API autorizada;
- validação de critérios com equipe pedagógica;
- avaliação ética e de privacidade/LGPD;
- validação externa dos clusters e dos limiares de alerta.
