import { Expertise } from '@src/system/data/actor/common';
import {
    AttributeGroup,
    ExpertiseType,
    Skill,
} from '@src/system/types/cosmere';

export interface EruditionConfig {
    skills: {
        count: number;
        groups: AttributeGroup[];
    };
    expertises: {
        count: number;
        types: ExpertiseType[];
    };
}

export interface EruditionSelections {
    skills: Skill[];
    expertises: Expertise[];
}

export interface PickedExpertise {
    id: string;
    type: ExpertiseType;
    label?: string;
    custom?: boolean;
}
