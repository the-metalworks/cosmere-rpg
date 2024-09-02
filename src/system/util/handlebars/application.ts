import { AnyObject } from '@system/types/utils';

Handlebars.registerHelper(
    'component',
    (element: string, options?: { hash?: AnyObject }) => {
        // Get id
        const id = options?.hash?.id as string | undefined;

        // Params to array
        const params = Object.entries(options?.hash ?? {}).map(
            ([key, value]) => ({
                name: key,
                value: value as string | number | boolean | object,
                type: typeof value,
            }),
        );

        // Params to string
        const paramsStr = params
            .map((param) => [
                `param-${param.name}="${param.value.toString()}"`,
                `param-${param.name}__type="${param.type}"`,
            ])
            .flat()
            .join(' ');

        // Return component with params
        return `<${element} ${id ? `id="${id}"` : ''} ${paramsStr}></${element}>`;
    },
);
