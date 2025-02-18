import { AST } from '.';
import { parse as parseJson } from './json';
import { parse as parseYaml } from './yaml';

export const parse: AST.ParseFunction = (documentIndex, doc) =>
  doc.trimStart().startsWith('{')
    ? parseJson(documentIndex, doc)
    : parseYaml(documentIndex, doc);
