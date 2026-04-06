declare namespace Item {
    type Parent = Actor.Implementation | Item.Implementation | null;

    namespace Database {
        interface Create<
            Temporary extends boolean | undefined = boolean | undefined,
        > extends foundry.abstract.types.DatabaseCreateOperation<
                Item.CreateData,
                Item.Parent,
                Temporary
            > {}
    }
}
