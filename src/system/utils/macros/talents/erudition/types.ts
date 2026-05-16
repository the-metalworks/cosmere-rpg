export interface EruditionConfig {
    skills: {
        count: number;
        groups: string[];
    };
    expertises: {
        count: number;
        types: string[];
    };
};

export interface EruditionSelections {
    skills: string[];
    expertises: string[];
}

export interface PickedExpertise {
    id: string;
    type: string;
    label?: string;
    custom?: boolean;
}