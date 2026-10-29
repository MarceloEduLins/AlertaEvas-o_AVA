# Roteiro rápido de demonstração — Alerta Evasão V5

1. Execute `npm run reset-data` e `npm run dev`.
2. Abra `http://localhost:3000`.
3. Na **Simulação do semestre**, mostre a data atual e a barra de progresso.
4. Use **Ir ao próximo evento** para chegar às primeiras avaliações.
5. Após a liberação da RA1 de Raciocínio Algorítmico, abra **Ana Ribeiro** e mostre:
   - nota da RA;
   - prova como componente mais fraco;
   - média de referência 7,0;
   - mudança do score.
6. Continue avançando até o marco de frequência de Filosofia:
   - primeiro restam 5 faltas → lembrete curto;
   - depois restam 2 → atenção;
   - o mesmo nível não gera mensagens repetidas.
7. Avance até a queda de atividade no AVA e mostre o digest quando houver mais de um sinal simultâneo.
8. Abra **Alertas proativos** para visualizar o histórico das comunicações.
9. Abra **Perfis por IA** depois que já houver notas/faltas:
   - gráfico PCA 2D;
   - tamanho dos clusters;
   - centróides;
   - alunos de cada perfil.
10. Clique em um ponto/aluno do cluster para voltar à análise individual.

## Verificação técnica antes da apresentação

```bash
npm run check:all
```

O esperado é:

- 30 alunos;
- 6 disciplinas;
- 180 matrículas;
- 15 RAs;
- 12 testes automatizados aprovados;
- K-Means + PCA processando os 30 alunos.
