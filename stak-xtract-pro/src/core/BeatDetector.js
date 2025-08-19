import { fft } from 'fft-js';

export class BeatDetector {
    constructor() {
        this.previousSpectrum = null;
    }

    /**
     * Detects beats in an audio buffer using a spectral flux algorithm.
     * @param {Float32Array} audioBuffer - The audio data.
     * @param {number} sensitivity - The sensitivity of the beat detection.
     * @param {number} sampleRate - The sample rate of the audio.
     * @returns {Array<object>} - An array of detected beat objects.
     */
    detectBeats(audioBuffer, sensitivity = 0.5, sampleRate = 44100) {
        const frameSize = 2048;
        const hopSize = 512;
        const beats = [];
        this.previousSpectrum = null; // Reset for each new detection

        for (let i = 0; i < audioBuffer.length - frameSize; i += hopSize) {
            const frame = audioBuffer.slice(i, i + frameSize);
            const flux = this.calculateSpectralFlux(frame);

            // Normalize flux and compare with sensitivity
            if (flux > sensitivity) {
                beats.push({
                    time: (i + hopSize) / sampleRate,
                    strength: flux,
                    type: this.classifyBeat(frame)
                });
            }
        }

        return this.filterBeats(beats);
    }

    /**
     * Calculates the spectral flux between the current and previous audio frames.
     * @param {Float32Array} frame - The current audio frame.
     * @returns {number} - The calculated spectral flux.
     */
    calculateSpectralFlux(frame) {
        // fft-js expects a plain array of numbers
        const frameArray = Array.from(frame);
        const phasors = fft(frameArray);

        // We only need the first half of the spectrum (due to Nyquist theorem)
        const spectrum = new Float32Array(frameArray.length / 2);
        for (let i = 0; i < frameArray.length / 2; i++) {
            const real = phasors[i][0];
            const imag = phasors[i][1];
            spectrum[i] = Math.sqrt(real * real + imag * imag);
        }

        let flux = 0;
        if (this.previousSpectrum) {
            // Calculate the sum of positive changes in magnitude
            for (let i = 0; i < spectrum.length; i++) {
                const diff = spectrum[i] - this.previousSpectrum[i];
                if (diff > 0) {
                    flux += diff;
                }
            }
        }

        this.previousSpectrum = spectrum;

        // Normalize the flux by the number of frequency bins
        return flux / (frame.length / 2);
    }

    /**
     * Classifies the type of beat. Placeholder implementation.
     * @param {Float32Array} frame - The audio frame of the beat.
     * @returns {string} - The type of the beat.
     */
    classifyBeat(frame) {
        // This is a placeholder. A real implementation would require
        // more sophisticated analysis (e.g., spectral centroid) or a
        // machine learning model to classify beat types (kick, snare, etc.).
        return 'beat';
    }

    /**
     * Filters the detected beats to remove duplicates (debouncing).
     * @param {Array<object>} beats - The array of detected beats.
     * @param {number} minTimeGap - The minimum time gap between beats in seconds.
     * @returns {Array<object>} - The filtered array of beats.
     */
    filterBeats(beats, minTimeGap = 0.08) {
        if (beats.length === 0) {
            return [];
        }

        const filteredBeats = [beats[0]];
        for (let i = 1; i < beats.length; i++) {
            const timeDiff = beats[i].time - filteredBeats[filteredBeats.length - 1].time;
            if (timeDiff > minTimeGap) {
                filteredBeats.push(beats[i]);
            } else if (beats[i].strength > filteredBeats[filteredBeats.length - 1].strength) {
                // If a new beat is detected within the same time window, keep the stronger one.
                filteredBeats[filteredBeats.length - 1] = beats[i];
            }
        }

        return filteredBeats;
    }
}
