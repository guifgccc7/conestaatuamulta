# Índice de Placeholders — contestaatuamulta.pt

Todos os placeholders usados nas minutas, agrupados por categoria.
O sistema de auto-preenchimento deve substituir cada `{{chave}}` pelo valor correspondente.

---

## IDENTIFICAÇÃO DO ARGUIDO

| Placeholder              | Descrição                                  | Fonte no Wizard         |
|--------------------------|--------------------------------------------|-------------------------|
| `{{nome_completo}}`      | Nome completo do arguido                   | Passo 2 — titular       |
| `{{nif}}`                | Número de Identificação Fiscal             | Passo 2 — NIF           |
| `{{numero_cc}}`          | N.º do Cartão de Cidadão / BI              | Passo 2 — CC            |
| `{{validade_cc}}`        | Validade do CC                             | Passo 2 — CC            |
| `{{naturalidade}}`       | Naturalidade do arguido                    | Passo 2 (opcional)      |
| `{{morada_completa}}`    | Rua, n.º, andar, apartamento              | Passo 2 — morada        |
| `{{codigo_postal}}`      | Código postal (XXXX-XXX)                   | Passo 2 — morada        |
| `{{localidade}}`         | Localidade / cidade                        | Passo 2 — morada        |
| `{{email}}`              | Endereço de email do arguido               | Conta do utilizador      |
| `{{telefone}}`           | Número de telefone do arguido              | Passo 2 (opcional)      |

---

## DADOS DO AUTO / PROCESSO

| Placeholder              | Descrição                                  | Fonte no Wizard         |
|--------------------------|--------------------------------------------|-------------------------|
| `{{numero_auto}}`        | N.º do auto de contraordenação             | Passo 2 — n.º auto      |
| `{{numero_processo}}`    | N.º do processo judicial (se existir)      | Passo 2 (opcional)      |
| `{{data_auto}}`          | Data de lavratura do auto                  | Passo 2 — data          |
| `{{data_infracao}}`      | Data da alegada infração                   | Passo 2 — data          |
| `{{hora_infracao}}`      | Hora da alegada infração                   | Passo 2 — hora          |
| `{{entidade_autuante}}`  | Entidade que lavrou o auto (GNR/PSP/EMEL…) | Passo 2 — entidade      |
| `{{local_infracao}}`     | Local / via onde ocorreu a infração        | Passo 2 — local         |
| `{{municipio}}`          | Município onde ocorreu a infração          | Passo 2 — local         |
| `{{comarca}}`            | Comarca do tribunal competente             | Calculado pelo sistema  |
| `{{artigos_violados}}`   | Artigos do CE / RGCO invocados no auto     | Extraído do auto        |
| `{{data_notificacao}}`   | Data em que o arguido recebeu a notificação| Passo 2                 |
| `{{valor_coima}}`        | Valor da coima aplicada (€)                | Passo 2                 |
| `{{custas}}`             | Valor das custas processuais (€)           | Passo 2                 |
| `{{sancao_acessoria}}`   | Pontos de sanção acessória (se aplicável)  | Passo 2                 |

---

## VEÍCULO

| Placeholder              | Descrição                                  | Fonte no Wizard         |
|--------------------------|--------------------------------------------|-------------------------|
| `{{matricula}}`          | Matrícula do veículo (normalizada: AB12CD) | Passo 2 — matrícula     |
| `{{marca_modelo}}`       | Marca e modelo do veículo                  | Passo 2 (opcional)      |
| `{{matricula_errada}}`   | Matrícula incorreta constante do auto      | Passo 3 — erro admin    |

---

## EXCESSO DE VELOCIDADE (específico)

| Placeholder                   | Descrição                               | Fonte no Wizard         |
|-------------------------------|-----------------------------------------|-------------------------|
| `{{velocidade_registada}}`    | Velocidade registada pelo radar (km/h)  | Passo 3 — velocidade    |
| `{{limite_legal}}`            | Limite máximo legal no local (km/h)     | Passo 3 — limite        |
| `{{limite_geral}}`            | Limite geral da via (se sem sinalização)| Calculado               |
| `{{tipo_equipamento}}`        | Tipo de radar (fixo/móvel/LIDAR/etc.)   | Passo 3 — equipamento   |
| `{{numero_serie_equipamento}}`| N.º de série do equipamento de medição  | Passo 3 (se disponível) |

---

## ESTACIONAMENTO (específico)

| Placeholder                  | Descrição                                | Fonte no Wizard          |
|------------------------------|------------------------------------------|--------------------------|
| `{{tipo_infracao_estac}}`    | Tipo de infração de estacionamento       | Passo 3 — tipo           |
| `{{numero_cartao_defic}}`    | N.º do cartão de estacionamento defic.   | Passo 3 — cartão         |
| `{{validade_cartao_defic}}`  | Validade do cartão de deficiência        | Passo 3 — cartão         |
| `{{entidade_emissora_cartao}}`| Entidade emissora do cartão             | Passo 3 — cartão         |
| `{{descricao_emergencia}}`   | Descrição da situação de emergência      | Passo 3 — força maior    |
| `{{medidas_adotadas}}`       | Medidas tomadas para remover o veículo   | Passo 3 — força maior    |

---

## ERRO ADMINISTRATIVO (específico)

| Placeholder                  | Descrição                                | Fonte no Wizard          |
|------------------------------|------------------------------------------|--------------------------|
| `{{matricula_errada_no_auto}}`| Matrícula incorretamente indicada no auto| Passo 3 — tipo erro      |
| `{{matricula_real}}`         | Matrícula real do veículo do arguido     | Passo 2 — matrícula      |
| `{{titular_real}}`           | Titular real do veículo com matrícula errada| Passo 3             |
| `{{data_no_auto}}`           | Data incorretamente indicada no auto     | Passo 3 — tipo erro      |
| `{{local_no_auto}}`          | Local incorretamente indicado no auto    | Passo 3 — tipo erro      |
| `{{prova_alibi}}`            | Descrição da prova contrária à data/local| Passo 3 — descrição      |
| `{{periodo_decorrido}}`      | Período decorrido desde a infração       | Calculado automaticamente|
| `{{prazo_prescricao}}`       | Prazo de prescrição aplicável            | Calculado automaticamente|

---

## CONDUTOR / TERCEIROS

| Placeholder                  | Descrição                                | Fonte no Wizard          |
|------------------------------|------------------------------------------|--------------------------|
| `{{nome_condutor_real}}`     | Nome do condutor efetivo (se diferente)  | Passo 3 — identificação  |
| `{{cc_condutor_real}}`       | CC do condutor efetivo                   | Passo 3 — identificação  |
| `{{morada_condutor_real}}`   | Morada do condutor efetivo               | Passo 3 — identificação  |

---

## TESTEMUNHAS

| Placeholder                  | Descrição                                | Fonte no Wizard          |
|------------------------------|------------------------------------------|--------------------------|
| `{{nome_testemunha_1}}`      | Nome da primeira testemunha              | Passo 4 — testemunhas    |
| `{{morada_testemunha_1}}`    | Morada da primeira testemunha            | Passo 4 — testemunhas    |
| `{{nome_testemunha_2}}`      | Nome da segunda testemunha               | Passo 4 — testemunhas    |
| `{{morada_testemunha_2}}`    | Morada da segunda testemunha             | Passo 4 — testemunhas    |

---

## GERADOS AUTOMATICAMENTE PELO SISTEMA

| Placeholder               | Descrição                                 | Método de cálculo         |
|---------------------------|-------------------------------------------|---------------------------|
| `{{comarca}}`             | Comarca do TIC competente                 | Geolocalização do município|
| `{{data_submissao}}`      | Data de geração do documento              | `new Date()` formatada    |
| `{{periodo_decorrido}}`   | Tempo entre infração e notificação        | `dateDiff(infração, hoje)`|
| `{{prazo_prescricao}}`    | Prazo de prescrição (2 ou 5 anos)         | Baseado no valor da coima |
| `{{limite_geral}}`        | Limite geral de velocidade na via         | Baseado no tipo de via    |

---

## ARTIGOS LEGAIS REFERENCIADOS NAS MINUTAS

### Código da Estrada (DL n.º 114/94, de 3 de maio — versão consolidada)
- Art. 13.º — Deveres gerais de sinalização
- Art. 24.º — Limites de velocidade
- Art. 27.º — Limite geral em autoestradas / fora de localidades
- Art. 48.º — Estacionamento e paragem proibidos
- Art. 49.º — Estacionamento proibido — exceções (força maior)
- Art. 82.º — Cinto de segurança
- Art. 84.º — Utilização de telemóvel
- Art. 117.º / 118.º — Estacionamento para pessoas com deficiência
- Art. 133.º / 134.º — Responsabilidade pelo veículo
- Art. 162.º — Identificação dos intervenientes
- Art. 169.º — Obrigações do agente autuante

### RGCO — DL n.º 433/82, de 27 de outubro
- Art. 7.º — Dolo e negligência
- Art. 8.º — Culpa (princípio da culpa)
- Art. 18.º — Determinação da coima
- Art. 27.º — Prescrição do procedimento
- Art. 28.º — Causas de interrupção da prescrição
- Art. 29.º — Causas de suspensão da prescrição
- Art. 41.º — Direito subsidiário (CPP / CPA)
- Art. 50.º — Direito de audição prévia (OBRIGATÓRIO antes de condenar)
- Art. 58.º — Elementos obrigatórios do auto
- Art. 59.º — Impugnação judicial (prazo: 15 dias úteis)
- Art. 61.º — Tribunal competente
- Art. 63.º — Decisão do tribunal (arquivamento, absolvição, condenação)
- Art. 70.º — Notificações
- Art. 72.º-A — Atenuação especial da coima
- Art. 79.º — Requisitos da notificação da decisão
- Art. 92.º — Custas

### Constituição da República Portuguesa (CRP)
- Art. 29.º, n.º 5 — Ne bis in idem
- Art. 32.º, n.º 1 — Garantias de defesa no processo criminal
- Art. 32.º, n.º 2 — Presunção de inocência / in dubio pro reo
- Art. 32.º, n.º 10 — Direito de audição

### Outros diplomas
- DL n.º 291/90, de 20 de setembro — Metrologia Legal
- Portaria n.º 1504/2008, de 22 de dezembro — Verificação metrológica radares
- DL n.º 22-A/98, de 20 de janeiro — RST (Regulamento de Sinalização do Trânsito)
- DL n.º 307/2003, de 10 de dezembro — Cartão Estacionamento Deficientes
- DL n.º 44/2002, de 2 de março — Fiscalização do estacionamento (EMEL, etc.)
- DL n.º 34/2008, de 26 de fevereiro — Regulamento das Custas Processuais
