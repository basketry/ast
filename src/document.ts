import { encodeRange, Range } from 'basketry';
import * as AST from './ast';

export type NodeContext = {
  root: DocumentNode | undefined;
  parentKey: AST.IdentifierNode | undefined;
};

export type NodeConstructor<T extends DocumentNode> = new (
  node: AST.ASTNode,
  context: NodeContext,
) => T;

export abstract class DocumentNode {
  constructor(readonly node: AST.ASTNode, context: NodeContext) {
    this.root = context.root ?? this;
    this.parentKey = context.parentKey;
  }

  abstract readonly nodeType: string;

  readonly root: DocumentNode;
  readonly parentKey: AST.IdentifierNode | undefined;

  get loc(): Range {
    return this.node.loc;
  }

  get keys(): string[] {
    return this.node.isObject()
      ? this.node.children.map((n) => n.key.value)
      : [];
  }

  keyRange(key: string): string | undefined {
    const prop = this.getProperty(key);
    if (!prop) return;

    return encodeRange(prop.key.loc);
  }

  propRange(key: string): string | undefined {
    const prop = this.getProperty(key);
    if (!prop) return;

    return encodeRange(prop.loc);
  }

  protected getChild<T extends DocumentNode>(
    key: string,
    Node: NodeConstructor<T>,
  ): T | undefined {
    const prop = this.getProperty(key);
    return prop?.value
      ? new Node(prop.value, { root: this.root, parentKey: prop.key })
      : undefined;
  }

  protected getArray<T extends DocumentNode>(
    key: string,
    Node: NodeConstructor<T>,
  ): T[] | undefined {
    const array = this.getProperty(key)?.value;

    return array?.isArray()
      ? array.children.map(
          (n) => new Node(n, { root: this.root, parentKey: undefined }),
        )
      : undefined;
  }

  protected getProperty(key: string) {
    if (this.node.isObject()) {
      return this.node.children.find((n) => n.key.value === key);
    }
    return;
  }

  protected getLiteral<T extends string | number | boolean | null>(
    key: string,
  ): LiteralNode<T> | undefined {
    return this.getChild(key, LiteralNode) as LiteralNode<T> | undefined;
  }
}

export class LiteralNode<
  T extends string | number | boolean | null,
> extends DocumentNode {
  public readonly nodeType = 'Literal';
  constructor(node: AST.ASTNode, context: NodeContext) {
    super(node, context);
  }

  get value(): T {
    if (this.node.isLiteral() || this.node.isIdentifier()) {
      return this.node.value as T;
    }
    console.log(this.node);
    throw new Error('Cannot parse literal');
  }
}
