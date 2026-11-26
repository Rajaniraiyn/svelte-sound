import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';
import { createSound, type SoundConfig } from './sound.js';
import type { SoundControls } from './core.js';

type Input<T> = T | (() => T);
const read = <T>(value: Input<T>): T =>
  typeof value === 'function' ? (value as () => T)() : value;

interface Events {
  onError?: (error: Error) => void;
  on?: keyof HTMLElementEventMap;
  stopOn?: keyof HTMLElementEventMap;
}

export type SoundAttachmentOptions = Events &
  (
    | (Omit<SoundConfig, 'preload'> & {
        player?: never;
        preload?: boolean | 'intent';
      })
    | {
        player: SoundControls;
        src?: never;
        disabled?: boolean;
        preload?: boolean | 'intent';
      }
  );

/** Bind DOM events. A supplied player keeps its existing settings and ownership. */
export function sound(
  input: Input<SoundAttachmentOptions | string>,
): Attachment<HTMLElement> {
  const config = $derived.by(() => {
    const value = read(input);
    return typeof value === 'string' ? { src: value } : value;
  });
  return (node) => {
    const report = (reason: unknown) => {
      const error =
        reason instanceof Error ? reason : new Error(String(reason));
      const handle = config.onError;
      if (handle) handle(error);
      else
        node.dispatchEvent(
          new CustomEvent('sounderror', { detail: error, bubbles: true }),
        );
    };
    const event = $derived(config.on ?? 'click');
    const stopOn = $derived(config.stopOn);
    const disabled = $derived(config.disabled);
    const preload = $derived(config.preload);
    const provided = $derived(config.player);
    $effect(() => {
      const supplied = provided;
      const player =
        supplied ??
        createSound(() => ({
          ...(config as SoundConfig),
          preload: false,
        }));
      let active = true;
      $effect(() => {
        if (disabled) {
          player.stop();
          return;
        }
        const offPlay = on(node, event, () => {
          void player.play().catch((error) => {
            if (active) report(error);
          });
        });
        const load = () => {
          void player.load().catch((error) => {
            if (active) report(error);
          });
        };
        if (preload === true) load();
        const intent =
          preload === 'intent'
            ? [
                on(node, 'pointerenter', load),
                on(node, 'focusin', load),
                on(node, 'pointerdown', load, { passive: true }),
              ]
            : [];
        const offStop = stopOn
          ? on(node, stopOn, () => player.stop())
          : undefined;
        return () => {
          offPlay();
          offStop?.();
          for (const off of intent) off();
        };
      });
      return () => {
        active = false;
      };
    });
  };
}
