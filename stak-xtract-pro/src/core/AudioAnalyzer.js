import Meyda from 'meyda';
import { Essentia, EssentiaWASM } from 'essentia.js';

export class AudioAnalyzer {
    /**
     * @param {object} essentiaInstance - An instance of Essentia.js. If not provided, a new one will be created.
     * @param {object} meydaInstance - An instance of Meyda. If not provided, the default Meyda will be used.
     */
    constructor(essentiaInstance = null, meydaInstance = null) {
        // Allow dependency injection for testing
        this.essentia = essentiaInstance || new Essentia(EssentiaWASM);
        this.meyda = meydaInstance || Meyda;
    }

    extractFeatures(audioBuffer) {
        // Spectral features
        const mfcc = this.meyda.extract('mfcc', audioBuffer);
        const spectralCentroid = this.meyda.extract('spectralCentroid', audioBuffer);
        const zcr = this.meyda.extract('zcr', audioBuffer);

        // Rhythm features using Essentia
        const beats = this.essentia.RhythmExtractor2013(audioBuffer);
        const onset = this.essentia.OnsetDetection(audioBuffer);

        return {
            spectral: { mfcc, spectralCentroid, zcr },
            rhythm: { beats, onset },
            energy: this.calculateEnergy(audioBuffer)
        };
    }

    calculateEnergy(audioBuffer) {
        return this.meyda.extract('energy', audioBuffer);
    }
}
