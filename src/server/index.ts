import * as feature from "./feature";
import { Session } from "./session";

const session = new Session();
session.connection.onInitialize(feature.initialize.handler(session));
session.connection.onCodeLens(feature.codeLens.handler(session));
session.connection.onCodeLensResolve(feature.codeLensResolve.handler(session));
session.connection.onCompletion(feature.completion.handler(session));
session.connection.onCompletionResolve(feature.completionResolve.handler(session));
session.connection.onDefinition(feature.definition.handler(session));
session.connection.onDocumentSymbol(feature.documentSymbol.handler(session));
session.connection.onHover(feature.hover.handler(session));
session.connection.onRequest({ method: "caseAnalysis" }, feature.caseAnalysis.handler(session));
session.listen();
