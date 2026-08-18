import { Derived } from '@system/data/fields';

export class CosmereTokenDocument extends TokenDocument {
    public override getBarAttribute(
        barName: string,
        options?: Partial<{ alternative: string }> | undefined,
    ) {
        const attr = super.getBarAttribute(barName, options);

        if (attr && attr.type === 'bar') {
            // Get data
            const data = foundry.utils.getProperty(
                this.actor!.system,
                attr.attribute,
            ) as { max: number | Derived<number> };

            if (typeof data.max === 'object') {
                attr.max = data.max.value;
            }
        }

        return attr;
    }
}

declare module '@league-of-foundry-developers/foundry-vtt-types/configuration' {
    interface DocumentClassConfig {
        Token: typeof CosmereTokenDocument;
    }
}
