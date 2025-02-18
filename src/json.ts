import * as json from 'json-to-ast';
import { AST } from '.';

export const parse: AST.ParseFunction = (
  documentIndex: number,
  doc: string,
) => {
  const x = json(doc, { loc: true });

  switch (x.type) {
    case 'Array':
      return new JsonArrayNode(documentIndex, x);
    case 'Literal':
      return new JsonLiteralNode(documentIndex, x);
    case 'Object':
      return new JsonObjectNode(documentIndex, x);
    default:
      throw new Error(`Unexpected node type: ${x.type}`);
  }
};

export abstract class JsonNode<TNode extends json.ASTNode = json.ASTNode>
  extends AST.BaseNode
  implements AST.ASTNode
{
  constructor(documentIndex: number, protected readonly source: TNode) {
    super(documentIndex);
  }

  get type() {
    return this.source.type as any;
  }

  get loc() {
    return this.source.loc!;
  }
}

export class JsonObjectNode
  extends JsonNode<json.ObjectNode>
  implements AST.ObjectNode
{
  constructor(documentIndex: number, node: json.ObjectNode) {
    super(documentIndex, node);
  }

  get children() {
    return this.source.children.map(
      (child) => new JsonPropertyNode(this.documentIndex, child),
    );
  }
}

export class JsonPropertyNode
  extends JsonNode<json.PropertyNode>
  implements AST.PropertyNode
{
  constructor(documentIndex: number, node: json.PropertyNode) {
    super(documentIndex, node);
  }

  get key() {
    return new JsonIdentifierNode(this.documentIndex, this.source.key);
  }

  get value() {
    switch (this.source.value.type) {
      case 'Array':
        return new JsonArrayNode(this.documentIndex, this.source.value);
      case 'Literal':
        return new JsonLiteralNode(this.documentIndex, this.source.value);
      case 'Object':
        return new JsonObjectNode(this.documentIndex, this.source.value);
      default:
        throw new Error(`Unexpected node type: ${this.source.value.type}`);
    }
  }
}

export class JsonIdentifierNode
  extends JsonNode<json.IdentifierNode>
  implements AST.IdentifierNode
{
  constructor(documentIndex: number, node: json.IdentifierNode) {
    super(documentIndex, node);
  }

  get value() {
    return this.source.value;
  }
}

export class JsonArrayNode
  extends JsonNode<json.ArrayNode>
  implements AST.ArrayNode
{
  constructor(documentIndex: number, node: json.ArrayNode) {
    super(documentIndex, node);
  }

  get children() {
    return this.source.children.map((child) => {
      switch (child.type) {
        case 'Array':
          return new JsonArrayNode(this.documentIndex, child);
        case 'Literal':
          return new JsonLiteralNode(this.documentIndex, child);
        case 'Object':
          return new JsonObjectNode(this.documentIndex, child);
        default:
          throw new Error(`Unexpected node type: ${child.type}`);
      }
    });
  }
}

export class JsonLiteralNode
  extends JsonNode<json.LiteralNode>
  implements AST.LiteralNode
{
  constructor(documentIndex: number, node: json.LiteralNode) {
    super(documentIndex, node);
  }

  get value() {
    return this.source.value;
  }
}
