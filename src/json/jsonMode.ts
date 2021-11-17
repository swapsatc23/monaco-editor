/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WorkerManager } from './workerManager';
import type { JSONWorker } from './jsonWorker';
import { LanguageServiceDefaults } from './monaco.contribution';
import * as languageFeatures from './languageFeatures';
import { createTokenizationSupport } from './tokenization';
import { Uri, IDisposable, languages } from '../fillers/monaco-editor-core';

export function setupMode(defaults: LanguageServiceDefaults): IDisposable {
	const disposables: IDisposable[] = [];
	const providers: IDisposable[] = [];

	const client = new WorkerManager(defaults);
	disposables.push(client);

	const worker: languageFeatures.WorkerAccessor = (...uris: Uri[]): Promise<JSONWorker> => {
		return client.getLanguageServiceWorker(...uris);
	};

	function registerProviders(): void {
		const { languageId, modeConfiguration } = defaults;

		disposeAll(providers);

		if (modeConfiguration.documentFormattingEdits) {
			providers.push(
				languages.registerDocumentFormattingEditProvider(
					languageId,
					new languageFeatures.JSONDocumentFormattingEditProvider(worker)
				)
			);
		}
		if (modeConfiguration.documentRangeFormattingEdits) {
			providers.push(
				languages.registerDocumentRangeFormattingEditProvider(
					languageId,
					new languageFeatures.JSONDocumentRangeFormattingEditProvider(worker)
				)
			);
		}
		if (modeConfiguration.completionItems) {
			providers.push(
				languages.registerCompletionItemProvider(
					languageId,
					new languageFeatures.JSONCompletionAdapter(worker)
				)
			);
		}
		if (modeConfiguration.hovers) {
			providers.push(
				languages.registerHoverProvider(languageId, new languageFeatures.JSONHoverAdapter(worker))
			);
		}
		if (modeConfiguration.documentSymbols) {
			providers.push(
				languages.registerDocumentSymbolProvider(
					languageId,
					new languageFeatures.JSONDocumentSymbolAdapter(worker)
				)
			);
		}
		if (modeConfiguration.tokens) {
			providers.push(languages.setTokensProvider(languageId, createTokenizationSupport(true)));
		}
		if (modeConfiguration.colors) {
			providers.push(
				languages.registerColorProvider(
					languageId,
					new languageFeatures.JSONDocumentColorAdapter(worker)
				)
			);
		}
		if (modeConfiguration.foldingRanges) {
			providers.push(
				languages.registerFoldingRangeProvider(
					languageId,
					new languageFeatures.JSONFoldingRangeAdapter(worker)
				)
			);
		}
		if (modeConfiguration.diagnostics) {
			providers.push(new languageFeatures.JSONDiagnosticsAdapter(languageId, worker, defaults));
		}
		if (modeConfiguration.selectionRanges) {
			providers.push(
				languages.registerSelectionRangeProvider(
					languageId,
					new languageFeatures.SelectionRangeAdapter(worker)
				)
			);
		}
	}

	registerProviders();

	disposables.push(languages.setLanguageConfiguration(defaults.languageId, richEditConfiguration));

	let modeConfiguration = defaults.modeConfiguration;
	defaults.onDidChange((newDefaults) => {
		if (newDefaults.modeConfiguration !== modeConfiguration) {
			modeConfiguration = newDefaults.modeConfiguration;
			registerProviders();
		}
	});

	disposables.push(asDisposable(providers));

	return asDisposable(disposables);
}

function asDisposable(disposables: IDisposable[]): IDisposable {
	return { dispose: () => disposeAll(disposables) };
}

function disposeAll(disposables: IDisposable[]) {
	while (disposables.length) {
		disposables.pop()!.dispose();
	}
}

const richEditConfiguration: languages.LanguageConfiguration = {
	wordPattern: /(-?\d*\.\d\w*)|([^\[\{\]\}\:\"\,\s]+)/g,

	comments: {
		lineComment: '//',
		blockComment: ['/*', '*/']
	},

	brackets: [
		['{', '}'],
		['[', ']']
	],

	autoClosingPairs: [
		{ open: '{', close: '}', notIn: ['string'] },
		{ open: '[', close: ']', notIn: ['string'] },
		{ open: '"', close: '"', notIn: ['string'] }
	]
};
