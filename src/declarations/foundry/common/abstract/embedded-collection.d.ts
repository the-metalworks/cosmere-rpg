declare namespace foundry {
    namespace abstract {
        namespace EmbeddedCollection {
            export type Any<
                Parent extends
                    foundry.abstract.Document.Any = foundry.abstract.Document.Any,
            > = foundry.abstract.EmbeddedCollection<
                foundry.abstract.Document.Any,
                Parent
            >;
        }
    }
}
