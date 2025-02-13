import { CosmereItem } from '../documents';

export interface Migration {
    /**
     * The version this migration upgrades from
     */
    from: string;

    /**
     * The version this migration upgrades to
     */
    to: string;

    /**
     * The function to execute the migration
     */
    execute: () => Promise<void>;
}
