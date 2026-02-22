export enum SurveyTriggerType {
    INSTANT = 'INSTANT',
    DELAYED = 'DELAYED',
}

export interface SurveyQuestion {
    id: string;
    text: string;
    type: 'rating' | 'choice' | 'text';
    options?: string[];
}

export interface TargetAudience {
    new: boolean;
    returning: boolean;
}

export interface Survey {
    id?: string;
    questions: SurveyQuestion[];
    triggerType: SurveyTriggerType;
    triggerDelay?: number;
    targetAudience: TargetAudience;
    isActive: boolean;
    businessId?: string;
}

export interface CreateSurveyRequest {
    questions: SurveyQuestion[];
    triggerType: SurveyTriggerType;
    triggerDelay?: number;
    targetAudience: TargetAudience;
    isActive: boolean;
}

export interface UpdateSurveyRequest extends Partial<CreateSurveyRequest> { }
