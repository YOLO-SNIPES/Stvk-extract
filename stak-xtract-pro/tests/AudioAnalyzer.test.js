import { AudioAnalyzer } from '../src/core/AudioAnalyzer.js';
import Meyda from 'meyda';
import { Essentia } from 'essentia.js';

// Mock the external dependencies
jest.mock('meyda', () => ({
  extract: jest.fn(),
}));

// Mock Essentia.js. We need to mock the constructor and the methods of its instance.
const mockEssentiaInstance = {
  RhythmExtractor2013: jest.fn().mockReturnValue({ beats: [1, 2, 3] }),
  OnsetDetection: jest.fn().mockReturnValue({ onsets: [0.5, 1.5] }),
};
jest.mock('essentia.js', () => ({
  Essentia: jest.fn().mockImplementation(() => mockEssentiaInstance),
  EssentiaWASM: jest.fn(),
}));

describe('AudioAnalyzer', () => {
  let audioAnalyzer;
  let mockAudioBuffer;

  beforeEach(() => {
    // Reset mocks before each test
    Meyda.extract.mockClear();
    mockEssentiaInstance.RhythmExtractor2013.mockClear();
    mockEssentiaInstance.OnsetDetection.mockClear();

    audioAnalyzer = new AudioAnalyzer();
    // Create a mock audio buffer for testing
    mockAudioBuffer = new Float32Array(1024).fill(0.5);
  });

  test('should be instantiated correctly', () => {
    expect(audioAnalyzer).toBeInstanceOf(AudioAnalyzer);
    // Check if the essentia instance was created
    expect(Essentia).toHaveBeenCalledTimes(1);
  });

  test('extractFeatures should call Meyda and Essentia methods with the correct arguments', () => {
    audioAnalyzer.extractFeatures(mockAudioBuffer);

    // Verify that Meyda.extract was called for each spectral feature
    expect(Meyda.extract).toHaveBeenCalledWith('mfcc', mockAudioBuffer);
    expect(Meyda.extract).toHaveBeenCalledWith('spectralCentroid', mockAudioBuffer);
    expect(Meyda.extract).toHaveBeenCalledWith('zcr', mockAudioBuffer);
    expect(Meyda.extract).toHaveBeenCalledWith('energy', mockAudioBuffer);
    expect(Meyda.extract).toHaveBeenCalledTimes(4);

    // Verify that Essentia methods were called
    expect(mockEssentiaInstance.RhythmExtractor2013).toHaveBeenCalledWith(mockAudioBuffer);
    expect(mockEssentiaInstance.RhythmExtractor2013).toHaveBeenCalledTimes(1);
    expect(mockEssentiaInstance.OnsetDetection).toHaveBeenCalledWith(mockAudioBuffer);
    expect(mockEssentiaInstance.OnsetDetection).toHaveBeenCalledTimes(1);
  });

  test('extractFeatures should return an object with the correct structure and data', () => {
    // Configure mock return values for this specific test
    Meyda.extract.mockImplementation((feature) => {
      const mockData = {
        mfcc: [1, 2, 3, 4],
        spectralCentroid: 1500,
        zcr: 100,
        energy: 0.6,
      };
      return mockData[feature];
    });

    const features = audioAnalyzer.extractFeatures(mockAudioBuffer);

    // Check the structure of the returned object
    expect(features).toHaveProperty('spectral');
    expect(features).toHaveProperty('rhythm');
    expect(features).toHaveProperty('energy');

    // Check the content of the returned object
    expect(features.spectral).toEqual({
      mfcc: [1, 2, 3, 4],
      spectralCentroid: 1500,
      zcr: 100,
    });

    expect(features.rhythm).toEqual({
      beats: { beats: [1, 2, 3] }, // The mock essentia returns this structure
      onset: { onsets: [0.5, 1.5] },
    });

    expect(features.energy).toBe(0.6);
  });
});
