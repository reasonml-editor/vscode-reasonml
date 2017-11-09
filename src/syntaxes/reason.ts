// tslint:disable object-literal-sort-keys

import * as basis from "./basis";
import { OCaml } from "./ocaml";
import * as schema from "./schema";

const {
  // Class,
  // Palette,
  Scope,
  Token,
  alt,
  capture,
  // complement,
  // group,
  include,
  // lastWords,
  lookAhead,
  lookBehind,
  // many,
  // negativeLookAhead,
  // negativeLookBehind,
  // opt,
  // ref,
  seq,
  // set,
  // words,
} = basis;

export class Reason extends OCaml {
  public declEndItem(): string {
    return this.declEndItemWith(Token.SEMICOLON);
  }

  public bindTerm(): schema.Rule {
    return this.bindTermWith(
      Token.EQUALS_SIGN,
      seq(Token.EQUALS_SIGN, Token.GREATER_THAN_SIGN),
    );
  }

  public comment(): schema.Rule {
    return {
      patterns: [include(this.commentBlock), include(this.commentDoc)],
    };
  }

  public commentBlock(): schema.Rule {
    return this.commentBlockWith(Token.SOLIDUS, Token.SOLIDUS);
  }

  public commentDoc(): schema.Rule {
    return this.commentDocWith(Token.SOLIDUS, Token.SOLIDUS);
  }

  public recordWith(...definiens: schema.Rule[]): schema.Rule {
    return this.recordWithSep(...definiens);
  }

  public recordWithSep(...definiens: schema.Rule[]): schema.Rule {
    return {
      begin: Token.LEFT_CURLY_BRACKET,
      end: Token.RIGHT_CURLY_BRACKET,
      captures: {
        0: { name: `${Scope.TERM_CONSTRUCTOR()} ${Scope.STYLE_BOLD()}` },
      },
      patterns: [
        // include(this.bindTerm),
        {
          begin: lookBehind(alt(Token.LEFT_CURLY_BRACKET, Token.COMMA)),
          end: alt(
            capture(Token.COLON),
            capture(Token.EQUALS_SIGN),
            capture(Token.COMMA),
            lookAhead(Token.RIGHT_CURLY_BRACKET),
            capture(Token.LET),
          ),
          endCaptures: {
            1: { name: Scope.PUNCTUATION_COLON() },
            2: { name: Scope.PUNCTUATION_EQUALS() },
            3: { name: Scope.STYLE_OPERATOR() },
            4: { name: Scope.VALUE_LET() },
          },
          patterns: [
            include(this.comment),
            include(this.pathModulePrefixSimple),
            {
              match: this.identLower(),
              name: `${Scope.NAME_FIELD()} ${Scope.STYLE_ITALICS()}`,
            },
          ],
        },
        {
          begin: this.lastOps(Token.COLON, Token.EQUALS_SIGN),
          end: alt(Token.COMMA, lookAhead(Token.RIGHT_CURLY_BRACKET)),
          endCaptures: {
            0: { name: Scope.STYLE_OPERATOR() },
          },
          patterns: definiens,
        },
        include(this.bindTerm),
        // {
        //   begin: lastWords(),
        //   end: this.ops(Token.EQUALS_SIGN),
        //   patterns: [
        //     include(this.bindTermArgs),
        //   ],
        // },
      ],
    };
  }

  public signatureLiteral(): schema.Rule {
    return this.signatureLiteralWith(
      Token.LEFT_CURLY_BRACKET,
      Token.RIGHT_CURLY_BRACKET,
    );
  }

  public structureLiteral(): schema.Rule {
    return this.structureLiteralWith(
      Token.LEFT_CURLY_BRACKET,
      Token.RIGHT_CURLY_BRACKET,
    );
  }

  public typeRecord(): schema.Rule {
    return this.recordWithSep(include(this.type));
  }

  public render(): schema.IGrammar {
    return {
      name: `Reason`,
      scopeName: `source.reason`,
      fileTypes: [`.re`, `.rei`],
      patterns: [
        include(this.comment),
        include(this.pragma),
        include(this.decl),
      ],
      repository: {
        bindClassTerm: this.bindClassTerm(),
        bindClassType: this.bindClassType(),
        bindConstructor: this.bindConstructor(),
        bindSignature: this.bindSignature(),
        bindStructure: this.bindStructure(),
        bindTerm: this.bindTerm(),
        bindTermArgs: this.bindTermArgs(),
        bindType: this.bindType(),
        comment: this.comment(),
        commentBlock: this.commentBlock(),
        commentDoc: this.commentDoc(),
        decl: this.decl(),
        declClass: this.declClass(),
        declException: this.declException(),
        declInclude: this.declInclude(),
        declInherit: this.declInherit(),
        declModule: this.declModule(),
        declOpen: this.declOpen(),
        declTerm: this.declTerm(),
        declType: this.declType(),
        literal: this.literal(),
        literalArray: this.literalArray(),
        literalBoolean: this.literalBoolean(),
        literalCharacter: this.literalCharacter(),
        literalCharacterEscape: this.literalCharacterEscape(),
        literalClassType: this.literalClassType(),
        literalList: this.literalList(),
        literalNumber: this.literalNumber(),
        literalObjectTerm: this.literalObjectTerm(),
        literalRecord: this.literalRecord(),
        literalString: this.literalString(),
        literalStringEscape: this.literalStringEscape(),
        literalUnit: this.literalUnit(),
        pathModuleExtended: this.pathModuleExtended(),
        pathModulePrefixExtended: this.pathModulePrefixExtended(),
        pathModulePrefixExtendedParens: this.pathModulePrefixExtendedParens(),
        pathModulePrefixSimple: this.pathModulePrefixSimple(),
        pathModuleSimple: this.pathModuleSimple(),
        pathRecord: this.pathRecord(),
        pattern: this.pattern(),
        patternArray: this.patternArray(),
        patternLazy: this.patternLazy(),
        patternList: this.patternList(),
        patternMisc: this.patternMisc(),
        patternModule: this.patternModule(),
        patternParens: this.patternParens(),
        patternRecord: this.patternRecord(),
        patternType: this.patternType(),
        pragma: this.pragma(),
        signature: this.signature(),
        signatureConstraints: this.signatureConstraints(),
        signatureFunctor: this.signatureFunctor(),
        signatureLiteral: this.signatureLiteral(),
        signatureParens: this.signatureParens(),
        signatureRecovered: this.signatureRecovered(),
        structure: this.structure(),
        structureFunctor: this.structureFunctor(),
        structureLiteral: this.structureLiteral(),
        structureParens: this.structureParens(),
        structureUnpack: this.structureUnpack(),
        term: this.term(),
        termAtomic: this.termAtomic(),
        termConditional: this.termConditional(),
        termConstructor: this.termConstructor(),
        termDelim: this.termDelim(),
        termFor: this.termFor(),
        termFunction: this.termFunction(),
        termLet: this.termLet(),
        termMatch: this.termMatch(),
        termMatchRule: this.termMatchRule(),
        termOperator: this.termOperator(),
        termPun: this.termPun(),
        termTry: this.termTry(),
        termWhile: this.termWhile(),
        type: this.type(),
        typeConstructor: this.typeConstructor(),
        typeLabel: this.typeLabel(),
        typeModule: this.typeModule(),
        typeOperator: this.typeOperator(),
        typeParens: this.typeParens(),
        typePolymorphicVariant: this.typePolymorphicVariant(),
        typeRecord: this.typeRecord(),
        variableModule: this.variableModule(),
        variablePattern: this.variablePattern(),
      },
    };
  }
}

export default new Reason().render();
