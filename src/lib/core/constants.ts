/**
 * Nu Flow Protocol - Core Constants
 * Default configurations for Life Focus pillars and other static data.
 */

import { LifeFocus, LifeFocusId } from './types';

export const LIFE_FOCUS_DEFAULTS: Record<LifeFocusId, LifeFocus> = {
    CORE: {
        id: 'CORE',
        name: 'Core',
        description: 'Identity, Faith, Meaning, and Scripts.',
        color: '#000000', // TBD
        icon: '🕋'
    },
    SELF: {
        id: 'SELF',
        name: 'Self',
        description: 'Heart, Body, Mind, and Internal Systems.',
        color: '#FF5733', // TBD
        icon: '🧘'
    },
    CIRCLE: {
        id: 'CIRCLE',
        name: 'Circle',
        description: 'Family, Marriage, Friends, and Social Network.',
        color: '#33FF57', // TBD
        icon: '🤝'
    },
    GRIND: {
        id: 'GRIND',
        name: 'Grind',
        description: 'Work, Responsibilities, and Economic Engine.',
        color: '#3357FF', // TBD
        icon: '💼'
    },
    LEVEL_UP: {
        id: 'LEVEL_UP',
        name: 'Level Up',
        description: 'Skills, Business Building (Nu), and Growth.',
        color: '#FF33A1', // TBD
        icon: '🚀'
    },
    IMPACT: {
        id: 'IMPACT',
        name: 'Impact',
        description: 'Giving Back, Community, and Nature.',
        color: '#33FFF2', // TBD
        icon: '🌍'
    },
    PLAY: {
        id: 'PLAY',
        name: 'Play',
        description: 'Creativity, Exploration, Travel, and Joy.',
        color: '#F2FF33', // TBD
        icon: '🎨'
    },
    INSIGHT: {
        id: 'INSIGHT',
        name: 'Insight',
        description: 'Knowledge, Philosophy, and Tech Understanding.',
        color: '#A133FF', // TBD
        icon: '💡'
    },
    CHAOS: {
        id: 'CHAOS',
        name: 'Chaos',
        description: 'The Unexpected, Crises, and Life Weather.',
        color: '#808080', // Grey
        icon: '🌪️'
    }
};

export const DIMENSION_LABELS: Record<string, string> = {
    entity: 'Entity',
    action: 'Action',
    context: 'Context',
    intent: 'Intent',
    outcome: 'Outcome',
    time: 'Time',
    meaning: 'Meaning',
    state: 'State',
    values: 'Values',
    relationships: 'Relationships',
    principles: 'Principles',
    station: 'Station'
};
