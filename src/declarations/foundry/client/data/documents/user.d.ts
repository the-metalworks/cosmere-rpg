declare interface User {
    name: string;
    avatar: string;
    role: number;
    id: string;

    get isGM(): boolean;
    get character(): Actor | undefined;
}
