type SvelteComponentInstance = {
    $destroy: () => void;
};

type SvelteComponentConstructor<TProps> = new (options: {
    target: HTMLElement;
    props: TProps;
}) => SvelteComponentInstance;

export function mountSvelteComponent<TProps>(
    current: SvelteComponentInstance | undefined,
    Component: SvelteComponentConstructor<TProps>,
    target: HTMLElement | null,
    props: TProps,
): SvelteComponentInstance | undefined {
    if (!target) return current;

    current?.$destroy();

    return new Component({
        target,
        props,
    });
}

export function destroySvelteComponent(
    current: SvelteComponentInstance | undefined,
): undefined {
    current?.$destroy();

    return undefined;
}