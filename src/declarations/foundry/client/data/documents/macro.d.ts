declare interface Macro {
    static create(data: object): Promise<foundry.documents.BaseMacro>;
}
