declare namespace Dice3D {
    interface SystemData {
        id: string;
        name?: string;
        group?: string;
    }

    type AddSystemMode = 'default' | 'preferred';

    interface DicePresetData {
        /**
         * should be a registered dice term
         */
        type: string;

        /**
         * contains either string (Unicode) or a path to a texture (png, gif, jpg, webp)
         */
        labels: string[];

        /**
         * should be a system ID previously registered
         */
        system: string;

        /**
         * name of a colorset (either a custom one or from the DsN colorset list)
         */
        colorset?: string;

        /**
         * name of the font family. This can be a Webfont too.
         * This setting overwrites the colorset font setting
         */
        font?: string;

        /**
         * scale of the font size (default: 1).
         * This setting overwrite the colorset fontScale setting
         */
        fontScale?: number;

        /**
         * array of bumpMap textures that should follow the exact same order as labels
         */
        bumpMaps?: string[];

        /**
         * object with the min and max value on the die
         */
        values?: object;

        /**
         * array of emissive textures that should follow the exact same order as labels
         */
        emissiveMaps?: string;

        /**
         * color of the light (hexa code) emited by the dice. Default: 0x000000 (no light)
         */
        emissive?: number;

        /**
         * TexturePacker json spritesheet that contains labels/bumps/emissiveMaps for this dice preset.
         * Can be used for multiple type to create a single spritesheet for a full dice set.
         */
        atlas?: string;
    }

    type DiceShape =
        | 'd2'
        | 'd4'
        | 'd6'
        | 'd8'
        | 'd10'
        | 'd12'
        | 'd14'
        | 'd16'
        | 'd20'
        | 'd24'
        | 'd30';
}

declare interface Dice3D {
    /**
     * Register a new system
     * The id is to be used with the addDicePreset method
     * The name can be a localized string
     * The group is a string that is only used to group multiple systems in the system list.
     * Could be the name of the brand, or of a collection
     * @param system {id, name, group}
     * @param mode "preferred", "default". "preferred" will enable this system by default until a user changes it to anything else.
     *              Default will add the system as a choice left to each user.
     */
    addSystem(system: Dice3D.SystemData, mode: Dice3D.AddSystemMode | boolean): void;

    /**
     * Register a new dice preset
     * @param data the informations on the new dice preset
     * @param shape should be explicit when using a custom die term.
     *              Supported shapes are d2,d4,d6,d8,d10,d12,d14,d16,d20,d24,d30
     */
    addDicePreset(data: Dice3D.DicePresetData, shape?: Dice3D.DiceShape): void;
}