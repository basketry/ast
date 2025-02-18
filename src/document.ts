import { encodeRange, Range } from 'basketry';
import * as AST from './ast';

export abstract class DocumentNode {
  constructor(readonly node: AST.ASTNode) {}

  abstract readonly nodeType: string;

  get loc(): Range {
    return this.node.loc;
  }

  get keys(): string[] {
    return this.node.isObject()
      ? this.node.children.map((n) => n.key.value)
      : [];
  }

  /** Gets the string-encoded location of the property key if it exists; otherwise, `undefined` */
  keyRange(key: string): string | undefined {
    const prop = this.getProperty(key);
    if (!prop) return;

    return encodeRange(prop.key.documentIndex, prop.key.loc);
  }

  /** Gets the string-encoded location of the property if it exists; otherwise, `undefined` */
  propRange(key: string): string | undefined {
    const prop = this.getProperty(key);
    if (!prop) return;

    return encodeRange(prop.documentIndex, prop.loc);
  }

  protected getChild<T extends DocumentNode>(
    key: string,
    Node: new (n: AST.ASTNode) => T,
  ): T | undefined {
    const prop = this.getProperty(key);
    return prop?.value ? new Node(prop.value) : undefined;
  }

  protected getArray<T extends DocumentNode>(
    key: string,
    Node: new (n: AST.ASTNode) => T,
  ): T[] | undefined {
    const array = this.getProperty(key)?.value;

    return array?.isArray()
      ? array.children.map((n) => new Node(n))
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
  constructor(node: AST.ASTNode) {
    super(node);
  }

  get value(): T {
    if (this.node.isLiteral() || this.node.isIdentifier()) {
      return this.node.value as T;
    }
    console.log(this.node);
    throw new Error('Cannot parse literal');
  }
}
