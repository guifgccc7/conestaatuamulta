/**
 * Gera a secção final "Forma de envio da presente defesa" para documentos de
 * impugnação/contestação de coimas.
 *
 * Recomenda o envio por correio registado com aviso de receção, fundamenta a
 * importância probatória do registo e nota — sem o garantir — que esta forma
 * de envio pode relevar para os prazos processuais de prescrição.
 *
 * @param sectionNumeral  Numeral romano da secção (ex.: "V", "VI")
 */
export function buildSubmissionSection(sectionNumeral: string): string {
  return `${sectionNumeral} — FORMA DE ENVIO DA PRESENTE DEFESA

A presente impugnação é remetida à entidade destinatária por correio registado com aviso de receção, nos termos gerais aplicáveis supletivamente ao procedimento contraordenacional.

Esta modalidade de envio confere ao/à arguido/a prova documental da data de expedição e do momento em que a entidade autuante tomou conhecimento da presente defesa, assegurando a demonstração do cumprimento do prazo legalmente previsto para a sua apresentação, nos termos do artigo 59.º, n.º 3 do Decreto-Lei n.º 433/82, de 27 de outubro (RGCO).

Sem prejuízo do exposto, importa referir que a apresentação tempestiva de defesa por esta via poderá, em determinadas circunstâncias processuais, constituir causa interruptiva ou suspensiva dos prazos de prescrição previstos nos artigos 27.º e 28.º do RGCO, podendo assim relevar para o cômputo dos prazos do procedimento. Tal não constitui, contudo, por si só, garantia de extinção do procedimento contraordenacional, dependendo sempre da verificação dos pressupostos legais aplicáveis ao caso concreto.

O talão de registo postal e o respetivo aviso de receção assinado ficam na posse do/a arguido/a, para eventual junção aos autos caso tal se revele necessário.`;
}
