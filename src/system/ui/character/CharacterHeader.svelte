<script lang="ts">
    export let name: string;
    export let isEditMode: boolean = false;
    export let ancestryLabel: string = '';
    export let levelLabel: string = '';
    export let pathTypes: Array<{
        paths: Array<{name: string}>;
    }> = [];
    export let level: number = 1;
    export let onNameChange: (value: string) => void;
    export let onLevelChange: (value: number) => void;

    let localName = name;
    let localLevel = level;

    function saveName() {
        const trimmed = localName.trim();

        if(trimmed && trimmed !== name){
            onNameChange(trimmed);
        }
    }

    function saveLevel() {
        onLevelChange(localLevel)
    }
</script>

<header class="sheet-header">
    <div class="title">
        <h1 class="document-name">            
            <input 
                class="value" 
                type="text" 
                name="name" 
                bind:value={localName} 
                readonly={!isEditMode}
                on:blur={saveName}
            />           
        </h1>

        <div class="details">
            <span class="ancestry">{ancestryLabel}</span>

            {#if pathTypes.length > 0}
                <i class="cosmere-icon delim">o</i>

                {#each pathTypes as curPathType, ti}
                    {#each curPathType.paths as curPath, pi}
                        <span class="path">{curPath.name}</span>
                        {#if pi < curPathType.paths.length - 1}
                            <span class="path">/</span>
                        {/if}
                    {/each}
                    {#if ti < pathTypes.length - 1}
                        <i class="cosmere-icon delim">o</i>
                    {/if}
                {/each}
            {/if}
        </div>
    </div>

    <div class="level-details">
        <div class="sheet-stack level">
            <span class="label">{levelLabel}</span>
            <div class="container">
                <div class="background" />
                <div class="star" />
                <div class="border" />

                <input 
                    class="value"
                    type="number"
                    name="system.level"
                    bind:value={localLevel}
                    min="1"
                    step="1"
                    readonly={!isEditMode}
                    on:blur={saveLevel}
                />
            </div>
        </div>
    </div>
</header>