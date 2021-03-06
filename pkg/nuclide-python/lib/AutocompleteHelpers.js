'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {PythonCompletion} from '../../nuclide-python-base/lib/PythonService';

import {trackTiming} from '../../nuclide-analytics';
import {TYPES} from './constants';
import {getCompletions} from './jedi-client-helpers';
import {getAutocompleteArguments, getIncludeOptionalArguments} from './config';

const VALID_EMPTY_SUFFIX = /(\.|\()$/;
const TRIGGER_COMPLETION_REGEX = /([\. ]|[a-zA-Z_][a-zA-Z0-9_]*)$/;

/**
 * Generate a function-signature line string if completion is a function.
 * Otherwise just return the completion text.
 * @param  completion           The completion object to get text of.
 * @param  includeOptionalArgs  Whether or not to skip optional python arguments,
 *   including keyword args with default values, and star args (*, *args, **kwargs)
 * @param  createPlaceholders   Create snippet placeholders for the arguments
 *   instead of plain text.
 * @return string               Textual representation of the completion.
 */
function getText(
  completion: PythonCompletion,
  includeOptionalArgs: boolean = true,
  createPlaceholders: boolean = false,
): string {
  if (completion.params) {
    const params = includeOptionalArgs
      ? completion.params
      : completion.params.filter(param =>
        param.indexOf('=') < 0 && param.indexOf('*') < 0
      );

    const paramTexts = params.map((param, index) => {
      return createPlaceholders ? `\${${index + 1}:${param}}` : param;
    });
    return `${completion.text}(${paramTexts.join(', ')})`;
  }

  return completion.text;
}

export default class AutocompleteHelpers {

  @trackTiming('nuclide-python:getAutocompleteSuggestions')
  static async getAutocompleteSuggestions(
    request: atom$AutocompleteRequest,
  ): Promise<Array<atom$AutocompleteSuggestion>> {
    const {editor, activatedManually, prefix} = request;

    if (!TRIGGER_COMPLETION_REGEX.test(prefix)) {
      return [];
    }

    if (!activatedManually && prefix === '') {
      const wordPrefix = editor.getLastCursor().getCurrentWordPrefix();
      if (!VALID_EMPTY_SUFFIX.test(wordPrefix)) {
        return [];
      }
    }

    let result;
    try {
      result = await getCompletions(editor);
    } catch (e) {
      return [];
    }
    if (result == null) {
      return [];
    }

    return result.map(completion => {
      // Always display optional arguments in the UI.
      const displayText = getText(completion);
      // Only autocomplete arguments if the include optional arguments setting is on.
      const snippet = getAutocompleteArguments()
        ? getText(completion, getIncludeOptionalArguments(), true /* createPlaceholders */)
        : completion.text;
      return {
        displayText,
        snippet,
        type: TYPES[completion.type],
        description: completion.description,
      };
    });
  }

}
