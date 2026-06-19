declare namespace Item {
    type Parent = Actor.Implementation | Item.Implementation | null;
    namespace Embedded {
        type Name = 'ActiveEffect' | 'Item';
    }
}
