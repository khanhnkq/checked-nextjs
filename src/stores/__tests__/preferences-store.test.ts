import { describe, it, expect, beforeEach } from 'vitest';
import { usePreferencesStore } from '../preferences-store';

describe('Preferences Store (usePreferencesStore)', () => {
  beforeEach(() => {
    // Reset state before each test
    usePreferencesStore.setState({
      hapticsEnabled: true,
      soundEnabled: true,
      autoSavePhotos: false,
    });
    localStorage.clear();
  });

  describe('Initial state', () => {
    it('initializes with default values', () => {
      const state = usePreferencesStore.getState();
      expect(state.hapticsEnabled).toBe(true);
      expect(state.soundEnabled).toBe(true);
      expect(state.autoSavePhotos).toBe(false);
    });
  });

  describe('Setters', () => {
    it('sets hapticsEnabled to false and true', () => {
      usePreferencesStore.getState().setHapticsEnabled(false);
      expect(usePreferencesStore.getState().hapticsEnabled).toBe(false);

      usePreferencesStore.getState().setHapticsEnabled(true);
      expect(usePreferencesStore.getState().hapticsEnabled).toBe(true);
    });

    it('sets soundEnabled to false and true', () => {
      usePreferencesStore.getState().setSoundEnabled(false);
      expect(usePreferencesStore.getState().soundEnabled).toBe(false);

      usePreferencesStore.getState().setSoundEnabled(true);
      expect(usePreferencesStore.getState().soundEnabled).toBe(true);
    });

    it('sets autoSavePhotos to true and false', () => {
      usePreferencesStore.getState().setAutoSavePhotos(true);
      expect(usePreferencesStore.getState().autoSavePhotos).toBe(true);

      usePreferencesStore.getState().setAutoSavePhotos(false);
      expect(usePreferencesStore.getState().autoSavePhotos).toBe(false);
    });
  });

  describe('Togglers', () => {
    it('toggles hapticsEnabled between true and false', () => {
      expect(usePreferencesStore.getState().hapticsEnabled).toBe(true);

      usePreferencesStore.getState().toggleHaptics();
      expect(usePreferencesStore.getState().hapticsEnabled).toBe(false);

      usePreferencesStore.getState().toggleHaptics();
      expect(usePreferencesStore.getState().hapticsEnabled).toBe(true);
    });

    it('toggles soundEnabled between true and false', () => {
      expect(usePreferencesStore.getState().soundEnabled).toBe(true);

      usePreferencesStore.getState().toggleSound();
      expect(usePreferencesStore.getState().soundEnabled).toBe(false);

      usePreferencesStore.getState().toggleSound();
      expect(usePreferencesStore.getState().soundEnabled).toBe(true);
    });

    it('toggles autoSavePhotos between false and true', () => {
      expect(usePreferencesStore.getState().autoSavePhotos).toBe(false);

      usePreferencesStore.getState().toggleAutoSavePhotos();
      expect(usePreferencesStore.getState().autoSavePhotos).toBe(true);

      usePreferencesStore.getState().toggleAutoSavePhotos();
      expect(usePreferencesStore.getState().autoSavePhotos).toBe(false);
    });
  });
});
