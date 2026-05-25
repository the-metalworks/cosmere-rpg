declare module '*.svelte' {
  import type { SvelteComponentTyped } from 'svelte';

  export default class SvelteComponent extends SvelteComponentTyped<
    Record<string, any>,
    Record<string, any>,
    Record<string, any>
  > {}
}