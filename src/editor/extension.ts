import Markpilot from 'src/main';
import { debounceAsyncFunc } from '../utils';
import {
  acceptCompletionsOnKeydown,
  rejectCompletionsOnKeydown,
} from './keymap';
import { showCompletionsOnUpdate } from './listener';
import { completionsStateField } from './state';
import { completionsRenderPlugin } from './view';

export type CompletionsFetcher = (
  language: string,
  prefix: string,
  suffix: string,
) => Promise<string | undefined>;

export type CompletionsCancel = () => void;
export type CompletionsForce = () => void;

export function inlineCompletionsExtension(
  fetcher: CompletionsFetcher,
  plugin: Markpilot,
) {
  const { settings } = plugin;
  const { debounced, cancel, force } = debounceAsyncFunc(
    fetcher,
    settings.completions.waitTime,
  );

  return [
    completionsStateField,
    completionsRenderPlugin,
    showCompletionsOnUpdate(debounced, plugin),
    acceptCompletionsOnKeydown(force, plugin),
    rejectCompletionsOnKeydown(cancel, plugin),
  ];
}
