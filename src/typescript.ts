/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as ts from '../lib/typescriptServices';
import {TypeScriptWorker} from './worker';

import Emitter = monaco.Emitter;
import Promise = monaco.Promise;
import Uri = monaco.Uri;
import IDisposable = monaco.IDisposable;

// --- TypeScript configuration and defaults ---------

export interface DiagnosticsOptions {
	noSemanticValidation?: boolean;
	noSyntaxValidation?: boolean;
}

export class LanguageServiceDefaults {

	private _onDidChange = new Emitter<LanguageServiceDefaults>();
	private _extraLibs: { [path: string]: string };
	private _compilerOptions: ts.CompilerOptions;
	private _diagnosticsOptions: DiagnosticsOptions;

	constructor(compilerOptions: ts.CompilerOptions, diagnosticsOptions: DiagnosticsOptions) {
		this._extraLibs = Object.create(null);
		this.setCompilerOptions(compilerOptions);
		this.setDiagnosticsOptions(diagnosticsOptions);
	}

	get onDidChange(): monaco.IEvent<LanguageServiceDefaults>{
		return this._onDidChange.event;
	}

	get extraLibs(): { [path: string]: string } {
		return Object.freeze(this._extraLibs);
	}

	addExtraLib(content: string, filePath?: string): IDisposable {
		if (typeof filePath === 'undefined') {
			filePath = `ts:extralib-${Date.now()}`;
		}

		if (this._extraLibs[filePath]) {
			throw new Error(`${filePath} already a extra lib`);
		}

		this._extraLibs[filePath] = content;
		this._onDidChange.fire(this);

		return {
			dispose: () => {
				if (delete this._extraLibs[filePath]) {
					this._onDidChange.fire(this);
				}
			}
		};
	}

	get compilerOptions(): ts.CompilerOptions {
		return this._compilerOptions;
	}

	setCompilerOptions(options: ts.CompilerOptions): void {
		this._compilerOptions = options || Object.create(null);
		this._onDidChange.fire(this);
	}

	get diagnosticsOptions(): DiagnosticsOptions {
		return this._diagnosticsOptions;
	}

	setDiagnosticsOptions(options: DiagnosticsOptions): void {
		this._diagnosticsOptions = options || Object.create(null);
		this._onDidChange.fire(this);
	}
}

export const typeScriptDefaults = new LanguageServiceDefaults(
	{ allowNonTsExtensions: true, target: ts.ScriptTarget.Latest },
	{ noSemanticValidation: false, noSyntaxValidation: false });

export const javaScriptDefaults = new LanguageServiceDefaults(
	{ allowNonTsExtensions: true, allowJs: true, target: ts.ScriptTarget.Latest },
	{ noSemanticValidation: true, noSyntaxValidation: false });


// --- TypeScript worker protocol ---------

export interface LanguageServiceMode {
	getLanguageServiceWorker(...resources: Uri[]): Promise<TypeScriptWorker>;
}
