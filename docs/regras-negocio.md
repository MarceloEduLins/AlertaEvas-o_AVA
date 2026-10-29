# Regras de negócio — V5

## Referências do protótipo

- Média acadêmica de referência: **7,0**.
- Presença mínima configurada na turma demonstrativa: **75%**.
- Os valores são configuráveis/evolutivos e os dados da turma são sintéticos.

## Frequência

A margem usa a carga total prevista da disciplina:

`faltas permitidas - faltas registradas = faltas restantes`

- mais de 5 faltas restantes: normal;
- 3 a 5: lembrete;
- 1 a 2: atenção;
- 0 ou margem negativa: crítico.

Uma mesma faixa só é comunicada uma vez por disciplina.

## Desempenho

Cada RA pode ter componentes e pesos diferentes.

- nota >= 7,0: sem e-mail de desempenho;
- 6,0–6,9: lembrete preventivo;
- 5,0–5,9: atenção;
- abaixo de 5,0: crítico.

O sistema também mostra o componente mais fraco da RA (por exemplo, prova ou projeto).

## AVA

- 0–3 dias sem acesso: normal;
- 4–7 dias: observar no painel;
- 8–14 dias: atenção;
- 15+ dias: crítico.

O e-mail de AVA é geral por aluno e usa como contexto a disciplina com mais pendências.

## Anti-spam

- a mesma faixa de frequência não é repetida;
- a mesma faixa de AVA não é repetida;
- cada resultado de RA pode gerar um novo aviso porque é um evento acadêmico novo;
- se vários sinais novos aparecem no mesmo avanço do calendário, eles são reunidos em **um único e-mail-resumo** para o aluno;
- lembretes e avisos de atenção respeitam **cooldown mínimo de 5 dias**; alertas críticos podem ser enviados imediatamente;
- um novo e-mail só surge quando existe um novo resultado ou mudança relevante de faixa.

## Score de atenção

O score combina frequência, desempenho, AVA e pendências. A presença de múltiplos fatores simultâneos adiciona peso ao score, tornando o sistema mais rigoroso quando a dificuldade aparece em mais de uma dimensão.
