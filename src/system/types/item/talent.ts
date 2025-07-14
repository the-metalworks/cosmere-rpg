export const enum Type {
    Ancestry = 'ancestry',
    Path = 'path',
    Power = 'power',
}

export const enum SourceType {
    Ancestry = 'ancestry',
    Path = 'path',
    Power = 'power',
    Tree = 'tree',
}

export interface Source {
    type: SourceType;
    id: string;
    uuid: string;
}
