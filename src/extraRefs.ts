import { commands, ExtensionContext, window } from "vscode";
import * as ls from 'vscode-languageserver-types';
import { CclsClient } from "./client";
import { jumpToUriAtPosition } from "./utils";

function makeRefHandler(
  ccls: CclsClient, methodName: string, extraParams: object = {},
  autoGotoIfSingle = false) {
  return () => {
    let position = window.activeTextEditor.selection.active;
    let uri = window.activeTextEditor.document.uri;
    ccls.client
      .sendRequest(methodName, {
        textDocument: {
          uri: uri.toString(),
        },
        position: position,
        ...extraParams,
      })
      .then((locations: Array<ls.Location>) => {
        if (autoGotoIfSingle && locations.length == 1) {
          let location =
            ccls.client.protocol2CodeConverter.asLocation(locations[0]);
          jumpToUriAtPosition(location.uri, location.range.start, /* preserveFocus */false);
        } else {
          commands.executeCommand(
            'editor.action.showReferences', uri, position,
            locations.map(ccls.client.protocol2CodeConverter.asLocation));
        }
      })
  }
}

export function activate(context: ExtensionContext, ccls: CclsClient) {
  commands.registerCommand('ccls.vars', makeRefHandler(ccls, '$ccls/vars'));
  commands.registerCommand('ccls.callers', makeRefHandler(ccls, '$ccls/call'));
  commands.registerCommand('ccls.base', makeRefHandler(ccls, '$ccls/inheritance',
                           { derived: false }, true));
}
