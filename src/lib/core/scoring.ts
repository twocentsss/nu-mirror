/**
 * Nu Flow Protocol - Scoring Engine
 * Implements the BPS / APS / SPS productivity calculations.
 */

// --- Scoring Inputs ---

export interface ScoringParams {
    // Task Weight (TW): 0-10
    tw: number;

    // Completion Percentage (CP): 0-1
    cp: number;

    // Effort Multipliers
    sm?: number; // Struggle Multiplier: 1.0 (low) to 1.5 (high)
    esf?: number; // Effort Scaling Factor: 0.8 (fatigue) to 1.2 (optimal)
    qm?: number; // Quality Multiplier: 0.5 (low) to 1.5 (high)

    // Streak & Burnout
    sf?: number; // Streak Factor: e.g. 1.0 (none), 1.2 (7-day), 1.5 (30-day)
    bp?: number; // Burnout Penalty: 0 (none) upwards e.g. 0.2
}

export interface ScoreResult {
    bps: number; // Base Productivity Score
    aps: number; // Adjusted Productivity Score
    sps: number; // Sustained Productivity Score
}

/**
 * Calculates the BPS, APS, and SPS scores based on the provided parameters.
 * 
 * Formulas:
 * BPS = TW * CP
 * APS = BPS * SM * ESF * QM
 * SPS = APS * SF * (1 - BP)
 */
export function calculateTaskScore(params: ScoringParams): ScoreResult {
    const {
        tw,
        cp,
        sm = 1.0,  // Default to 1.0 (neutral)
        esf = 1.0, // Default to 1.0 (neutral)
        qm = 1.0,  // Default to 1.0 (neutral)
        sf = 1.0,  // Default to 1.0 (neutral)
        bp = 0.0   // Default to 0.0 (no penalty)
    } = params;

    // 1. Base Productivity Score
    const bps = tw * cp;

    // 2. Adjusted Productivity Score
    // APS = BPS * SM * ESF * QM
    const aps = bps * sm * esf * qm;

    // 3. Sustained Productivity Score
    // SPS = APS * SF * (1 - BP)
    // Clamp BP to max 1.0 to avoid negative scores if overly burned out
    const effectiveBp = Math.min(bp, 1.0);
    const sps = aps * sf * (1 - effectiveBp);

    // Return formatted results (rounded to 3 decimals typically, but we keep precision here)
    return {
        bps,
        aps,
        sps
    };
}
