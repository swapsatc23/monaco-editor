/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WorkerManager } from './workerManager';
import type { HTMLWorker } from './htmlWorker';
import { LanguageServiceDefaults } from './monaco.contribution';
import * as languageFeatures from './languageFeatures';
import { Uri, IDisposable, languages } from '../fillers/monaco-editor-core';

export function setupMode1(defaults: LanguageServiceDefaults): void {
	const client = new WorkerManager(defaults);

	const worker: languageFeatures.WorkerAccessor = (...uris: Uri[]): Promise<HTMLWorker> => {
		return client.getLanguageServiceWorker(...uris);
	};

	let languageId = defaults.languageId;

	// all modes
	languages.registerCompletionItemProvider(
		languageId,
		new languageFeatures.HTMLCompletionAdapter(worker)
	);
	languages.registerHoverProvider(languageId, new languageFeatures.HTMLHoverAdapter(worker));

	languages.registerDocumentHighlightProvider(
		languageId,
		new languageFeatures.HTMLDocumentHighlightAdapter(worker)
	);
	languages.registerLinkProvider(languageId, new languageFeatures.DocumentLinkAdapter(worker));
	languages.registerFoldingRangeProvider(
		languageId,
		new languageFeatures.FoldingRangeAdapter(worker)
	);
	languages.registerDocumentSymbolProvider(
		languageId,
		new languageFeatures.DocumentSymbolAdapter(worker)
	);
	languages.registerSelectionRangeProvider(
		languageId,
		new languageFeatures.SelectionRangeAdapter(worker)
	);
	languages.registerRenameProvider(languageId, new languageFeatures.HTMLRenameAdapter(worker));

	// only html
	if (languageId === 'html') {
		languages.registerDocumentFormattingEditProvider(
			languageId,
			new languageFeatures.DocumentFormattingEditProvider(worker)
		);
		languages.registerDocumentRangeFormattingEditProvider(
			languageId,
			new languageFeatures.DocumentRangeFormattingEditProvider(worker)
		);
	}
}

export function setupMode(defaults: LanguageServiceDefaults): IDisposable {
	const disposables: IDisposable[] = [];
	const providers: IDisposable[] = [];

	const client = new WorkerManager(defaults);
	disposables.push(client);

	const worker: languageFeatures.WorkerAccessor = (...uris: Uri[]): Promise<HTMLWorker> => {
		return client.getLanguageServiceWorker(...uris);
	};

	function registerProviders(): void {
		const { languageId, modeConfiguration } = defaults;

		disposeAll(providers);

		if (modeConfiguration.completionItems) {
			providers.push(
				languages.registerCompletionItemProvider(
					languageId,
					new languageFeatures.HTMLCompletionAdapter(worker)
				)
			);
		}
		if (modeConfiguration.hovers) {
			providers.push(
				languages.registerHoverProvider(languageId, new languageFeatures.HTMLHoverAdapter(worker))
			);
		}
		if (modeConfiguration.documentHighlights) {
			providers.push(
				languages.registerDocumentHighlightProvider(
					languageId,
					new languageFeatures.HTMLDocumentHighlightAdapter(worker)
				)
			);
		}
		if (modeConfiguration.links) {
			providers.push(
				languages.registerLinkProvider(languageId, new languageFeatures.DocumentLinkAdapter(worker))
			);
		}
		if (modeConfiguration.documentSymbols) {
			providers.push(
				languages.registerDocumentSymbolProvider(
					languageId,
					new languageFeatures.DocumentSymbolAdapter(worker)
				)
			);
		}
		if (modeConfiguration.rename) {
			providers.push(
				languages.registerRenameProvider(languageId, new languageFeatures.HTMLRenameAdapter(worker))
			);
		}
		if (modeConfiguration.foldingRanges) {
			providers.push(
				languages.registerFoldingRangeProvider(
					languageId,
					new languageFeatures.FoldingRangeAdapter(worker)
				)
			);
		}
		if (modeConfiguration.selectionRanges) {
			providers.push(
				languages.registerSelectionRangeProvider(
					languageId,
					new languageFeatures.SelectionRangeAdapter(worker)
				)
			);
		}
		if (modeConfiguration.documentFormattingEdits) {
			providers.push(
				languages.registerDocumentFormattingEditProvider(
					languageId,
					new languageFeatures.DocumentFormattingEditProvider(worker)
				)
			);
		}
		if (modeConfiguration.documentRangeFormattingEdits) {
			providers.push(
				languages.registerDocumentRangeFormattingEditProvider(
					languageId,
					new languageFeatures.DocumentRangeFormattingEditProvider(worker)
				)
			);
		}
	}

	registerProviders();

	disposables.push(asDisposable(providers));

	return asDisposable(disposables);
}

function asDisposable(disposables: IDisposable[]): IDisposable {
	return { dispose: () => disposeAll(disposables) };
}

function disposeAll(disposables: IDisposable[]) {
	while (disposables.length) {
		disposables.pop().dispose();
	}
}
