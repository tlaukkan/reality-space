export interface SceneManagement {
    saveSceneFragment(sceneFragment: string): string;

    removeSceneFragment(sceneFragment: string): void;

    getScene(): string;
}